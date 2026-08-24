const { Appointment } = require('../models/Appointment');
const { MedicalImageAnalysis } = require('../models/MedicalImageAnalysis');
const { updateAppointmentPriority } = require('../services/queueService');
const { socketEmitter } = require('../sockets/socketEmitter');
const logger = require('../utils/logger');

const getModelServiceUrl = () => {
  return (
    process.env.MODEL_SERVICE_URL ||
    process.env.PYTORCH_SERVICE_URL ||
    'http://localhost:8001'
  );
};

const getModelServiceTimeout = () => {
  return (
    parseInt(process.env.MODEL_SERVICE_TIMEOUT, 10) ||
    parseInt(process.env.PYTORCH_SERVICE_TIMEOUT, 10) ||
    15000
  );
};

/**
 * Interpret TensorFlow/Keras DenseNet prediction probabilities and labels.
 * Computes a normalized imageScore (0.0 to 1.0) and administrative screening status.
 */
const interpretModelPredictions = (predictedLabels = [], probabilities = {}) => {
  const cleanLabels = Array.isArray(predictedLabels)
    ? predictedLabels.filter((l) => l && l !== 'No Finding')
    : [];

  const probValues = Object.values(probabilities)
    .map((v) => Number(v))
    .filter((v) => !isNaN(v));
  const maxProb = probValues.length > 0 ? Math.max(...probValues) : 0.0;

  // High-urgency classes in the 14-class DenseNet thoracic model
  const criticalClasses = ['Pneumothorax', 'Edema', 'Consolidation', 'Mass'];
  const hasCriticalClass = cleanLabels.some((l) => criticalClasses.includes(l));

  let screeningStatus = 'NORMAL';
  let imageScore = maxProb;

  if (cleanLabels.length === 0 || maxProb < 0.25) {
    screeningStatus = 'NORMAL';
    imageScore = Math.min(maxProb, 0.2);
  } else if (hasCriticalClass || maxProb >= 0.75) {
    screeningStatus = 'CRITICAL_ABNORMALITY_DETECTED';
    imageScore = Math.max(maxProb, 0.85);
  } else if (maxProb >= 0.5) {
    screeningStatus = 'MODERATE_FINDINGS';
    imageScore = maxProb;
  } else {
    screeningStatus = 'MILD_FINDINGS';
    imageScore = maxProb;
  }

  return {
    screeningStatus,
    imageScore: Number(imageScore.toFixed(3)),
    possibleFindings:
      cleanLabels.length > 0 ? cleanLabels : ['No Significant Abnormality Detected'],
    findingsDetails: probabilities,
    confidenceSignal: Number(maxProb.toFixed(3)),
    modelVersion: 'tensorflow-keras-densenet-v1.0',
  };
};

/**
 * Direct synchronous call to FastAPI ML screening service
 * @param {string} imageUrl - Cloudinary secure URL
 */
const screenXrayImage = async (imageUrl) => {
  if (!imageUrl) {
    throw new Error('Image URL is required for medical image screening.');
  }

  const modelServiceUrl = getModelServiceUrl();
  const timeoutMs = getModelServiceTimeout();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const response = await fetch(`${modelServiceUrl.replace(/\/$/, '')}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Aarogya-Pravah-AI-Backend/1.0',
    },
    body: JSON.stringify({ image_url: imageUrl }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`ML service responded with HTTP status ${response.status}`);
  }

  const data = await response.json();
  return interpretModelPredictions(data.predicted_labels, data.probabilities);
};

/**
 * Check health status of external FastAPI ML Screening Service
 */
const checkModelServiceHealth = async () => {
  const modelServiceUrl = getModelServiceUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${modelServiceUrl.replace(/\/$/, '')}/health`, {
      method: 'GET',
      headers: { 'User-Agent': 'Aarogya-Pravah-AI-Backend/1.0' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        connected: true,
        status: data.status || 'ok',
        modelLoaded: Boolean(data.model_loaded),
        serviceUrl: modelServiceUrl,
      };
    }

    return {
      connected: false,
      status: `HTTP ${response.status}`,
      modelLoaded: false,
      serviceUrl: modelServiceUrl,
    };
  } catch (err) {
    return {
      connected: false,
      status: 'UNAVAILABLE',
      modelLoaded: false,
      error: err.message,
      serviceUrl: modelServiceUrl,
    };
  }
};

/**
 * Process a screening result payload from the ML service (or webhook),
 * persist the screening metadata in MongoDB, recalculate queue priority,
 * and broadcast real-time updates to staff and doctors.
 */
const processScreeningResult = async ({
  appointmentId,
  tokenNumber,
  screeningStatus = 'NORMAL',
  imageScore = 0.0,
  possibleFindings = [],
  modelVersion = 'tensorflow-keras-densenet-v1.0',
  confidenceSignal = 0.85,
  findingsDetails = {},
  imageUrl,
  publicId,
  assetId,
  timestamp,
}) => {
  let appointment;
  if (appointmentId) {
    appointment = await Appointment.findById(appointmentId).populate('patient');
  } else if (tokenNumber) {
    appointment = await Appointment.findOne({ tokenNumber }).populate('patient');
  }

  if (!appointment) {
    throw new Error('Appointment not found for image screening update.');
  }

  // 1. Update or create MedicalImageAnalysis record
  let imageRecord = await MedicalImageAnalysis.findOne({ appointment: appointment._id });
  if (!imageRecord) {
    imageRecord = new MedicalImageAnalysis({
      appointment: appointment._id,
      patient: appointment.patient._id,
      screeningStatus,
      imageScore: Number(imageScore),
      possibleFindings: Array.isArray(possibleFindings) ? possibleFindings : [possibleFindings],
      modelVersion,
      confidenceSignal: Number(confidenceSignal),
      findingsDetails,
      publicId: publicId || appointment.medicalImage?.publicId,
      assetId: assetId || appointment.medicalImage?.assetId,
      imageUrl: imageUrl || appointment.medicalImage?.secureUrl || appointment.medicalImageUrl,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
  } else {
    imageRecord.screeningStatus = screeningStatus;
    imageRecord.imageScore = Number(imageScore);
    imageRecord.possibleFindings = Array.isArray(possibleFindings)
      ? possibleFindings
      : [possibleFindings];
    imageRecord.modelVersion = modelVersion;
    imageRecord.confidenceSignal = Number(confidenceSignal);
    imageRecord.findingsDetails = findingsDetails;
    if (publicId) imageRecord.publicId = publicId;
    if (assetId) imageRecord.assetId = assetId;
    if (imageUrl) imageRecord.imageUrl = imageUrl;
    imageRecord.timestamp = timestamp ? new Date(timestamp) : new Date();
  }

  await imageRecord.save();

  // 2. Update Appointment medicalImage lifecycle status
  if (appointment.medicalImage) {
    appointment.medicalImage.status = 'ANALYZED';
    appointment.medicalImage.analysisCompletedAt = new Date();
    await appointment.save();
  }

  logger.info(
    `[ML Screening Processed] Token: ${appointment.tokenNumber}, Status: ${screeningStatus}, Score: ${imageScore}`
  );

  // 3. Recalculate priority score dynamically using the new image score
  const updateResult = await updateAppointmentPriority(appointment._id);

  // 4. Emit real-time Socket.IO updates to Doctor and Department rooms
  try {
    socketEmitter.emitPriorityUpdated(appointment.department, {
      tokenNumber: appointment.tokenNumber,
      appointmentId: appointment._id,
      imageScore,
      screeningStatus,
      newPriorityScore: updateResult?.priorityResult?.priorityScore,
    });
  } catch (err) {
    logger.warn(`[Socket Emit Warning] Failed to emit priority update: ${err.message}`);
  }

  return {
    appointment,
    imageRecord,
    updatedPriority: updateResult?.priorityResult || null,
  };
};

/**
 * Asynchronously triggers external FastAPI ML image screening without blocking
 * the patient's appointment creation or token issuance.
 */
const triggerAsyncImageAnalysis = async ({
  appointmentId,
  tokenNumber,
  patientId,
  imageUrl,
  imageId,
  publicId,
}) => {
  const modelServiceUrl = getModelServiceUrl();
  const timeoutMs = getModelServiceTimeout();

  // If no Python ML service URL is configured, mark status as ANALYSIS_PENDING
  if (!modelServiceUrl) {
    logger.info(
      `[Image Screening Service] MODEL_SERVICE_URL is not set. Image analysis for Token: ${tokenNumber} remains pending.`
    );
    try {
      await Appointment.findByIdAndUpdate(appointmentId, {
        'medicalImage.status': 'ANALYSIS_PENDING',
        'medicalImage.analysisStartedAt': new Date(),
      });
    } catch (e) {
      logger.warn(`Failed to update image status: ${e.message}`);
    }
    return;
  }

  // Run in background without awaiting in the controller
  setImmediate(async () => {
    try {
      await Appointment.findByIdAndUpdate(appointmentId, {
        'medicalImage.status': 'ANALYZING',
        'medicalImage.analysisStartedAt': new Date(),
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Clean request payload: Send Cloudinary secure_url only, never exposing API secrets
      const response = await fetch(`${modelServiceUrl.replace(/\/$/, '')}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Aarogya-Pravah-AI-Backend/1.0',
        },
        body: JSON.stringify({ image_url: imageUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FastAPI ML service responded with HTTP status ${response.status}`);
      }

      const data = await response.json();

      if (data && (data.predicted_labels || data.probabilities)) {
        const interpretation = interpretModelPredictions(
          data.predicted_labels,
          data.probabilities
        );

        await processScreeningResult({
          appointmentId,
          tokenNumber,
          screeningStatus: interpretation.screeningStatus,
          imageScore: interpretation.imageScore,
          possibleFindings: interpretation.possibleFindings,
          modelVersion: interpretation.modelVersion,
          confidenceSignal: interpretation.confidenceSignal,
          findingsDetails: interpretation.findingsDetails,
          imageUrl,
          publicId,
          assetId: imageId,
        });
      } else {
        throw new Error('Unrecognized response format from FastAPI ML service.');
      }
    } catch (error) {
      logger.error(
        `[ML Screening Service Error] Failed to screen image for Token ${tokenNumber}: ${error.message}`
      );
      try {
        await Appointment.findByIdAndUpdate(appointmentId, {
          'medicalImage.status': 'ANALYSIS_FAILED',
          'medicalImage.analysisError': error.message,
        });
      } catch (err) {
        // ignore
      }
    }
  });
};

module.exports = {
  processScreeningResult,
  triggerAsyncImageAnalysis,
  screenXrayImage,
  checkModelServiceHealth,
  interpretModelPredictions,
};

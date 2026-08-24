const { body, param } = require('express-validator');
const { Appointment } = require('../models/Appointment');
const { AIAnalysis } = require('../models/AIAnalysis');
const { MedicalImageAnalysis } = require('../models/MedicalImageAnalysis');
const { analyzePatientTriage } = require('../services/groqService');
const { updateAppointmentPriority } = require('../services/queueService');
const {
  processScreeningResult,
  screenXrayImage,
  checkModelServiceHealth,
  interpretModelPredictions,
} = require('../services/imageAnalysisService');
const { recordAuditLog } = require('../services/auditService');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

/**
 * @route   POST /api/ai/analyze-triage/:appointmentId
 * @desc    Manually trigger or re-run Groq AI clinical triage for an appointment
 * @access  Private (Staff, Doctor)
 */
const runGroqTriage = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId).populate('patient');
    if (!appointment) {
      return ApiResponse.notFound(res, 'Appointment not found');
    }

    const aiResult = await analyzePatientTriage({
      patientName: appointment.patient.name,
      age: appointment.patient.age,
      gender: appointment.patient.gender,
      department: appointment.department,
      symptoms: appointment.symptoms,
      symptomsDescription: appointment.symptomsDescription,
      possibleCondition: appointment.possibleCondition,
      reportedSeverity: appointment.reportedSeverity,
      staffSeverity: appointment.staffSeverity,
      isAccident: appointment.isAccident,
      accidentSeverity: appointment.accidentSeverity,
      medicalImageType: appointment.medicalImageType,
    });

    let aiRecord = await AIAnalysis.findOne({ appointment: appointment._id });
    if (!aiRecord) {
      aiRecord = new AIAnalysis({
        appointment: appointment._id,
        patient: appointment.patient._id,
        ...aiResult,
      });
    } else {
      Object.assign(aiRecord, aiResult);
      aiRecord.analyzedAt = new Date();
    }
    await aiRecord.save();

    // Recalculate priority if queue entry exists
    await updateAppointmentPriority(appointment._id);

    await recordAuditLog({
      user: req.user,
      action: 'GROQ_AI_TRIAGE_RUN',
      targetType: 'AI_ANALYSIS',
      targetId: aiRecord._id,
      details: {
        tokenNumber: appointment.tokenNumber,
        priorityRecommendation: aiRecord.priorityRecommendation,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(res, 'Groq AI clinical triage completed', {
      aiAnalysis: aiRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/analysis/:appointmentId
 * @desc    Get Groq AI clinical analysis for an appointment
 * @access  Private (Staff, Doctor)
 */
const getGroqAnalysis = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const aiAnalysis = await AIAnalysis.findOne({ appointment: appointmentId });
    if (!aiAnalysis) {
      return ApiResponse.notFound(res, 'No AI analysis found for this appointment');
    }

    return ApiResponse.success(res, 'AI analysis retrieved', { aiAnalysis });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/ai/screen-image/:appointmentId
 * @desc    Trigger/Re-run FastAPI ML chest X-ray screening for an appointment with an image
 * @access  Private (Staff, Doctor)
 */
const screenAppointmentImage = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId).populate('patient');
    if (!appointment) {
      return ApiResponse.notFound(res, 'Appointment not found');
    }

    const imageUrl = appointment.medicalImage?.secureUrl || appointment.medicalImageUrl;
    if (!imageUrl) {
      return ApiResponse.badRequest(res, 'No medical image found for this appointment to screen.');
    }

    const screening = await screenXrayImage(imageUrl);

    const result = await processScreeningResult({
      appointmentId: appointment._id,
      tokenNumber: appointment.tokenNumber,
      screeningStatus: screening.screeningStatus,
      imageScore: screening.imageScore,
      possibleFindings: screening.possibleFindings,
      modelVersion: screening.modelVersion,
      confidenceSignal: screening.confidenceSignal,
      findingsDetails: screening.findingsDetails,
      imageUrl,
      publicId: appointment.medicalImage?.publicId,
      assetId: appointment.medicalImage?.assetId,
    });

    return ApiResponse.success(
      res,
      'Preliminary medical image screening completed successfully',
      {
        tokenNumber: appointment.tokenNumber,
        image: {
          secureUrl: imageUrl,
          publicId: appointment.medicalImage?.publicId,
        },
        analysis: {
          status: 'COMPLETED',
          screeningStatus: screening.screeningStatus,
          imageScore: screening.imageScore,
          predictedLabels: screening.possibleFindings,
          probabilities: screening.findingsDetails,
          modelVersion: screening.modelVersion,
        },
        updatedPriority: result.updatedPriority,
      }
    );
  } catch (error) {
    logger.error(`[Screen Appointment Image Error] ${error.message}`);
    return ApiResponse.error(
      res,
      `Medical image analysis service is currently unavailable: ${error.message}`,
      503
    );
  }
};

/**
 * @route   POST /api/ai/image-analysis-result
 * @desc    Webhook/Service interface for external ML screening model or direct predictions
 * @access  Public (or API Key protected in production)
 */
const receiveImageAnalysisResult = async (req, res, next) => {
  try {
    const {
      appointmentId,
      tokenNumber,
      screeningStatus,
      imageScore,
      possibleFindings,
      predicted_labels,
      probabilities,
      modelVersion,
      confidenceSignal,
      findingsDetails,
      imageUrl,
      publicId,
      assetId,
      timestamp,
    } = req.body;

    let finalScreeningStatus = screeningStatus || 'NORMAL';
    let finalImageScore = imageScore !== undefined ? Number(imageScore) : 0.0;
    let finalPossibleFindings = possibleFindings || [];
    let finalFindingsDetails = findingsDetails || {};
    let finalConfidenceSignal = confidenceSignal !== undefined ? Number(confidenceSignal) : 0.85;
    let finalModelVersion = modelVersion || 'tensorflow-keras-densenet-v1.0';

    // If payload is raw FastAPI prediction output format
    if (predicted_labels || probabilities) {
      const interp = interpretModelPredictions(predicted_labels, probabilities);
      finalScreeningStatus = interp.screeningStatus;
      finalImageScore = interp.imageScore;
      finalPossibleFindings = interp.possibleFindings;
      finalFindingsDetails = interp.findingsDetails;
      finalConfidenceSignal = interp.confidenceSignal;
      finalModelVersion = interp.modelVersion;
    }

    const result = await processScreeningResult({
      appointmentId,
      tokenNumber,
      screeningStatus: finalScreeningStatus,
      imageScore: finalImageScore,
      possibleFindings: finalPossibleFindings,
      modelVersion: finalModelVersion,
      confidenceSignal: finalConfidenceSignal,
      findingsDetails: finalFindingsDetails,
      imageUrl,
      publicId,
      assetId,
      timestamp,
    });

    await recordAuditLog({
      userName: 'FastAPI ML Screening Worker',
      userRole: 'SYSTEM',
      action: 'IMAGE_SCREENING_INGESTED',
      targetType: 'IMAGE_ANALYSIS',
      targetId: result.imageRecord._id,
      details: {
        tokenNumber: result.appointment.tokenNumber,
        screeningStatus: finalScreeningStatus,
        imageScore: finalImageScore,
        newPriorityScore: result.updatedPriority?.priorityScore,
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return ApiResponse.success(
      res,
      'Preliminary medical image screening signal processed and priority updated',
      {
        tokenNumber: result.appointment.tokenNumber,
        imageAnalysis: result.imageRecord,
        updatedPriority: result.updatedPriority,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/image-analysis/:appointmentId
 * @desc    Get medical image analysis record
 * @access  Private (Doctor, Staff)
 */
const getImageAnalysis = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const imageAnalysis = await MedicalImageAnalysis.findOne({ appointment: appointmentId });
    if (!imageAnalysis) {
      return ApiResponse.notFound(res, 'No medical image analysis found for this appointment');
    }

    return ApiResponse.success(res, 'Medical image analysis retrieved', { imageAnalysis });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/ai/model-health
 * @desc    Get external ML model screening service connectivity & loaded status
 * @access  Public
 */
const getModelHealth = async (req, res, next) => {
  try {
    const health = await checkModelServiceHealth();
    return ApiResponse.success(res, 'ML Service Health Check', health);
  } catch (error) {
    next(error);
  }
};

// Validation rules
const imageResultValidation = [
  body('imageScore')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('imageScore must be a float between 0.0 and 1.0'),
  body('screeningStatus')
    .optional()
    .isIn([
      'NORMAL',
      'MILD_FINDINGS',
      'MODERATE_FINDINGS',
      'CRITICAL_ABNORMALITY_DETECTED',
      'INCONCLUSIVE',
    ])
    .withMessage('Invalid screeningStatus'),
];

module.exports = {
  runGroqTriage,
  getGroqAnalysis,
  screenAppointmentImage,
  receiveImageAnalysisResult,
  getImageAnalysis,
  getModelHealth,
  imageResultValidation,
};

const express = require('express');
const router = express.Router();
const {
  runGroqTriage,
  getGroqAnalysis,
  screenAppointmentImage,
  receiveImageAnalysisResult,
  getImageAnalysis,
  getModelHealth,
  imageResultValidation,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

// Webhook / service interface endpoint for external ML screening service
router.post('/image-analysis-result', imageResultValidation, validate, receiveImageAnalysisResult);

// Check external ML screening model status
router.get('/model-health', getModelHealth);

// Staff and doctor AI analysis routes
router.post('/screen-image/:appointmentId', protect, authorize('STAFF', 'DOCTOR'), screenAppointmentImage);
router.post('/analyze-triage/:appointmentId', protect, authorize('STAFF', 'DOCTOR'), runGroqTriage);
router.get('/analysis/:appointmentId', protect, authorize('STAFF', 'DOCTOR'), getGroqAnalysis);
router.get('/image-analysis/:appointmentId', protect, authorize('STAFF', 'DOCTOR'), getImageAnalysis);

module.exports = router;

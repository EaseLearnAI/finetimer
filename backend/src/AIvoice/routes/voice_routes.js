const express = require('express');
const router = express.Router();
const { uploadVoice } = require('../controllers/voiceUploadController');
const { enrollOrUpdateVoice } = require('../controllers/voiceEnrollmentController');
const { synthesizeVoice } = require('../controllers/voiceSynthesizeController');
const { getBindStatus } = require('../controllers/voiceBindStatusController');
const { imitateText } = require('../controllers/aiMimicController');
const { deleteVoiceGroup } = require('../controllers/voiceGroupController');

router.post('/upload-voice', ...uploadVoice);
router.post('/enroll-voice', enrollOrUpdateVoice);
router.post('/synthesize-voice', synthesizeVoice);
router.get('/bind-status', getBindStatus);
router.get('/bind-status/:user_id', getBindStatus);
router.post('/imitate-text', imitateText);
router.delete('/voice-group', deleteVoiceGroup);

module.exports = router; 
const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message');
const authenticate = require('../middleware/auth');
const multer = require('multer');

const upload = multer();

router.post('/send', authenticate, messageController.sendMessage);
router.post('/send/file', authenticate, upload.single('file'), messageController.sendFileMessage);

module.exports = router;

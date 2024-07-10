const { Op } = require('sequelize');
const Message = require('../models/Message');
const GroupMember = require('../models/GroupMember');
const AWS = require('aws-sdk');
const User = require('../models/User'); // Import the User model
const ArchivedChat = require('../models/ArchivedChat');

// Configure AWS SDK
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

exports.sendMessage = async (req, res) => {
    const { groupId, content } = req.body;
    const userId = req.user.userid;

    try {
        const message = await Message.create({
            content,
            groupId,
            userId
        });

        const populatedMessage = await Message.findByPk(message.id, {
            include: { model: User, attributes: ['name'] } // Populate the user field
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};

exports.sendFileMessage = async (req, res) => {
    const { groupId } = req.body;
    const userId = req.user.userid;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'
    };

    try {
        const data = await s3.upload(uploadParams).promise();
        const message = await Message.create({
            content: 'File uploaded',
            groupId,
            userId,
            fileUrl: data.Location,
            fileName: file.originalname
        });

        const populatedMessage = await Message.findByPk(message.id, {
            include: { model: User, attributes: ['name'] } // Populate the user field
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

exports.archiveOldMessages = async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    try {
        // Find all messages older than one day
        const oldMessages = await Message.findAll({
            where: {
                createdAt: {
                    [Op.lt]: oneDayAgo
                }
            }
        });

        // Archive each message
        for (const message of oldMessages) {
            await ArchivedChat.create({
                content: message.content,
                groupId: message.groupId,
                userId: message.userId,
                fileUrl: message.fileUrl,
                fileName: message.fileName,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt
            });

            // Delete the message from the Message table
            await message.destroy();
        }

        console.log('Old messages archived successfully.');
    } catch (error) {
        console.error('Error archiving old messages:', error);
    }
};

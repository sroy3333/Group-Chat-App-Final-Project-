const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const userRoutes = require('./routes/user');
const groupRoutes = require('./routes/group');
const groupMemberRoutes = require('./routes/groupMember');
const messageRoutes = require('./routes/message');
const sequelize = require('./util/database');
const cors = require('cors');
const WebSocket = require('ws');
const cron = require('node-cron');
const { archiveOldMessages } = require('./controllers/message');

const User = require('./models/User');
const Group = require('./models/Group');
const GroupMember = require('./models/GroupMember');
const Message = require('./models/Message');
const ArchivedChat = require('./models/ArchivedChat');

dotenv.config();

const app = express();

app.use(cors({
    origin: "*",
    credentials: true,
}));

app.use(bodyParser.json());
app.use('/user', userRoutes);
app.use('/groups', groupRoutes);
app.use('/groupMembers', groupMemberRoutes);
app.use('/messages', messageRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup', 'signup.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login', 'login.html'));
});

app.get('/ChatApp/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ChatApp', 'index.html'));
});

const models = { User, Group, GroupMember, Message, ArchivedChat };
User.associate(models);
Group.associate(models);
GroupMember.associate(models);

sequelize.sync().then(() => {
    const server = app.listen(7000, () => {
        console.log('Server is running on port 7000');
    });

    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected');

        ws.on('message', async (message) => {
            const parsedMessage = JSON.parse(message);

            if (parsedMessage.type === 'message') {
                const { groupId, content, userId } = parsedMessage;

                try {
                    const newMessage = await Message.create({ groupId, content, userId });
                    const messageWithUser = await Message.findOne({ where: { id: newMessage.id }, include: [User] });

                    // Broadcast the message to all connected clients
                    wss.clients.forEach((client) => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'message',
                                message: messageWithUser
                            }));
                        }
                    });
                } catch (error) {
                    console.error('Error saving message:', error);
                }
            } else if (parsedMessage.type === 'file') {
                const { fileMessage } = parsedMessage;
 
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'file',
                            fileMessage
                        }));
                    }
                });
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    cron.schedule('0 0 * * *', () => {
        console.log('Running cron job to archive old messages');
        archiveOldMessages();
    });
}).catch(err => {
    console.log(err);
});

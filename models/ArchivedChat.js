const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('./User');
const Group = require('./Group');

const ArchivedChat = sequelize.define('ArchivedChat', {
    content: {
        type: Sequelize.STRING,
        allowNull: true
    },
    fileUrl: {
        type: Sequelize.STRING,
        allowNull: true
    },
    fileName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    groupId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

ArchivedChat.belongsTo(User, { foreignKey: 'userId' });
ArchivedChat.belongsTo(Group, { foreignKey: 'groupId' });

module.exports = ArchivedChat;

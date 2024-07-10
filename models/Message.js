const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require('./User');
const Group = require('./Group');

const Message = sequelize.define('Message', {
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

Message.belongsTo(User, { foreignKey: 'userId' });
Message.belongsTo(Group, { foreignKey: 'groupId' });

module.exports = Message;

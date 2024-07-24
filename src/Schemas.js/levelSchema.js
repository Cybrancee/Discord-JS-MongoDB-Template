const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    userXp: {
        type: Number,
        default: 0,
    },
    userLevel: {
        type: Number,
        default: 1,
    },
    blocked: {
        type: String,
     },
});

const levelSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
    },
    channelId: {
        type: String,
        required: true,
    },
    useEmbed: {
        type: Boolean,
        default: false,
    },
    textColor: {
        type: String,
        required: false,
    },
    barColor: {
        type: String,
        required: false,
    },
    users: [userSchema],
    messages: [
        {
            content: {
                type: String,
                required: true,
            },
        },
    ],
});

module.exports = mongoose.model('Level', levelSchema);

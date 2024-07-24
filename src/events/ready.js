const { ActivityType } = require('discord.js');

const mongoose = require('mongoose');
const mongodbURL = process.env.MONGODBURI;

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('Ready!');
        
        if (!mongodbURL) return;

        await mongoose.connect(mongodbURL || "")

        if (mongoose.connect) {
            console.log("MongoDB Connected!")
        }

        const status = 'online';
        client.user.setPresence({
            status: status,
            activities: [{
                name: 'Greetings from Vaq ❤',
                type: ActivityType.Watching
            }]
        });
    },
};
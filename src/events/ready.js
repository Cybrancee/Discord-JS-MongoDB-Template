const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log('Ready!');

        const status = 'online';
        client.user.setPresence({
            status: status,
            activities: [{
                name: 'Greetings from the Cybrancee-Team ❤',
                type: ActivityType.Watching
            }]
        });
    },
};
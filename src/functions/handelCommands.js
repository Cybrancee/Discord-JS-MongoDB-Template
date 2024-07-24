const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');

const clientId = '1264520795460210799'; // your bot's client- /user ID

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        for (folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            }
        }

        const rest = new REST({
            version: '10'
        }).setToken(process.env.token);

        (async () => {
            try {
                console.log('Refreshing and registering application (/) commands.');

                await rest.put(
                    Routes.applicationCommands(clientId), {
                        body: client.commandArray
                    },
                );

                console.log('Successfully reloaded and registered application (/) commands.');
            } catch (error) {
                console.error(error);
            }
        })();
    };
};
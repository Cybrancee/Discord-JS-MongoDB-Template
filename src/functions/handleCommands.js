const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');

const clientId = ''; // your bot's application/user ID

const getTimeStamp = () => {
    return `[${new Date().toLocaleTimeString()}]`;
};

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        
        console.log(`${getTimeStamp()} Starting to load commands...`);

        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                try {
                    const command = require(`../commands/${folder}/${file}`);
                    
                    client.commands.set(command.data.name, command);
                    client.commandArray.push(command.data.toJSON());

                    console.log(`${getTimeStamp()} ✅ Loaded command: ${command.data.name} from ${folder}/${file}`);
                } catch (error) {
                    console.log(`${getTimeStamp()} ❌ Failed to load command: ${file} in folder ${folder}`);
                    console.error(`${getTimeStamp()} Error details:`, error);
                }
            }
        }

        const rest = new REST({ version: '10' }).setToken(process.env.token);

        (async () => {
            try {
                console.log(`${getTimeStamp()} 🔄 Refreshing and registering application (/) commands...`);

                await rest.put(
                    Routes.applicationCommands(clientId), {
                        body: client.commandArray
                    },
                );

                console.log(`${getTimeStamp()} ✅ Successfully reloaded and registered application (/) commands.`);
            } catch (error) {
                console.log(`${getTimeStamp()} ❌ Error reloading and registering application (/) commands:`);
                console.error(`${getTimeStamp()} Error details:`, error);
            }
        })();
    };
};

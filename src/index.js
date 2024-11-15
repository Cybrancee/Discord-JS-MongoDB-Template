const { Client, GatewayIntentBits, Collection} = require(`discord.js`);
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildModeration ] }); 

client.commands = new Collection();

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token).then(() => {
})
})();

const getTimeStamp = () => {
    return `[${new Date().toLocaleTimeString()}]`;
};

process.on('unhandledRejection', (reason, promise) => {
    console.error(`${getTimeStamp()} [ANTI-CRASH: unhandledRejection] An unhandled promise rejection occurred and was caught:`);
    console.error(`📝 Promise:`, promise);
    console.error(`💥 Reason:`, reason);
});

process.on("uncaughtException", (err, origin) => {
    console.error(`${getTimeStamp()} [ANTI-CRASH: uncaughtException] An uncaught exception occurred and was caught:`);
    console.error(`📝 Error:`, err);
    console.error(`📍 Origin:`, origin);
});
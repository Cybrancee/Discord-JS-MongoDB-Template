const { Client, GatewayIntentBits, EmbedBuilder, Collection, Events, AttachmentBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, ButtonBuilder, ButtonStyle, TextInputStyle, Interaction } = require(`discord.js`);
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildModeration ] }); 

client.commands = new Collection();
/*client.prefix = new Map();*/

require('dotenv').config();

const functions = fs.readdirSync("./src/functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./src/events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./src/commands");
/*const prefixFolders = fs.readdirSync("./src/prefix").filter((f) => f.endsWith(".js"));*/

/*for (arx of prefixFolders) {
    const Cmd = require('./prefix/' + arx)
    client.prefix.set(Cmd.name, Cmd)
}*/

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.token).then(() => {
handleLogs(client);
})
})();

process.on('unhandledRejection', (reason, promise) => {
    console.error("[ANTI-CRASH: unhandledRejection] An error has occured and been successfully handled:".yellow);

    console.error(promise, reason);
});

process.on("uncaughtException", (err, origin) => {
    console.error("[ANTI-CRASH: uncaughtException] An error has occured and been successfully handled:".yellow);

    console.error(err, origin);
});

//Join Role
const joinrole = require('./Schemas.js/joinrole');

client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const role = await joinrole.findOne({ Guild: member.guild.id });
        if (!role) {
            return;
        }
        
        console.log(`Join role found: ${role.RoleID}`);
        
        const giverole = member.guild.roles.cache.find(r => r.id === role.RoleID);
        if (!giverole) {
            console.log(`Role with ID ${role.RoleID} not found.`);
            return;
        }
        
        console.log(`Adding role ${giverole.name} to the new member.`);
        await member.roles.add(giverole);
    } catch (error) {
        console.error(`An error occurred while adding role to the member: ${error}`);
    }
});

// Moderation Logs

const Logs = require('discord-logs');

process.on('uncaughtRejection', (reason, promise) => {
    console.log("Unhandled Rejection at:", promise, 'reason', reason);
});

process.on('uncaughtException', (err) => {
    console.log("Uncaught Expection:", err);
});

Logs(client, {
    debug: true
})

const { handleLogs } = require("./events/handleLogs");

// Welcome System

const WelcomeSetup = require('./Schemas.js/welcomeSchema');


client.on('guildMemberAdd', async member => {
    try {
        const guildId = member.guild.id;

        const existingSetup = await WelcomeSetup.findOne({ guildId });

        if (!existingSetup) {
            return;
        }
        
        const joinedmember = member.user.username;
        const channel = member.guild.channels.cache.get(existingSetup.channelId);
        const userAvatar = member.user.displayAvatarURL({ format: 'png', dynamic: true });


        if (!channel) {
            console.error('Error caching channel')
            return;
        }

        let messageContent = existingSetup.welcomeMessage
                .replace('{SERVER_NAME}', member.guild.name)
                .replace('{SERVER_MEMBER}', member.guild.memberCount)
                .replace('{USER_NAME}', member.user.username || 'Unknown User')
                .replace('{USER_MENTION}', `<@${member.id}>`);

        if (existingSetup.useEmbed) {
            const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Welcome to the Server')
            .setDescription(messageContent)
            .setThumbnail(userAvatar)
            .setTimestamp()

            await channel.send({content: `<@${member.id}>`, embeds: [embed] });

        } else {
            await channel.send(messageContent);
        }
    } catch (error) {
     console.error('Error', error);
    }
})

const logchannelid = '1221167385180897330';

    client.on("guildCreate", function (guild) {
      let theowner = "470320681905684500"; //ur id
       guild.fetchOwner().then(({ user }) => { theowner = user; }).catch(() => {});
      let embed = new EmbedBuilder()
        .setColor('#A5D3F7')
        .setTitle(`__**Joined a New Server**__`)
        .setDescription(`${guild.name} has invited Harmony into their server`)
        .addFields(
          { name: "Guild Info", value: `>>> \`\`\`${guild.name} (${guild.id})\`\`\`` },
          { name: "Owner Info", value: `>>> \`\`\`${theowner ? `${theowner.tag} (${theowner.id})` : `${theowner} (${guild.ownerId})`}\`\`\`` },
          { name: "Member Count", value: `>>> \`\`\`${guild.memberCount}\`\`\`` },
          { name: "Server Number", value: `>>> \`\`\`${client.guilds.cache.size}\`\`\`` }
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: `Harmony ${client.guilds.cache.size}`, iconURL: 'https://images-ext-1.discordapp.net/external/RfoTaLWrWxt3wy-2WAJEa0cYdLn2Nu7CIGefMc2Y-iA/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/1220830326188933120/f2394af4a7e3b364d6eca5122800a068.webp?width=559&height=559' })
        .setTimestamp();
    
      const LogChannel = client.channels.cache.get(logchannelid) || client.channels.fetch(logchannelid).catch(() => {}) || false;
      if (LogChannel) LogChannel.send({ embeds: [embed] }).catch(console.warn);
    });



    const Level = require('../src/Schemas.js/levelSchema');
    const logs = require('../src/Schemas.js/logSchema');

client.on("guildDelete", async guild => {
    try {
        
        let theowner = guild.ownerId;

        try {
            await Level.findOneAndDelete({ guildId: guild.id });
            await LeftUsers.deleteMany({ guildId: guild.id });
            await WelcomeSetup.findOneAndDelete({ guildId: guild.id });
            await logs.findOneAndDelete({ Guild: guild.id });
            await joinrole.findOneAndDelete({ Guild: guild.id });
        
            console.log('Data successfully deleted.');
        } catch (error) {
            console.error('An error occured while deleting the data:', error);
        }
        
        

        let embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle(`__**Left a Server**__`)
            .setDescription(`${guild.name} has kicked/ban Harmony out of their server.\nThe servers data have been deleted!`)
            .addFields(
                { name: "Guild Info", value: `>>> \`\`\`${guild.name} (${guild.id})\`\`\`` },
                { name: "Owner Info", value: `>>> \`\`\`${theowner}\`\`\`` },
                { name: "Member Count", value: `>>> \`\`\`${guild.memberCount}\`\`\`` },
                { name: "Server Number", value: `>>> \`\`\`${client.guilds.cache.size}\`\`\`` }
            )
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .setFooter({ text: `Harmony ${client.guilds.cache.size}`, iconURL: 'https://images-ext-1.discordapp.net/external/RfoTaLWrWxt3wy-2WAJEa0cYdLn2Nu7CIGefMc2Y-iA/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/1220830326188933120/f2394af4a7e3b364d6eca5122800a068.webp?width=559&height=559' })
            .setTimestamp();

        const logChannel = client.channels.cache.get(logchannelid) || await client.channels.fetch(logchannelid).catch(() => {}) || false;
        if (logChannel) {
            logChannel.send({ embeds: [embed] }).catch(console.warn);
        }
    } catch (error) {
        console.error("Error handling guildDelete event", error);
    }
});

const calculateRequiredXpForLevel = (level) => {
    return Math.floor(100 * Math.pow(level, 1.2));
};

client.on('messageCreate', async message => {
    try {
        if (message.author.bot) return;

        const guildId = message.guild.id;
        let existingLevel = await Level.findOne({ guildId });
        if (!existingLevel) return;

        const userId = message.author.id;

        let userRecord = existingLevel.users.find(user => user.userId === userId);
        if (!userRecord) {
            userRecord = { userId, userXp: 0, userLevel: 1 };
            existingLevel.users.push(userRecord);
        }

        if (userRecord.blocked === "true") return;

        const requiredXpForNextLevel = calculateRequiredXpForLevel(userRecord.userLevel);

        if (!userRecord.blocked || userRecord.blocked === "false") { 
            userRecord.userXp += 11.2;
        }
        

        if (userRecord.userXp >= requiredXpForNextLevel) {
            userRecord.userXp -= requiredXpForNextLevel;
            userRecord.userLevel += 1;

            let levelUpMessage = existingLevel.messages.length > 0 ?
                existingLevel.messages[0].content
                    .replace('{memberName}', message.author.username)
                    .replace('{memberMention}', `<@${userId}>`)
                    .replace('{memberLevel}', userRecord.userLevel) :
                `Congratulations ${message.author}! You leveled up to level ${userRecord.userLevel}`;

            const guild = client.guilds.cache.get(guildId);
            const channel = guild.channels.cache.get(existingLevel.channelId);
            if (existingLevel.useEmbed) {
                const userAvatar = message.author.displayAvatarURL({ format: 'png', dynamic: true });
                const serverName = message.guild.name;

                const embed = new EmbedBuilder()
                    .setDescription(levelUpMessage)
                    .setAuthor({ name: `${serverName}`, iconURL: userAvatar })
                    .setColor("Random");
                channel.send({ embeds: [embed] });
            } else {
                channel.send(levelUpMessage);
            }
        }

        await existingLevel.save();
    } catch (error) {
        console.error("Error at index level system", error);
    }
});




client.on("guildMemberRemove", async (member) => {
    try {
        const guildData = await Level.findOne({ guildId: member.guild.id });
        
        if (!guildData) return; 
        
        const userIndex = guildData.users.findIndex(user => user.userId === member.id);
        
        if (userIndex !== -1) {
            guildData.users.splice(userIndex, 1);
            await guildData.save();
            console.log(`User ${member.user.tag} has been removed from guild ${member.guild.name} and deleted from the guild db-section in database.`);
        }
    } catch (error) {
        console.error('An error occured while deleting the data from the Database:', error);
    }
});
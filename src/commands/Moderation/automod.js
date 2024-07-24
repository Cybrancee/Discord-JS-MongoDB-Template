const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Setup the auto mod system.')
        .addSubcommand(command => command.setName('flagged-words').setDescription('Block profanity, sexual content and slurs.').addChannelOption(option => option.setName('logs-channel').setDescription('The channel to send automod logs').setRequired(true)))
        .addSubcommand(command => command.setName('spam-messages').setDescription('Block messages suspected of spam').addChannelOption(option => option.setName('logs-channel').setDescription('The channel to send automod logs').setRequired(true)))
        .addSubcommand(command => command.setName('mention-spam').setDescription('Block messages containing a certain amount of mentions.').addIntegerOption(option => option.setName('number').setDescription('The amount of mentions.').setRequired(true)).addChannelOption(option => option.setName('logs-channel').setDescription('The channel to send automod logs').setRequired(true)))
        .addSubcommand(command => command.setName('keyword').setDescription('Block a given keyword in the server.').addStringOption(option => option.setName('word').setDescription('the word you want to block').setRequired(true)).addChannelOption(option => option.setName('logs-channel').setDescription('The channel to send automod logs').setRequired(true))),
    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/automod\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'automod';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        const { guild, options } = interaction;
        const sub = options.getSubcommand();

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await interaction.reply({ content: `❌ **You do not have permissions to run this command.**`, ephemeral: true })
        const logsChannel = interaction.options.getChannel('logs-channel');

        switch (sub) {
            case 'flagged-words':

                await interaction.reply({ content: `**Loading automod rule.**` });

                const rule1 = await guild.autoModerationRules.create({
                    name: 'Block profanity, sexual content and slurs by Cybrancee Template Bot',
                    creatorId: '1197300129888215090',
                    enabled: true,
                    eventType: 1,
                    triggerType: 4,
                    triggerMetadata: {
                        presets: [1, 2, 3]
                    },
                    actions: [{
                        type: 1,
                        metadata: {
                            channel: interaction.channel,
                            durationSeconds: 10,
                            customMessage: "This message was blocked by Cybrancee Template Bot"
                        }
                    }, 
                    {
                        type: 2,
                        metadata: {
                            channel: logsChannel.id,
                        }
                        
                    }]
                    
                }).catch(async err => {
                    setTimeout(async () => {
                        console.log(err);
                        await interaction.editReply({ content: `**⚠️ Auto Moderation limit reached. \`(Limit = 1)\`**`, ephemeral: true });
                    }, 2000)
                })

                setTimeout(async () => {
                    if (!rule1) return;

                    const serverName = interaction.guild.name
                    const serverIconURL = interaction.guild.iconURL();

                    const embed1 = new EmbedBuilder()
                        .setColor("#9500CC")
                        .setDescription("**✅ Automod rule created. \`Swears\` will be blocked by Cybrancee Template Bot.**")
                        .setTimestamp() 

                        if (serverIconURL) {
                            embed1.setAuthor({ name: `${serverName}`, iconURL: serverIconURL });
                        } else {
                            embed1.setAuthor({ name: `${serverName}`});
                        }

                    await interaction.editReply({ content: ``, embeds: [embed1] });
                }, 3000)

                break;

            case 'keyword':

                await interaction.reply({ content: `**Loading automod rule.**` });
                const word = options.getString('word');
                console.log(logsChannel)
                const rule2 = await guild.autoModerationRules.create({
                    name: `Prevent the word ${word} from being used by Cybrancee Template Bot.`,
                    creatorId: '1220830326188933120', // your bot's client id
                    enabled: true,
                    eventType: 1,
                    triggerType: 1,
                    triggerMetadata: {
                        keywordFilter: [`${word}`]
                    },
                    actions: [{
                        type: 1,
                        metadata: {
                            channel: interaction.channel,
                            durationSeconds: 10,
                            customMessage: "This message was blocked by Cybrancee Template Bot"
                        }
                        
                    }, 
                    {
                        type: 2,
                        metadata: {
                            channel: logsChannel.id,
                        }
                        
                    }]
                }).catch(async err => {
                    setTimeout(async () => {
                        console.log(err);
                        await interaction.editReply({ content: `**⚠️ Auto Moderation limit reached. \`(Limit = 6)\`**`, ephemeral: true });
                    }, 2000)
                })

                setTimeout(async () => {
                    if (!rule2) return;

                    const serverIconURL = interaction.guild.iconURL();
                    const serverName = interaction.guild.name

                    const embed2 = new EmbedBuilder()
                        .setColor("#9500CC")
                        .setDescription(`**✅ Automod rule created. Messages with \`${word}\` will be deleted by Cybrancee Template Bot.**`)
                        .setTimestamp() 

                        if (serverIconURL) {
                            embed2.setAuthor({ name: `${serverName}`, iconURL: serverIconURL });
                        } else {
                            embed2.setAuthor({ name: `${serverName}`});
                        }

                    await interaction.editReply({ content: ``, embeds: [embed2] });
                }, 3000)

                break;

            case 'spam-messages':

                await interaction.reply({ content: `**Loading automod rule.**` });
                const spamNumber = options.getInteger('number');

                const rule3 = await guild.autoModerationRules.create({
                    name: 'Prevent spam messages by Cybrancee Template Bot',
                    creatorId: '1197300129888215090',
                    enabled: true,
                    eventType: 1,
                    triggerType: 3,
                    triggerMetadata: {
                        mentionTotalLimit: spamNumber
                    },
                    actions: [{
                        type: 1,
                        metadata: {
                            channel: interaction.channel,
                            durationSeconds: 10,
                            customMessage: "This message was blocked by Cybrancee Template Bot"
                        }
                    }, 
                    {
                        type: 2,
                        metadata: {
                            channel: logsChannel.id,
                        }
                        
                    }]
                }).catch(async err => {
                    setTimeout(async () => {
                        console.log(err);
                        await interaction.editReply({ content: `**⚠️ Auto Moderation limit reached. \`(Limit = 1)\`**`, ephemeral: true });
                    }, 2000)
                })

                setTimeout(async () => {
                    if (!rule3) return;

                    const serverIconURL = interaction.guild.iconURL();
                    const serverName = interaction.guild.name

                    const embed3 = new EmbedBuilder()
                        .setColor("#9500CC")
                        .setDescription("**✅ Automod rule created. Suspected \`spam\` will be deleted by Cybrancee Template Bot.**")
                        .setTimestamp() 

                        if (serverIconURL) {
                            embed3.setAuthor({ name: `${serverName}`, iconURL: serverIconURL });
                        } else {
                            embed3.setAuthor({ name: `${serverName}`});
                        }

                    await interaction.editReply({ content: ``, embeds: [embed3] });
                }, 3000)

                break;

            case 'mention-spam':

                await interaction.reply({ content: `**Loading automod rule.**` });
                const mentionNumber = options.getInteger('number');

                const rule4 = await guild.autoModerationRules.create({
                    name: 'Prevent spam mentions by Cybrancee Template Bot',
                    creatorId: '1197300129888215090',
                    enabled: true,
                    eventType: 1,
                    triggerType: 5,
                    triggerMetadata: {
                        mentionTotalLimit: mentionNumber
                    },
                    actions: [{
                        type: 1,
                        metadata: {
                            channel: interaction.channel,
                            durationSeconds: 10,
                            customMessage: "This message was blocked by Cybrancee Template Bot"
                        }
                    }, 
                    {
                        type: 2,
                        metadata: {
                            channel: logsChannel.id,
                        }
                        
                    }]
                }).catch(async err => {
                    setTimeout(async () => {
                        console.log(err);
                        await interaction.editReply({ content: `**⚠️ Auto Moderation Rules limit reached. \`(Limit = 1)\`**`, ephemeral: true });
                    }, 2000)
                })

                setTimeout(async () => {
                    if (!rule4) return;

                    const serverIconURL = interaction.guild.iconURL();
                    const serverName = interaction.guild.name

                    const embed4 = new EmbedBuilder()
                        .setColor("#9500CC")
                        .setDescription("**✅ Automod rule created. \`Mention spam\` will be blocked by Cybrancee Template Bot.**")
                        .setTimestamp() 

                        if (serverIconURL) {
                            embed4.setAuthor({ name: `${serverName}`, iconURL: serverIconURL });
                        } else {
                            embed4.setAuthor({ name: `${serverName}`});
                        }

                    await interaction.editReply({ content: ``, embeds: [embed4] });
                }, 3000)

                break;
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}

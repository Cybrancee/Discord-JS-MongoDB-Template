const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');


const WelcomeSetup = require('../../Schemas.js/welcomeSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('welcome-test')
    .setDescription('Test the welcome message for your server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute (interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/welcome-test\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'welcomeT';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            const guildId = interaction.guild.id;

            const existingSetup = await WelcomeSetup.findOne({ guildId });
            if (!existingSetup) {
                return await interaction.reply({ content: '**⚠️ Setup the welcome system first by using `/welcome-setup`.**', ephemeral: true })
            }

            const channel = interaction.guild.channels.cache.get(existingSetup.channelId);
            if (!channel) {
                return await interaction.reply({ content: '**⚠️ This channel does not exist.**', ephemeral: true })
            }
            const userAvatar = interaction.user.displayAvatarURL({ format: 'png', dynamic: true });

            let messageContent = existingSetup.welcomeMessage
                .replace('{SERVER_NAME}', interaction.guild.name)
                .replace('{SERVER_MEMBER}', interaction.guild.memberCount)
                .replace('{USER_NAME}', interaction.user.username)
                .replace('{USER_MENTION}', `<@${interaction.user.id}>`);

            if (existingSetup.useEmbed) {
                const embed = new EmbedBuilder()
                .setColor('Random')
                .setTimestamp()
                .setTitle('Welcome')
                .setThumbnail(userAvatar)
                .setFooter({ text: interaction.guild.name })
                .setDescription(messageContent);

                await channel.send({ content: `<${interaction.user.id}>`, embeds: [embed] })
            } else {
                await channel.send(messageContent);
            }

            await interaction.reply({ content: `**✅ Successfully sent the welcome message in #${channel}**`})

        } catch (error) {
            console.error('Error', error)
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}
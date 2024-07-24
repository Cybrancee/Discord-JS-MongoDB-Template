const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send the message to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 5000;
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/say\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(userId, Date.now());

        const channel = interaction.options.getChannel('channel');
        const messageContent = interaction.options.getString('message');

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }
        if (!channel) {
            return interaction.reply({ content: "⚠️ Provide a channel for me to send a message.", ephemeral: true });
        }
        if (!messageContent) {
            return interaction.reply({ content: "⚠️ Provide a message for me to send.", ephemeral: true });
        }

        try {
            await channel.send(messageContent);
            return interaction.reply({ content: `Message sent to ${channel}`, ephemeral: true });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: "There was an error trying to send the message.", ephemeral: true });
        }
    }
};
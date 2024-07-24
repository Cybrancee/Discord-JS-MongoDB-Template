const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Purge a bunch of messages.')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The number of messages to delete (1-100)')
                .setRequired(true)),
    async execute(interaction) {
        const userId = interaction.user.id;

        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + 5000;
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/purge\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(userId, Date.now());

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return interaction.reply({ content: "❌ You don't have permission to use this command.", ephemeral: true });
        }

        const amount = interaction.options.getInteger('amount');
        if (amount <= 0 || amount > 100) {
            return interaction.reply({ content: '⚠️ Provide a valid number between 1 - 100.', ephemeral: true });
        }

        interaction.channel.bulkDelete(amount, true)
            .then(deletedMessages => {
                interaction.reply({ content: `✅ Deleted **${deletedMessages.size}** messages.`, ephemeral: true })
                    .then(() => {
                        setTimeout(() => {
                            interaction.deleteReply();
                        }, 5000);
                    });
            })
            .catch(error => {
                console.error('Error purging messages:', error);
                interaction.reply({ content: '❌ An error occurred. Try again later.', ephemeral: true });
            });
    }
};
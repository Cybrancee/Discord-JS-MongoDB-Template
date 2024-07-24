const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const cooldowns = new Map();

const WelcomeSetup = require('../../Schemas.js/welcomeSchema');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('welcome-disable')
    .setDescription('Disable the welcome system for your server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute (interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/welcome-disable\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'welcomeD';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            const guildId = interaction.guild.id;

            const deleteSetup = await WelcomeSetup.findOneAndDelete({ guildId });

            if (!deleteSetup) {
                return await interaction.reply({ content: '**⚠️ Welcome system is not enabled for your server.**', ephemeral: true})
            }

            await interaction.reply({ content: '**✅ Successfully disabled the welcome system for your server.**'})
        } catch (err) {
            console.err('Error', err);
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}
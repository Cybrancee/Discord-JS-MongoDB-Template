const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Level = require('../../Schemas.js/levelSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('level-disable')
    .setDescription('Disable the level system for your server.'),

    async execute (interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/level-disable\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'level-disable';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return await interaction.reply({ content: "**❌ You dont have the required permission to run this command.**", ephemeral: true });

        try {
            const guildId = interaction.guild.id;
            const existingLevel = await Level.findOne({ guildId });
            if (!existingLevel) {
                return await interaction.reply({ content: '**⚠️ Level system has not been set up yet. Use \`/level-setup\`**', ephemeral: true })
            }
            await Level.findOneAndDelete({ guildId });
            await interaction.reply('**✅ Level system disabled successfully.**');

        } catch (error) {
            console.error("Error at disabling level", error);
            await interaction.reply({ content: "**❌ An error occured while disabling level system.**", ephemeral: true })
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}
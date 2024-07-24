const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Level = require('../../Schemas.js/levelSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level-message')
        .setDescription('Set a custom level up message. Variables: {memberMention}, {memberName}, {memberLevel}.')
        .addStringOption(option => option.setName('message').setDescription('The custom level up message. Variables: {memberMention}, {memberName}, {memberLevel}.').setRequired(true)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**<:warnhrmny:1223441017143820448> ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/level-message\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'level-message';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: "**❌ You don't have the required permission to run this command.**", ephemeral: true });
        }

        try {
            const guildId = interaction.guild.id;
            let existingLevel = await Level.findOne({ guildId });
            if (!existingLevel) {
                return await interaction.reply({ content: '**⚠️ Level system has not been set up yet. Use \`/level-setup\`**', ephemeral: true });
            }

            const userMessage = interaction.options.getString('message');

            
            const userId = interaction.user.id;
            const memberMention = `<@${userId}>`;
            const memberName = interaction.user.username;
            const memberLevel = existingLevel.userLevel;
            
            let updatedMessage = userMessage
                .replace('{memberMention}', memberMention)
                .replace('{memberName}', memberName)
                .replace('{memberLevel}', memberLevel);

            
            existingLevel.messages = [{ content: updatedMessage }];
            await existingLevel.save();

            await interaction.reply('**✅ Custom level up message set successfully.**');

        } catch (error) {
            console.error("Error at level message1", error)
            await interaction.reply({ content: '**❌ An error occurred while setting up the custom level up message.**', ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}

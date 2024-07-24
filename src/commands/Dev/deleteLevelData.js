const { SlashCommandBuilder } = require('discord.js');
const Level = require('../../Schemas.js/levelSchema');
const Developer = require('../../Schemas.js/DevPermission');
const cooldowns = new Map();


module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev-delete-level-user-data')
        .setDescription('Delete level data for a specific user in a guild')
        .addStringOption(option => option.setName('guild').setDescription('The ID of the guild to delete data from').setRequired(true))
        .addStringOption(option => option.setName('user').setDescription('The ID of the user to delete data for').setRequired(true)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 10000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/dev-delete-level-user-data\` again.`, ephemeral: true });
            }
        }

        const DevId = interaction.user.id;
        const devPermission = await Developer.findOne({ DevId });
        
        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'deleteLevelData';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        if (!devPermission || devPermission.Permission === "false") {
            return await interaction.reply({ content: "**❌ This command is only available to developers.**"})
        };

        const guildId = interaction.options.getString('guild');
        const userId = interaction.options.getString('user');

        try {
            const filter = { guildId, 'users.userId': userId };
            console.log("Filter:", filter);
            const levelData = await Level.findOne(filter);

            if (!levelData) {
                console.log('No LevelData')
                return await interaction.reply(`**❌ No level data found for user \`${userId}\` in guild \`${guildId}\`.**`);
            }

            const update = { $pull: { users: { userId } } };
            const result = await Level.updateOne(filter, update);

            if (result.nModified > 0) {
                console.log('Level data deleted successfully');
            } else {
                console.log('Level Data Deleted');
            }

            const updatedLevelData = await Level.findOne({ guildId });
            const deletedUserData = updatedLevelData.users.find(user => user.userId === userId);

            if (!deletedUserData) {
                await interaction.reply(`**✅ Level data for user \`${userId}\` in guild \`${guildId}\` has been successfully deleted.**`);
            } else {
                await interaction.reply(`**❌ No level data found for user \`${userId}\` in guild \`${guildId}\`.**`);
            }

        } catch (error) {
            console.error("Error deleting level data:", error);
            await interaction.reply({ content: '**❌ An error occurred while deleting level data.**', ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}

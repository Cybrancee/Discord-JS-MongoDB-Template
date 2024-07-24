const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Level = require('../../Schemas.js/levelSchema');
const cooldowns = new Map();


module.exports = {
    data: new SlashCommandBuilder()
        .setName('block-unblock-user-level')
        .setDescription('Block or unblock collecting XP for a specific user.')
        .addStringOption(option => option.setName('user').setDescription('The ID of the user to block/unblock data for.').setRequired(true))
        .addBooleanOption(option => option.setName('block').setDescription('Block or unblock a user').setRequired(true)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/block-unblock-user-level\` again.`, ephemeral: true });
            }
        }

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: "**❌ You must be an administrator to use this command.**", ephemeral: true });
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'blockUserXp';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });


        const userId = interaction.options.getString('user');
        const block = interaction.options.getBoolean('block');

        try {
            const levelData = await Level.findOne({ guildId: interaction.guildId });

            const userToUpdate = levelData.users.find(user => user.userId === userId);

            if (!userToUpdate) {
                return await interaction.reply(`**❌ User \`${userId}\` not found.**`);
            }

            userToUpdate.blocked = block;
            await levelData.save();

            const action = block ? "blocked" : "unblocked";

            await interaction.reply(`**✅ XP collecting for user \`${userId}\` has been ${action}.**`);
        } catch (error) {
            console.error("Error blocking/unblocking user data:", error);
            await interaction.reply({ content: '**❌ An error occurred while blocking/unblocking user data.**', ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });

    },
};

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const Level = require('../../Schemas.js/levelSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level-setup')
        .setDescription('Set up level system.')
        .addChannelOption(option => option.setName('channel').setDescription('The channel where level messages will be sent.').setRequired(true))
        .addBooleanOption(option => option.setName('embed').setDescription('Whether to send level-up messages as embeds.').setRequired(true)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/level-setup\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'level-setup';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return await interaction.reply({ content: "**❌ You dont have the required permission to run this command.**", ephemeral: true });

        try {
            const channel = interaction.options.getChannel('channel');
            const guildId = interaction.guild.id;
            const channelId = channel.id;
            const useEmbed = interaction.options.getBoolean('embed');

            const existingLevel = await Level.findOne({ guildId });
            if (existingLevel) {
                return await interaction.reply({
                    content: '**⚠️ Level system is already active!**', ephemeral: true
                });
            }

            
            const guildMembers = await interaction.guild.members.fetch();

            
            const nonBotMembers = guildMembers.filter(member => !member.user.bot);

            const users = nonBotMembers.map(member => ({ userId: member.user.id, userXp: 0, userLevel: 1 }));

            const defaultTextColor = '#FFFFFF'; 
            const defaultBarColor = '#AD69C6'; 
            const defaultMessage = `**{memberMention} leveled up! |\`{memberLevel}\`**`;

            await Level.create({
                guildId,
                channelId,
                useEmbed: useEmbed || false,
                textColor: defaultTextColor,
                barColor: defaultBarColor,
                users,
                messages: [{ content: defaultMessage }],
            });
            await interaction.reply("**✅ Level system set up successfully.**");
        } catch (error) {
            console.error("Error level 1", error);
            await interaction.reply({
                content: '**❌ An error occurred while setting up the level system.**', ephemeral: true
            });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
};

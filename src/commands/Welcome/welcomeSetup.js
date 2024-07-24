const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const WelcomeSetup = require('../../Schemas.js/welcomeSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('welcome-enable')
    .setDescription('Set up the welcome system for your server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option => option.setName('channel').setDescription('The channel you want to send the Welcome Message in.').setRequired(true)),
    async execute (interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/welcome-setup\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'welcomeS';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            const guildId = interaction.guild.id;
            const channelId = interaction.options.getChannel('channel').id;

            const existingSetup = await WelcomeSetup.findOne({ guildId });
            if (existingSetup) {
                return await interaction.reply({ content: '**⚠️ The welcome system is already set up.**', ephemeral: true})
            }

            await WelcomeSetup.create({
                guildId,
                channelId
            });

            const embed = new EmbedBuilder()
            .setColor('Random')
            .setDescription(`**✅ Welcome system configured! Messages will be sent to <#${channelId}>.\nUse \`/welcome-message\` to customize your message.**`)
            .setTimestamp()

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error', error);
            await interaction.reply({ content: '**❌ An error occurred while setting up your welcome message.**', ephemeral: true})
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}
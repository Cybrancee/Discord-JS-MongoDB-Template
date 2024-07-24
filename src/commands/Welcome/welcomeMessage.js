const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const welcomeSetup = require('../../Schemas.js/welcomeSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('welcome-message')
    .setDescription('The custom welcome message for your server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => option.setName('message').setDescription('Message variables: {SERVER_NAME}, {SERVER_MEMBER}, {USER_NAME}, {USER_MENTION}').setRequired(true))
    .addBooleanOption(option => option.setName('use-embed').setDescription('Embed your welcome message.').setRequired(false)),

    async execute (interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/welcome-message\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'welcomeM';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            const guildId = interaction.guild.id;
            const welcomeMessage = interaction.options.getString('message');
            const useEmbed = interaction.options.getBoolean('use-embed') || false;

            let existingSetup = await welcomeSetup.findOne({ guildId });
            if (!existingSetup) {
                return await interaction.reply({ content: '**⚠️ Setup the welcome system first by using `/welcome-setup`.**', ephemeral: true})
            }

            existingSetup.welcomeMessage = welcomeMessage;
            existingSetup.useEmbed = useEmbed;

            await existingSetup.save();

            await interaction.reply({ content: '**✅ Successfully set custom welcome message.**'})
        } catch (error) {
            console.error('Error', error)
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}
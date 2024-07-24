const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ChannelType } = require('discord.js');

const logSchema = require('../../Schemas.js/logSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('server-logs')
    .setDescription('Configure your logging system.')
    .addSubcommand(command => command.setName('enable').setDescription('Enable the logging system.').addChannelOption(option => option.setName('channel').setDescription('Specified channel will receive the logs.').setRequired(false).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
    .addSubcommand(command => command.setName('disable').setDescription('Disable the logging system.')),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/server-logs\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'logs';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
        return await interaction.reply({ content: "**❌ You do not have Admin Perm. to use this command.**", ephemeral: true})

        const sub = await interaction.options.getSubcommand()
        const data = await logSchema.findOne({ Guild: interaction.guild.id });

        switch (sub) {
            case 'enable':

            if (data) return await interaction.reply({ content: `**⚠️ The logging system is already enabled! \n \`/server-logs disable\` to disable the logging system.**`, ephemeral: true});
            else {
                const logchannel = interaction.options.getChannel("channel") || interaction.channel;

                const setupembed = new EmbedBuilder()
                .setColor("#9500CC")
                .setAuthor({ name: `Harmonious Logging System`})
                .setFooter({ text: `Logging Enabled`})
                .setTitle('> Harmonious Logging Enabled')
                .addFields({ name: `Logging was Enabled`, value: `**✅ Your logging system has been set up successfully.**`})
                .addFields({ name: `Channel`, value: `${logchannel}` })
                .setTimestamp()

                await interaction.reply({ embeds: [setupembed] });

                await logSchema.create({
                    Guild: interaction.guild.id,
                    Channel: logchannel.id
                })
            }

            break;
            case 'disable':

            if (!data) return interaction.reply({ content: '**⚠️ The logging system is not set up yet.**'})
            else {
                const disableembed = new EmbedBuilder()
                .setColor("#9500CC")
                .setTitle('Logging disabled')
                .setDescription('**✅ Logging was successfully disabled!**')
                .setTimestamp()

                await interaction.reply({ embeds: [disableembed] });

                await logSchema.deleteMany({ Guild: interaction.guild.id })
            }
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}

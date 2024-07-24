const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member in the server.')
    .addUserOption(option => option.setName('user').setDescription('The user you want to warn.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for warning the user.').setRequired(false)),
    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/warn\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'warn';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return await
        interaction.reply({ content: '**❌ You dont have the required permission to warn members in this server.**', ephemeral: true })

        const member = interaction.options.getUser('user');
        let reason = interaction.options.getString('reason');

        if (!reason) reason = '**No reason given.**';

        const user = await interaction.guild.members.fetch(member).catch(() => null);
        if (!user)
        return await interaction.reply({ content: "**⚠️ The user does not exist on this server.**", ephemeral: true });

        const dmSend = new EmbedBuilder()
        .setColor("#9500CC")
        .setDescription(`**⚠️ You have been \`warned\` in \`${interaction.guild.name}\`\n Reason: \`${reason}\`**`)

        const embed = new EmbedBuilder()
        .setColor("#9500CC")
        .setDescription(`**✅ Successfully warned ${member} | \`${reason}\`**`);

        await interaction.reply({ embeds: [embed] })

        await member.send({ embeds: [dmSend] }).catch(err => {
            return;
        })

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });

    }
}
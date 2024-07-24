const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('This gives you some basic server information.'),
    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**<:warnhrmny:1223441017143820448> ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/serverinfo\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'serverI';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        const { guild } = interaction;
        const { members } = guild;
        const { name, ownerId, createdTimestamp, memberCount } = guild;
        const icon = guild.iconURL();

        const roles = guild.roles.cache.size;
        const emojis = guild.emojis.cache.size;
        const id = guild.id;

        let serverVerification = guild.verificationLevel;

        if (serverVerification == 0) serverVerification = 'None';
        if (serverVerification == 1) serverVerification = 'Low';
        if (serverVerification == 2) serverVerification = 'Medium';
        if (serverVerification == 3) serverVerification = 'High';
        if (serverVerification == 4) serverVerification = 'Very High';

        const embed = new EmbedBuilder()
            .setColor("#9500CC")
            .setTitle(name)
            .setDescription(`Server information for ${name}`)
            .addFields(
                { name: "Server Owner", value: `<@${ownerId}>` },
                { name: "Server Members", value: `${memberCount}` },
                { name: "Server Boosts", value: `${guild.premiumSubscriptionCount}` },
                { name: "Server Created", value: `<t:${parseInt(createdTimestamp / 1000)}:R>` }
            )
            .setTimestamp();

        
        if (icon) {
            embed.setThumbnail(icon);
        }

        await interaction.reply({ embeds: [embed] });

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
};

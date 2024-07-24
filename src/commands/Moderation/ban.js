const { PermissionsBitField, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server.')
        .addUserOption(option => option.setName('user').setDescription('The user you want to ban.').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('The reason for banning the user.').setRequired(false)),
    async execute(interaction, client) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/ban\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'ban';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        const users = interaction.options.getUser('user');
        const id = users.id;
        const userBan = client.users.cache.get(id);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return await interaction.reply({ content: '**❌ You dont have the required permission to ban members in this server.**', ephemeral: true });
        }

        if (interaction.guild.ownerId === id) {
            return await interaction.reply({ content: `**❌ I cannot ban the server owner.**`, ephemeral: true });
        }

        if (interaction.member.id === id || interaction.user.id === id) {
            const selfBanMessage = interaction.user.id === id ? "**You cannot ban yourself.**" : "**You cannot ban the bot itself.**";
            return await interaction.reply({ content: `**❌ ${selfBanMessage}**`, ephemeral: true });
        }

        const user = await interaction.guild.members.fetch(id).catch(() => null);
        if (!user)
        return await interaction.reply({ content: "**⚠️ The user does not exist on this server.**", ephemeral: true });

        let reason = interaction.options.getString('reason') || "**No reason given.**";

        const embedDM = new EmbedBuilder()
            .setColor("Red")
            .setDescription(`**⚠️ You have been \`banned\` from \`${interaction.guild.name}\`\n Reason: \`${reason}\`**`);

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setDescription(`**✅ Successfully banned \`${userBan.tag}\` | \`${reason}\`**`);

        try {
            await userBan.send({ embeds: [embedDM] });
            await interaction.guild.bans.create(userBan.id, { reason });
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(`Failed to ban user ${userBan.tag}: ${error.message}`);
            await interaction.reply({ content: `**⚠️ I can not ban this user.**`, ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
};

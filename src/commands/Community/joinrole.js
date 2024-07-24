const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const joinrole = require('../../Schemas.js/joinrole');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joinrole')
        .setDescription('Setup auto role system for your server.')
        .addRoleOption(option => option.setName('role').setDescription('The role to be given when someone joins the server.').setRequired(true)),
    
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
            return await interaction.reply({ content: "❌ You do not have permissions to run this command.", ephemeral: true });

        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/joinrole\` again.`, ephemeral: true });
            }
        }

        const role = interaction.options.getRole('role');

        cooldowns.set(interaction.user.id, Date.now());

            const filter = i => i.isStringSelectMenu() && i.customId === 'joinrole';
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 15000 
            });

            collector.on('end', () => {
                cooldowns.delete(interaction.user.id);
            });

        try {
            const data = await joinrole.findOne({ Guild: interaction.guild.id });

            if (!data) {
                await joinrole.create({
                    Guild: interaction.guild.id,
                    RoleID: role.id,
                    RoleName: role.name
                });

                const embed = new EmbedBuilder()
                    .setColor("#9500CC")
                    .setDescription(`**✅ ${role} has been successfully set as a join role.\n\`Make sure Harmony has the "Manage Roles"-permission & a higher ranked role than "${role.name}"!\`**`)
                    .setFooter({ text: `${interaction.guild.name}` })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } else {
                return await interaction.reply({ content: '⚠️ **Join Role has already been set.**' });
            }

        } catch (err) {
            console.error(err);
            return await interaction.reply({ content: 'An error occurred while setting the join role.', ephemeral: true });
        }
        
    }
};

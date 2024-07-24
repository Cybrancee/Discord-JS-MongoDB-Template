const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

const cooldowns = new Map();
const joinrole = require("../../Schemas.js/joinrole");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joinrole-disable")
    .setDescription("Disable auto role system for your server."),
  async execute(interaction) {
    if (cooldowns.has(interaction.user.id)) {
      const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
      if (Date.now() < expirationTime) {
          const timeLeft = (expirationTime - Date.now()) / 1000;
          return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/joinrole-disable\` again.`, ephemeral: true });
      }
    }

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return await interaction.reply({
        content: "❌ You do not have permissions to run this command.",
        ephemeral: true,
      });
    }

    try {
      const data = await joinrole.findOne({ Guild: interaction.guild.id });

      if (!data) {
        return await interaction.reply({ content: '⚠️ **No Join Role has been set.**' });
      } else {
        await joinrole.deleteMany({ Guild: interaction.guild.id });

        const embed = new EmbedBuilder()
          .setColor("#9500CC")
          .setDescription(`**✅ Successfully disabled auto roles in this server.**`)
          .setFooter({ text: `${interaction.guild.name}` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }

      cooldowns.set(interaction.user.id, Date.now());

      const filter = i => i.isStringSelectMenu() && i.customId === 'joinrole-disable';
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 15000 
      });

      collector.on('end', () => {
        cooldowns.delete(interaction.user.id);
      });

    } catch (err) {
      console.error(err);
      return await interaction.reply({ content: 'An error occurred while disabling the join role.', ephemeral: true });
    }
  },
};

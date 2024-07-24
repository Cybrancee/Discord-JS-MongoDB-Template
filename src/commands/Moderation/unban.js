const {
  PermissionsBitField,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");
const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user you want to unban.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for unbanning the user.")
        .setRequired(false)
    ),
  async execute(interaction) {
    if (cooldowns.has(interaction.user.id)) {
      const expirationTime = cooldowns.get(interaction.user.id) + 5000;
      if (Date.now() < expirationTime) {
        const timeLeft = (expirationTime - Date.now()) / 1000;
        return interaction.reply({
          content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/unban\` again.`,
          ephemeral: true,
        });
      }
    }

    cooldowns.set(interaction.user.id, Date.now());

    const filter = (i) => i.isStringSelectMenu() && i.customId === "unban";
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    try {
      const user = interaction.options.getUser("user");

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
        return await interaction.reply({
          content: "**❌ You dont have the required permission to unban users.**",
          ephemeral: true,
        });

      let reason = interaction.options.getString("reason");

      if (!reason) reason = "**No reason given.**";

      const guildBans = await interaction.guild.bans.fetch();
      const bannedUser = guildBans.get(user.id);

      if (!bannedUser)
        return await interaction.reply({
          content: "**⚠️ The user is not banned from this server.**",
          ephemeral: true,
        });

      await interaction.guild.bans.remove(user.id, reason);

      const embed = new EmbedBuilder()
        .setColor("Yellow")
        .setDescription(`**✅ Successfully unbanned \`${user.tag}\` | \`${reason}\`**`);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error unbanning user:", error);
      await interaction.reply({
        content: "**❌ An error occurred while unbanning the user.**",
        ephemeral: true,
      });
    }

    collector.on("end", () => {
      cooldowns.delete(interaction.user.id);
    });
  },
};
const { EmbedBuilder } = require('discord.js');

// If not needed - Delete the file

module.exports = {
    name: "guildCreate",
    async execute (guild) {
        const owner = await guild.fetchOwner();
        try {
            const embed = new EmbedBuilder()
            .setTitle("**Your Development Team**")
            .setDescription('**Thank you for adding \`Your Bot\` to your server!**\n\`Make sure the bot has the right permissions for the best experience!\`')
            .addFields({ name: `Note:`, value: `**Make sure to join the [support server](URL-PLACEHOLDER)\n\nAnd leave a review + vote for the bot [Here](PLACEHOLDER). ❤️**`})
            .addFields({ name: "Legal", value: `[Privacy Policy](URL-PLACEHOLDER) | [Terms of Conditions](URL-PLACEHOLDER)`})
            .setColor('#A5D3F7')
            .setThumbnail(owner.displayAvatarURL({ dynamic: true }))
            .setTimestamp()

            owner.send({ embeds: [embed] });
        } catch (err) {
            return;
        }
    }
}
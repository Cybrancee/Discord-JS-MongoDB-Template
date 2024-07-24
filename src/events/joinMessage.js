const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "guildCreate",
    async execute (guild) {
        const owner = await guild.fetchOwner();
        try {
            const embed = new EmbedBuilder()
            .setTitle("**Harmony Developer Team**")
            .setDescription('**Thank you for adding \`Harmony\` to your server!**\n\`Make sure the bot has the right permissions for the best experience!\`')
            .addFields({ name: `Note:`, value: `**Make sure to join the [support server](https://discord.gg/qbp9ewGU5j)\n\nAnd leave a review + vote for the bot [Here](https://top.gg/bot/1220830326188933120?s=0d201af0698ff). <:lovehrmny:1224310565627887647>**`})
            .addFields({ name: "Legal", value: `[Privacy Policy](https://www.iubenda.com/privacy-policy/23808014) | [Terms of Conditions](https://www.iubenda.com/terms-and-conditions/23808014)`})
            .setColor('#A5D3F7')
            .setThumbnail(owner.displayAvatarURL({ dynamic: true }))
            .setTimestamp()

            owner.send({ embeds: [embed] });
        } catch (err) {
            return;
        }
    }
}
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows the ping of the bot.'),
    async execute (interaction, client) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `⚠️ **${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/ping\` again.`, ephemeral: true });
            }
        }

        
        const proxyEmbed = new EmbedBuilder()
            .setColor("Blue")
            .addFields({ name: `**Ping**`, value: `thinking...`});
        const sentMessage = await interaction.reply({ embeds: [proxyEmbed] });

        
        const existingEmbed = sentMessage.embeds;
        const updatedEmbed = new EmbedBuilder(existingEmbed)
            .setColor("#9500CC")
            .addFields({ name: `**Ping**`, value: `Reacting to your command takes **${client.ws.ping}ms** for me^^`});
        await sentMessage.edit({ embeds: [updatedEmbed] });

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'ping';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
        
    }
}
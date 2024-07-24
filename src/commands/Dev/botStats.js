const { SlashCommandBuilder } = require('discord.js');
const os = require('os');
const Developer = require('../../Schemas.js/DevPermission');
const cooldowns = new Map();

function bytesToMB(bytes) {
    return bytes / (1024 * 1024);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev-bot-stats')
        .setDescription('Statistics.'),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/dev-bot-stats\` again.`, ephemeral: true });
            }
        }

        const DevId = interaction.user.id;
        const devPermission = await Developer.findOne({ DevId });

        if (!devPermission || devPermission.Permission === "false") {
            return await interaction.reply({ content: "**❌ This command is only available to developers.**"})
        };

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'botStats';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            const numCPUs = os.cpus().length;

            const cpuUsage = os.loadavg()[0] / numCPUs * 100;
            console.log('CPU usage:', cpuUsage.toFixed(2), '%');

            const guildCount = interaction.client.guilds.cache.size;

            const userCount = interaction.client.users.cache.size;

            const channelCount = interaction.client.channels.cache.size;

            const memoryUsageMB = bytesToMB(process.memoryUsage().heapUsed);

            await interaction.reply(`\`\`\`js\n- - - -\nGuilds: ${guildCount}\n\nUsers: ${userCount}\n\nChannels: ${channelCount}\n\n- - - -\n\nRAM: ${memoryUsageMB.toFixed(2)} | 256 MB\n\nCPU cores: ${numCPUs}\n\nCPU usage: ${cpuUsage.toFixed(2)} %\n- - - -\`\`\``);
        } catch (error) {
            console.error("Error retrieving bot statistics:", error);
            await interaction.reply({ content: '**❌ An error occurred while retrieving bot statistics.**', ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });

    },
};

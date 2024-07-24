const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Level = require('../../Schemas.js/levelSchema');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Displays the top 10 members with the highest XP in this server.'),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/leaderboard\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'leaderboard';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            const guildId = interaction.guild.id;
            const serverData = await Level.findOne({ guildId });

            if (!serverData) {
                return interaction.reply({ content: '❌ No data found for this server.', ephemeral: true });
            }

            const guildName = interaction.guild.name;

            const embed = new EmbedBuilder()
                .setTitle(`👑 ${guildName}'s leaderboard`)
                .setColor('#9500CC');

            let description = '';
            serverData.users
                .sort((a, b) => {
                    if (a.userLevel !== b.userLevel) {
                        return b.userLevel - a.userLevel;
                    } else {
                        return b.userXp - a.userXp;
                    }
                })
                .slice(0, 10)
                .forEach((memberData, index) => {
                    const user = interaction.guild.members.cache.get(memberData.userId);
                    if (!user) return; 
                    const userTag = user.toString();
                    
                    let rankEmoji;
                    if (index === 0) rankEmoji = '1️⃣'; 
                    else if (index === 1) rankEmoji = '2️⃣'; 
                    else if (index === 2) rankEmoji = '3️⃣'; 
                    else rankEmoji = `\`${index + 1}.\``; 
                    
                    description += `${rankEmoji} ${userTag} **- LVL: ${memberData.userLevel}\n\n**`;
                });

            embed.setDescription(description);

            interaction.reply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error("Error executing 'top' command", error);
            interaction.reply({ content: '❌ An error occurred while fetching top members.', ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
};

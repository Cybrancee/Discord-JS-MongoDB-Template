const { SlashCommandBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const Level = require('../../Schemas.js/levelSchema');

const supportedFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const cooldowns = new Map();


module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Displays level and XP amount.')
        .addUserOption(option => option.setName('user').setDescription('The user to get level and XP of.').setRequired(false)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/level\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'level';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            let targetUser = interaction.options.getUser('user') || interaction.user;

            const existingLevel = await Level.findOne({ guildId: interaction.guild.id });
            if (!existingLevel) {
                return interaction.reply({ content: '**❌ Level system has not been set up yet. Use \`/level-setup\`**', ephemeral: true });
            }

            const existingUser = existingLevel.users.find(user => user.userId === targetUser.id);
            if (!existingUser) {
                return interaction.reply({ content: `**⚠️ User \`${targetUser.username}\`/<@${targetUser.id}> does not have any level.**`, ephemeral: true });
            }

            if (existingUser.blocked === "true") {
                return interaction.reply({ content: `**❌ User \`${targetUser.username}\`/<@${targetUser.id}> is banned from XP leveling in this server.**`, ephemeral: true });
            }

            const canvas = createCanvas(785, 196);
            const ctx = canvas.getContext('2d');

            const backgroundImage = await loadImage("https://i.postimg.cc/fTf4nnyG/cybrancee-Template-Bot.png"); //background image by Vaq

            ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

            const avatar = await loadImage(targetUser.displayAvatarURL({ format: supportedFormats }));
            const avatarSize = 126;
            const avatarX = 20;
            const avatarY = (canvas.height - avatarSize) / 2 - 10;
            const avatarBorderSize = 3;
            const avatarRadius = (avatarSize + avatarBorderSize) / 2;

            ctx.save();
            ctx.beginPath();
            ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius - avatarBorderSize, 0, Math.PI * 2, true);
            ctx.clip();
            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            const statusColor = getUserStatusColor(interaction.guild.members.cache.get(targetUser.id));

            ctx.strokeStyle = statusColor || '#FFFFFF';
            ctx.lineWidth = avatarBorderSize * 3;
            ctx.beginPath();
            ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
            ctx.stroke();

            ctx.strokeStyle = '#2C3943';
            ctx.lineWidth = avatarBorderSize;
            ctx.beginPath();
            ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius - avatarBorderSize, 0, Math.PI * 2, true);
            ctx.stroke();

            const outerBorderWidth = (avatarBorderSize + avatarBorderSize * 2) / 2.5;
            ctx.lineWidth = outerBorderWidth;
            ctx.beginPath();
            ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius + outerBorderWidth, 0, Math.PI * 2, true);
            ctx.stroke();

            const username = targetUser.username.length > 14 ? targetUser.username.slice(0, 11) + '...' : targetUser.username;
            const fontSize = adjustFontSize(ctx, username, 400) * 1.25;
            ctx.font = `bold ${fontSize}px Trebuchet MS`;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(username, 200, 50);

            let separatorLineLength = ctx.measureText(username).width + 10;
            if (separatorLineLength > 14 * fontSize) {
                separatorLineLength = 14 * fontSize;
            }

            const separatorLineY = 60;
            const separatorLineHeight = 3;
            const separatorLineRadius = separatorLineHeight / 2;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(195 - 5, separatorLineY, separatorLineLength, separatorLineHeight);

            const xpBarWidth = 540;
            const xpBarHeight = 35;
            const xpBarX = 185;
            const xpBarY = 150;
            const currentXp = existingUser.userXp.toFixed(1);
            const requiredXpForNextLevel = calculateRequiredXpForLevel(existingUser.userLevel).toFixed(1);
            const maxXp = requiredXpForNextLevel;
            const borderRadius = xpBarHeight / 2;

            const xpBarFillWidth = Math.min(xpBarWidth * (currentXp / maxXp), xpBarWidth);

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.moveTo(xpBarX + borderRadius, xpBarY);
            ctx.lineTo(xpBarX + xpBarWidth - borderRadius, xpBarY);
            ctx.quadraticCurveTo(xpBarX + xpBarWidth, xpBarY, xpBarX + xpBarWidth, xpBarY + borderRadius);
            ctx.lineTo(xpBarX + xpBarWidth, xpBarY + xpBarHeight - borderRadius);
            ctx.quadraticCurveTo(xpBarX + xpBarWidth, xpBarY + xpBarHeight, xpBarX + xpBarWidth - borderRadius, xpBarY + xpBarHeight);
            ctx.lineTo(xpBarX + borderRadius, xpBarY + xpBarHeight);
            ctx.quadraticCurveTo(xpBarX, xpBarY + xpBarHeight, xpBarX, xpBarY + xpBarHeight - borderRadius);
            ctx.lineTo(xpBarX, xpBarY + borderRadius);
            ctx.quadraticCurveTo(xpBarX, xpBarY, xpBarX + borderRadius, xpBarY);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = existingLevel.barColor || '#AD69C6';
            ctx.beginPath();
            ctx.moveTo(xpBarX + borderRadius, xpBarY);
            ctx.lineTo(xpBarX + xpBarFillWidth - borderRadius, xpBarY);
            ctx.quadraticCurveTo(xpBarX + xpBarFillWidth, xpBarY, xpBarX + xpBarFillWidth, xpBarY + borderRadius);
            ctx.lineTo(xpBarX + xpBarFillWidth, xpBarY + xpBarHeight - borderRadius);
            ctx.quadraticCurveTo(xpBarX + xpBarFillWidth, xpBarY + xpBarHeight, xpBarX + xpBarFillWidth - borderRadius, xpBarY + xpBarHeight);
            ctx.lineTo(xpBarX + borderRadius, xpBarY + xpBarHeight);
            ctx.quadraticCurveTo(xpBarX, xpBarY + xpBarHeight, xpBarX, xpBarY + xpBarHeight - borderRadius);
            ctx.lineTo(xpBarX, xpBarY + borderRadius);
            ctx.quadraticCurveTo(xpBarX, xpBarY, xpBarX + borderRadius, xpBarY);
            ctx.closePath();
            ctx.fill();

            const guildUsers = existingLevel.users.filter(user => {
                const guildMember = interaction.guild.members.cache.get(user.userId);
                return guildMember && !guildMember.user.bot;
            });
            
            const sortedUsers = guildUsers.sort((a, b) => {
                if (a.userLevel !== b.userLevel) {
                    return b.userLevel - a.userLevel;
                } else {
                    return b.userXp - a.userXp;
                }
            });
            const userRank = sortedUsers.findIndex(user => user.userId === targetUser.id) + 1;

            ctx.fillStyle = existingLevel.textColor || '#FFFFFF';
            ctx.font = '25px Verdana';


            const formattedCurrentXp = formatNumber(currentXp);
            const formattedRequiredXpForNextLevel = formatNumber(requiredXpForNextLevel);

            ctx.fillText(`Level: ${existingUser.userLevel}`, 200, 100);
            ctx.fillText(`XP: ${formattedCurrentXp} / ${formattedRequiredXpForNextLevel}`, 325, 100);


            ctx.fillText(`Rank: ${userRank}`, 200, 130);


            function formatNumber(num) {
                if (num >= 1000) {
                    const formattedNum = (num / 1000).toFixed(1);
                 return `${formattedNum}k`;
                }
                return num;
            }



            const attachment = canvas.toBuffer('image/png');
            interaction.reply({ files: [attachment], name: `rank-${targetUser.id}.png` });

        } catch (error) {
            console.error("Error at levelCard", error);
            interaction.reply({ content: '**❌ An error occurred while building the attachment.**', ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
};

function getUserStatusColor(member) {
    const status = member.presence?.status;
    switch (status) {
        case 'online':
            return '#00FF00';
        case 'idle':
            return '#FFA500';
        case 'dnd':
            return '#FF0000';
        case 'offline':
            return '#808080';
        default:
            return null;
    }
}

function adjustFontSize(ctx, text, maxWidth) {
    let fontSize = 30;
    do {
        ctx.font = `${fontSize}px Verdana`;
        fontSize -= 1;
    } while (ctx.measureText(text).width > maxWidth && fontSize > 10);
    return fontSize + 1;
}

const calculateRequiredXpForLevel = (level) => {
    return Math.floor(100 * Math.pow(level, 1.2));
};

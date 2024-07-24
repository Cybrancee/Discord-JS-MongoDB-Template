const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const Level = require('../../Schemas.js/levelSchema');

const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('customize')
        .setDescription('Customize text and XP bar color for the guild.')
        .addStringOption(option => option.setName('textcolor').setDescription('Hex color code for text.').setRequired(false))
        .addStringOption(option => option.setName('barcolor').setDescription('Hex color code for XP bar.').setRequired(false)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/customize\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'customize';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        try {
            const targetUser = interaction.user;

            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: '**❌ You dont have the required permission to run this command.**', ephemeral: true });
            }

            const textColor = interaction.options.getString('textcolor');
            const barColor = interaction.options.getString('barcolor');
            if (!textColor && !barColor) {
                return interaction.reply({ content: '**❌ You must specify at least one of the options: textcolor or barcolor.**', ephemeral: true });
            }

            const guildId = interaction.guild.id;
            let existingLevel = await Level.findOne({ guildId });
            if (!existingLevel) {
                return interaction.reply({ content: '**⚠️ The level system has not been set up yet. Use \`/level-setup\`**', ephemeral: true });
            }

            let response = '## __**Customization:**__\n';
            let invalidOptions = '';

            function convertColorCode(colorCode, propertyName) {
                if (colorCode && colorCode.startsWith('#')) {
                    const hex = colorCode.replace('#', '');
                    if (/^[0-9A-F]{6}$/i.test(hex)) {
                        existingLevel[propertyName] = colorCode.toUpperCase();
                        response += `✅ ${propertyName} saved.\n`;
                    } else {
                        invalidOptions += ` ${propertyName}`;
                        console.error(`Invalid * **${propertyName}** * hexadecimal code.\n`);
                    }
                } else if (colorCode) {
                    invalidOptions += ` ${propertyName}`;
                    console.error(`Invalid ${propertyName} color code "${colorCode}".\n`);
                }
            }

            convertColorCode(textColor, 'textColor');
            convertColorCode(barColor, 'barColor');

            if (invalidOptions) {
                response += `❌ Invalid${invalidOptions} provided and not saved.\n`;
            }

            await existingLevel.save();
            interaction.reply({ content: response, ephemeral: true });

        } catch (error) {
            console.error("Error at customize command", error);
            interaction.reply({ content: '**❌ An error occurred while customizing colors.**', ephemeral: true });
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
};

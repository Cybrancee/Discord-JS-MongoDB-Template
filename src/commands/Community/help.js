const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');

const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('All Commands.'),

    async execute(interaction, client) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 10000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/help\` again.`, ephemeral: true });
            }
        }

        const commandFolders = fs.readdirSync('./src/commands').filter(folder => !folder.startsWith('.'));
        const commandsByCategory = {};

        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`./src/commands/${folder}`).filter(file => file.endsWith('.js'));
            const commands = [];

            for (const file of commandFiles) {
                const { default: command } = await import(`./../${folder}/${file}`);
                commands.push({ name: command.data.name, description: command.data.description });
            }

            commandsByCategory[folder] = commands;
        }

        const prefixCommandFiles = fs.readdirSync('./src/prefix').filter(file => file.endsWith('.js'));
        const prefixCommands = [];

        for (const file of prefixCommandFiles) {
            const { default: command } = await import(`./../../prefix/${file}`);
            prefixCommands.push({ name: command.data.name, description: command.data.description });
        }

        commandsByCategory['Prefix Commands'] = prefixCommands;

        const dropdownOptions = Object.keys(commandsByCategory).map(folder => ({
            label: folder,
            value: folder
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('category-select')
            .setPlaceholder('Categories')
            .addOptions(...dropdownOptions.map(option => ({
                label: option.label,
                value: option.value
            })));

        const embed = new EmbedBuilder()
            .setColor('#9500CC')
            .setTitle('Help Menu')
            .setDescription('Select a category to view the commands.')
            .setThumbnail(`${client.user.displayAvatarURL()}`)
            .setFooter({ text: 'Your Bot' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        await interaction.reply({ embeds: [embed], components: [row] });

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'category-select';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        collector.on('collect', async i => {
            const selectedCategory = i.values[0];
            const categoryCommands = commandsByCategory[selectedCategory];

            const categoryEmbed = new EmbedBuilder()
                .setColor('#9500CC')
                .setTitle(`${selectedCategory} Commands`)
                .setDescription('List of all commands in this category.')
                .setThumbnail(`${client.user.displayAvatarURL()}`)
                .addFields(categoryCommands.map(command => ({
                    name: command.name,
                    value: command.description
                })));

            await i.update({ embeds: [categoryEmbed] });
        });

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
};

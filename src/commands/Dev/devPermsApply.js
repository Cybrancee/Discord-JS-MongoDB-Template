const { SlashCommandBuilder } = require('discord.js');
const Developer = require('../../Schemas.js/DevPermission');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dev-add-remove-perms')
        .setDescription('Add / remove dev permission.')
        .addStringOption(option => option.setName('user').setDescription('The ID of the user to add/remove perms for.').setRequired(true))
        .addBooleanOption(option => option.setName('permission').setDescription('Add or remove developer permission.').setRequired(true)),

    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 10000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/dev-add-remove-perms\` again.`, ephemeral: true });
            }
        }

        if (interaction.user.id !== 'DevID' && interaction.user.id !== 'AnotherDevID') {
            return await interaction.reply({ content: "**❌ This command is only available to developers.**", ephemeral: true });
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'devPermsAdd';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        const DevId = interaction.options.getString('user');
        const Permission = interaction.options.getBoolean('permission');

try {
    let devPermission = await Developer.findOne({ DevId });

    if (devPermission) {

        devPermission.Permission = Permission;
        await devPermission.save();
        interaction.reply(`**✅ Successfully updated \`DEV\`-Permission for \`${DevId}\`.**`);

    } else {

        await Developer.create({
            DevId,
            Permission
        });

        interaction.reply(`**✅ Successfully added \`DEV\`-Permission to \`${DevId}\`.**`);
    }
} catch (error) {
    console.error("Error adding/removing dev permission:", error);
    await interaction.reply({ content: '**An error occurred while adding/removing dev permission.**', ephemeral: true });
}

    collector.on('end', () => {
        cooldowns.delete(interaction.user.id);
    });

    }
}
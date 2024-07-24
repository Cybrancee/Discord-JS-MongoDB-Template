const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { default: axios } = require('axios');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steal-emoji')
        .setDescription('Steal the emoji for your server.')
        .addStringOption(options => options.setName('emoji').setDescription('The emoji you want to steal.').setRequired(true))
        .addStringOption(options => options.setName('name').setDescription('The name you would like to give to the emoji.').setRequired(true)),
    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/steal-emoji\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'stealE';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        await interaction.deferReply();

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions))
            return await interaction.editReply({ content: "**❌ You must have the Manage Emojis + Stickers Perm. to run this command.**", ephemeral: true })

        let emoji = interaction.options.getString('emoji')?.trim();
        const name = interaction.options.getString('name');

        
        if (name.length < 2) {
            return await interaction.editReply({ content: "**❌ The name must be at least 2 characters long.**", ephemeral: true });
        }

        if (emoji.startsWith("<") && emoji.endsWith(">")) {
            const id = emoji.match(/\d{15,}/g)[0];

            const type = await axios
                .get(`https://cdn.discordapp.com/emojis/${id}.gif`)
                .then((image) => {
                    if (image) return "gif"
                    else return "png"
                }).catch(err => {
                    return "png"
                })

            emoji = `https://cdn.discordapp.com/emojis/${id}.${type}?quality=lossless`
        }

        if (emoji.startsWith('<a') && emoji.endsWith('>')) {
            const id = emoji.match(/\d{15,}/g)[0];

            const type = await axios
                .get(`https://cdn.discordapp.com/emojis/${id}.gif`)
                .then((image) => {
                    if (image) return "png"
                    else return "gif"
                }).catch(err => {
                    return "gif"
                })

            emoji = `https://cdn.discordapp.com/emojis/${id}.${type}?quality=lossless`
        }

        if (!emoji.startsWith('http')) {
            return await interaction.editReply({ content: "**❌ You can not steal default emojis.**", ephemeral: true })
        }

        if (!emoji.startsWith('https')) {
            return await interaction.reditReply({ content: "**❌ You can not steal default emojis.**", ephemeral: true })
        }

        interaction.guild.emojis.create({ attachment: `${emoji}`, name: `${name}` })
            .then(emoji => {
                const embed = new EmbedBuilder()
                    .setColor("#9500CC")
                    .setDescription(`**✅ Successfully added ${emoji}, with the name \`${name}\`**`)


                return interaction.editReply({ embeds: [embed] }).catch(err => {
                    interaction.editReply({ content: `**⚠️ Server emojis limit is over. Delete some emojis and try again!**`, ephemeral: true })
                })
            })

            collector.on('end', () => {
                cooldowns.delete(interaction.user.id);
            });

    }
}

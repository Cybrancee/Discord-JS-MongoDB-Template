const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steal-sticker')
        .setDescription('Steal sticker for your server'),
    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000;
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return await interaction.reply({ content: `⚠️ Please wait ${timeLeft.toFixed(1)} more seconds before using the \`/steal-sticker\` command again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions))
            return await interaction.reply({ content: "**❌ You do not have permissions to use this command.**", ephemeral: true });

        await interaction.reply({ content: `**Waiting for your sticker...**` });
        const filter = (m) => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter: filter, time: 15000, max: 1 });

        collector.on('collect', async m => {
            const sticker = m.stickers.first();
            const { guild } = interaction;
            if (m.stickers.size == 0) return await interaction.editReply(`**❌ This is not a sticker!**`);

            if (sticker.url.endsWith('.json'))
                return await interaction.editReply(`**❌ This is not a valid sticker file!**`);

            if (sticker.url.endsWith('.gif'))
                return await interaction.editReply(`**❌ Animated stickers are not supported.**`);

            if (!guild.members.me.permissions.has(PermissionsBitField.Flags.ManageGuildExpressions))
                return await interaction.editReply(`**⚠️ I do not have permissions to add stickers to the server.**`);
            
            try {
                const newSticker = await guild.stickers.create({
                    name: sticker.name,
                    description: sticker.description || "",
                    tags: sticker.tags,
                    file: sticker.url
                });

                await interaction.editReply({ content: `**✅ The sticker with the name \`${newSticker.name}\` has been successfully added.**` });
            } catch (err) {
                console.log(err);
                await interaction.editReply(`**⚠️ Server stickers limit is over. Delete some stickers and try again!**`);
            }
        });

        collector.on('end', async reason => {
            if (reason === "time") return await interaction.editReply(`**⚠️ Ran out of time! Try again in a bit.**`);
        });
    }
};

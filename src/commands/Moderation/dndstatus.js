const {
    SlashCommandBuilder,
    ChannelType,
    EmbedBuilder,
    PermissionsBitField,
} = require("discord.js");
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dnd")
        .setDescription(`Do not Disturb.`)
        .addSubcommand((subcommand) =>
            subcommand
                .setName("enable")
                .setDescription("Become a Ghost")
                .addStringOption((option) =>
                    option
                        .setName("reason")
                        .setRequired(false)
                        .setDescription(`Give the reason why you want to be set to DND.`)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
            .setName("disable")
            .setDescription("End your DND status")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("exempt")
                .setDescription("Add an exception for DND pings.")
                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setRequired(false)
                        .setDescription(`Role to exempt`)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setRequired(false)
                        .setDescription(`Channel to exempt`)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("exempt-remove")
                .setDescription("Remove an excemption for DND pings.")

                .addRoleOption((option) =>
                    option
                        .setName("role")
                        .setRequired(false)
                        .setDescription(`Role to exempt`)
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setRequired(false)
                        .setDescription(`Channel to exempt`)
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("force-remove")
                .setDescription("Remove the DND status from another user.")

                .addUserOption((option) =>
                    option
                        .setName("user")
                        .setRequired(true)
                        .setDescription(
                            `The user to remove from DND mode.`
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("info")
                .setDescription("Get all the info on who is on DND and the exempt channels, roles in your DND status")
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("warning")
                .setDescription("Add a warning channel for DND pings")

                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setRequired(true)
                        .setDescription(
                            `Channel to warn when there is a ping of an DND user`
                        )
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("remove-warning")
                .setDescription("remove the warnings for DND pings")
        ),
    async execute(interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/dnd\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'dnd';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        const command = interaction.options.getSubcommand();
        await interaction.guild.autoModerationRules.fetch()
        const rule = await interaction.guild.autoModerationRules.cache.find(x => x.name === 'DND mention block - by Your Bot')
        switch (command) {
            case "enable":
                {
                    const reason =
                        interaction.options.getString("reason") ?? "Unknown reason";

                    if (!rule) {
                        const keywords = [`<@1>`, `<@${interaction.user.id}>`]
                        await interaction.guild.autoModerationRules.create({
                            name: "DND mention block - by Your Bot",
                            enabled: true,
                            eventType: 1,
                            triggerType: 1,
                            triggerMetadata: {
                                keywordFilter: keywords,
                            },
                            actions: [
                                {
                                    type: 1,
                                    metadata: {
                                        customMessage:
                                            'This user is currently on DND mode. Blocked by Your Bot',
                                    },
                                },
                            ],
                        });
                    } else {
                        if (rule.triggerMetadata.keywordFilter.includes(`<@${interaction.user.id}>`)) {
                            return interaction.reply(
                                `**⚠️ You are already on DND, to end it try \`/dnd disable\`**`
                            );
                        }
                        const keywords = await rule.triggerMetadata.keywordFilter
                        keywords.push(`<@${interaction.user.id}>`)
                        rule.edit({
                            triggerMetadata: {
                                keywordFilter: keywords,
                            },
                        });
                    }
                    try {
                        const nickname = interaction.member.nickname || interaction.user.displayname || interaction.user.username
                        if (nickname.length < 27) {
                            const name = `[DND] ${nickname}`
                            await interaction.member.setNickname(name)
                        }
                        interaction.reply(`**✅ Mentions blocked. \`${interaction.user.username}\` is on DND: \`${reason}\`**`);
                    }
                    catch (error) {
                        await interaction.reply(`**⚠️ All mentions blocked except for role pings. \`${interaction.user.username}\` is on DND: \`${reason}\`**`)
                        interaction.followUp({ content: `**❌ Unable to change your nickname.**`, ephemeral: true })
                    }

                }
                break;

            case "disable":
                {
                    if (!rule || !rule.triggerMetadata.keywordFilter.includes(`<@${interaction.user.id}>`)) {
                        return interaction.reply(
                            `**⚠️ You are not on DND, to start it try \`/dnd enable\`**`
                        );
                    }

                    let keywords = await rule.triggerMetadata.keywordFilter
                    keywords = keywords.filter(words => words !== `<@${interaction.user.id}>`)
                    rule.edit({
                        triggerMetadata: {
                            keywordFilter: keywords,
                        },
                    });
                    const name = interaction.member.nickname || interaction.user.displayname || interaction.user.username
                    if (name.startsWith('[DND]')) {
                        const newname = name.slice(6)
                        await interaction.member.setNickname(newname)
                    }
                    interaction.reply(`**✅ The pings are back on. Welcome back**`);
                }
                break;

            case "exempt":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `**❌ You don't have permission to use this command.**`, ephemeral: true })
                    }
                    if (!rule) {
                        return interaction.reply(
                            "**⚠️ Set a DND rule with \`/dnd enable\` before modifying permissions. You can disable DND once the rule is established.**"
                        );
                    }

                    const channel = interaction.options.getChannel("channel");
                    const role = interaction.options.getRole("role");
                    if (role || channel) {
                        let exemptroles = Array.from(rule.exemptRoles.keys())
                        let exemptchannels = Array.from(rule.exemptChannels.keys())
                        console.log(exemptroles)
                        if (role && !exemptroles.includes(role.id)) {
                            exemptroles.push(role.id)
                        }
                        if (channel && !exemptchannels.includes(channel.id)) {
                            if (channel.type !== ChannelType.GuildText) {
                                return interaction.reply(
                                    "**⚠️ Please submit an existing text channel.**"
                                );
                            }
                            exemptchannels.push(channel.id);
                        }
                        rule.edit({
                            exemptRoles: exemptroles,
                            exemptChannels: exemptchannels,
                        });
                    } else {
                        return interaction.reply(
                            "**⚠️ Please provide a valid text channel or role to exempt.**"
                        );
                    }
                    interaction.reply("**✅ The server DND rule has been updated.**");
                }
                break;

            case "exempt-remove":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `**❌ You don't have permission to use this command.**`, ephemeral: true })
                    }
                    if (!rule) {
                        return interaction.reply(
                            "**⚠️ Set a DND rule with \`/dnd enable\` before modifying permissions. You can disable DND once the rule is established.**"
                        );
                    }
                    const channel = interaction.options.getChannel("channel");
                    const role = interaction.options.getRole("role");
                    if (role || channel) {
                        let exemptroles = Array.from(rule.exemptRoles.keys())
                        let exemptchannels = Array.from(rule.exemptChannels.keys())
                        console.log(exemptroles)
                        if (role && exemptroles.includes(role.id)) {
                            exemptroles = keywords.filter(words => words !== `${role.id}`)
                        }
                        if (channel && exemptchannels.includes(channel.id)) {
                            if (channel.type !== ChannelType.GuildText) {
                                return interaction.reply(
                                    "**⚠️ Please submit an existing text channel.**"
                                );
                            }
                            exemptchannels = keywords.filter(words => words !== `${channel.id}`)
                        }
                        rule.edit({
                            exemptRoles: exemptroles,
                            exemptChannels: exemptchannels,
                        });
                    } else {
                        return interaction.reply(
                            "**⚠️ Please submit a valid role or channel to exempt. Note only text channels are accepted.**"
                        );
                    }
                    interaction.reply("**✅ The server DND rule has been updated.**");
                }
                break;
            case "force-remove":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `**❌ You don't have permission to use this command.**`, ephemeral: true })
                    }
                    const user = interaction.options.getUser("user")
                    const member = interaction.options.getMember("user")
                    if (!rule || !rule.triggerMetadata.keywordFilter.includes(`<@${user.id}>`)) {
                        return interaction.reply(
                            `**⚠️ This user is not on DND.**`
                        );
                    }

                    let keywords = await rule.triggerMetadata.keywordFilter
                    keywords = keywords.filter(words => words !== `<@${user.id}>`)
                    rule.edit({
                        triggerMetadata: {
                            keywordFilter: keywords,
                        },
                    });
                    const name = member.nickname || user.displayname || user.username
                    if (name.startsWith('[DND]')) {
                        const newname = name.slice(6)
                        await member.setNickname(newname)
                    }
                    interaction.reply(`**✅ The user \`${user}\` has succesfully been force removed from DND mode status.**`);
                }
                break;
                case "info":
                    {


                        if (!rule ) {
                            return interaction.reply(
                                `**❌ It seems like no one has ever been on DND in this server.**`
                            );
                        }
    
                        let keywords = await rule.triggerMetadata.keywordFilter
                        keywords = keywords.filter(words => words !== `<@1>`)
                        const embed = new EmbedBuilder()
                        .setTitle(`DND mention block info`)
                        .setFooter({text : `Note: All admins bypass this system`})
                        .setColor("#9500CC")
                        .setTimestamp()
                        const loop = keywords.length
                        if(loop === 0){
                            embed.addFields({name : `**Users on DND :**`, value : `➡️ No users on DND`, inline : true})
                        }
                        else if(loop < 11){

                            let afkusers = ''
                            for(let i = 0; i< loop; i++){
                            if(i + 1 < loop){
                                const userId = keywords[i].match(/\d+/)[0];

                                const member = await interaction.guild.members.fetch(userId)
                                const user = await interaction.client.users.fetch(userId)
                                const name = member.nickname || user.displayname || user.username

                                afkusers += `➡️  ${name}\n`;
                            }
                            else{
                                const userId = keywords[i].match(/\d+/)[0];
                                const member = await interaction.guild.members.fetch(userId)
                                const user = await interaction.client.users.fetch(userId)
                                const name = member.nickname || user.displayname || user.username
                            
                                afkusers+=`➡️  ${name}\n`
                            }
                            }
                            embed.addFields({name : `**Users on DND**`, value : afkusers, inline : true})
                        }
                        else{
                            embed.addFields({name : `**Users on DND**`, value : `➡️  ${loop} users on DND`, inline : true})
                        }
                        let exemptchannels = Array.from(rule.exemptChannels.keys())
                        let exemptroles = Array.from(rule.exemptRoles.keys())
                        if(exemptroles.length === 0){
                            embed.addFields({name : `**Exempt Roles**`, value : `➡️  No role exemptions`, inline : true})
                        }
                        else{
                            let roles = ''
                            for(let i = 0; i < exemptroles.length; i++){
                                if(i + 1 < exemptroles.length){
                                    roles += `➡️  <@&${exemptroles[i]}>\n`;
                                }
                                else{
                                    roles +=`➡️  <@&${exemptroles[i]}>\n`
                                }
                            }
                            embed.addFields({name : `**Exempt Roles**` , value : `${roles}`, inline : true});
                        }
                        if(exemptchannels.length === 0){
                            embed.addFields({name : `**Exempt Channels**`, value : `➡️  No channel exemptions`, inline : true})
                        }
                        else{
                            let channels = ''
                            for(let i = 0; i < exemptchannels.length; i++){
                                if(i + 1 < exemptchannels.length){
                                    channels += `➡️  <#${exemptchannels[i]}>\n`;
                                }
                                else{
                                    channels +=`➡️  <#${exemptchannels[i]}>\n`
                                }
                            }
                            embed.addFields({name : `**Exempt Channels**` , value : `${channels}`, inline : true});
                        }
                        interaction.reply({embeds : [embed]})


                    }
                    break;
            case "warning":
                {
                    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                        return interaction.reply({ content: `❌ You don't have permission to use this command.`, ephemeral: true })
                    }
                    const channel = interaction.options.getChannel("channel");

                    if (!channel || channel.type !== ChannelType.GuildText) {
                        return interaction.reply('⚠️ Please submit a text channel');
                    }
                    rule.edit({
                        actions: [
                            {
                                type: 1,
                                metadata: {
                                    customMessage:
                                        '⚠️ This user is currently on DND mode. This message got blocked by Your Bot',
                                },
                            },
                            {
                                type: 2,
                                metadata: {
                                    channel: channel.id,
                                },
                            },
                        ],
                    });

                    interaction.reply('**✅ Your warning channel has been updated.**');
                }
                break;

            case "remove-warning": {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                    return interaction.reply({ content: `**❌ You don't have permission to use this command.**`, ephemeral: true })
                }
                rule.edit({
                    actions: [
                        {
                            type: 1,
                            metadata: {
                                customMessage:
                                    '⚠️ This user is currently on DND mode. This message got blocked by Your Bot.',
                            },
                        },
                    ],
                });

                interaction.reply('**✅ Your warning channel has been removed.**');
            }
        }

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    },
};

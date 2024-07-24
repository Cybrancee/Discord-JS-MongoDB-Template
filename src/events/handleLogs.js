const { EmbedBuilder, Events } = require('discord.js');

function handleLogs(client) {
    const logSchema = require('../Schemas.js/logSchema');

    function send_log(guildId, embed) {
        logSchema.findOne({ Guild: guildId }, async (err, data) => {
            if(!data || !data.Channel) return;
            const logChannel = client.channels.cache.get(data.Channel);

            if (!logChannel) return;
            embed.setTimestamp();

            try {
                logChannel.send({ embeds: [embed] });

            } catch (err) {
                console.log('Error sending logs!');
            }
        });
    }

    // User Banned
    client.on('guildBanAdd', function (ban) {
        try {
            const guild = ban.guild;
            const user = ban.user;
            
    
            if (!guild) return;
    
            const pfp = user.displayAvatarURL();
    
            const embed = new EmbedBuilder()
                .setColor("#f51702")
                .setTimestamp()
                .setDescription(`> <@${user.id}> / ${user.username}`)
                .setAuthor({ name: `Ban`, iconURL: pfp })
                .setThumbnail(pfp)
                .setFooter({ text: `User's ID: ${user.id}` });
    
            send_log(guild.id, embed);
        } catch (err) {
            console.error('Error logging ban add:', err);
        }
    });
    
    

    // User Unbanned
    client.on('guildBanRemove', function (ban) {
        try {
            const guild = ban.guild;
            const user = ban.user;
            const pfp = user.displayAvatarURL();
    
            if (!guild) return;
    
            const embed = new EmbedBuilder()
                
                .setColor('#cf4800')
                .setTimestamp()
                .setDescription(`> <@${user.id}> / ${user.username}`)
                .setAuthor({ name: `Unban`, iconURL: pfp })
                .setThumbnail(pfp)
                .setFooter({ text: `User's ID: ${user.id}` });
    
            return send_log(guild.id, embed);
        } catch (err) {
            console.error('Error logging ban remove:', err);
        }
    });
    

    //character color: "#A5D3F7"

    client.on("messageDelete", function (message) {
 
        try {
            if (message.guild === null) return;
            if (message.author.bot) return;
            
            const pfp = message.author.displayAvatarURL();

            const embed = new EmbedBuilder()
            .setColor("Red")
            .setTimestamp()
            .setDescription(`> **Message sent by <@${message.author.id}> was deleted in ${message.channel}**\n \`${message.content}\``)
            .setAuthor({ name: `${message.author.username}`, iconURL: `${pfp}` })
            .setFooter({ text: `User's ID: ${message.author.id}`})
 
            return send_log(message.guild.id, embed);
        } catch (err) {
            console.log(err)
        }
 
    });
 
    // Channel Topic Updating 
    /*client.on("guildChannelTopicUpdate", function (channel, oldTopic, newTopic) {
 
        try {
            if (channel.guild === null) return;
 
            const embed = new EmbedBuilder()
            .setTitle('> Topic Changed')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields({ name: `• Channel`, value: `> ${channel}`})
            .addFields({ name: `• Old Topic`, value: `> ${oldTopic}`})
            .addFields({ name: `• New Topic`, value: `> ${newTopic}`})
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Topic Update`})
 
            return send_log(channel.guild.id, embed);
 
        } catch (err) {
            console.log('Err logging topic update')
        }
    });
 */
    // Channel Permission Updating
    /*client.on("guildChannelPermissionsUpdate", function (channel, oldPermissions, newPermissions) {
 
        try {
            if (channel.guild === null) return;
 
            const embed = new EmbedBuilder()
            .setTitle('> Channel Updated')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields({ name: `• Channel`, value: `> ${channel}`})
            .addFields({ name: `• Changes`, value: `> Channel's permissions/name were updated`})
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Permissions Update`})
 
            return send_log(channel.guild.id, embed);
        } catch (err) {
            console.log('Err logging channel update')
        }
    })
 */
    // unhandled Guild Channel Update
    /*client.on("unhandledGuildChannelUpdate", function (oldChannel, newChannel) {
 
        try {
 
        if (oldChannel.guild === null) return;
 
        const embed = new EmbedBuilder()
            .setTitle('> Channel Updated')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields({ name: `• Channel`, value: `> ${oldChannel}`})
            .addFields({ name: `• Changes`, value: `> **PixelVal** couldn't find any changes!`})
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Channel Update`})
 
        return send_log(oldChannel.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging unhandled channel update')
    }
 
    });
 */
    // Member Started Boosting
    client.on("guildMemberBoost", function (member) {
 
        try {
 
        if (member.guild === null) return;
        const pfp = member.user.displayAvatarURL();
 
        const embed = new EmbedBuilder()
            
            .setColor('#FF73FA')
            .setTimestamp()
            .setDescription(`> **<@${member.user.id}> just boosted this server!**`)
            .setAuthor({ name: `${member.user.username}`, iconURL: `${pfp}` })
            .setFooter({ text: `Boosting Started`})
 
        return send_log(member.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging member boost start')
    }
 
    });
 
    // Member Unboosted
    client.on("guildMemberUnboost", function (member) {
 
        try {
 
        if (member.guild === null) return;
        const pfp = member.user.displayAvatarURL();
 
        const embed = new EmbedBuilder()
            
            .setColor('#FF73FA')
            .setTimestamp()
            .setDescription(`> **<@${member.user.id}> stopped boosting this server!**`)
            .setAuthor({ name: `${member.user.username}`, iconURL: `${pfp}` })
            .setFooter({ text: `Boosting Stopped`})
 
        return send_log(member.guild.id, embed);
    
    } catch (err) {
        console.log('Err logging member boost stop')
    }
 
    });
 
    // Member Got Role
    client.on("guildMemberRoleAdd", function (member, role) {
       
        try {
       
        if (member.guild === null) return;
        const pfp = member.user.displayAvatarURL();
 
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${member.user.username}`, iconURL: `${pfp}` })
            .setColor('#A5D3F7')
            .setTimestamp()
            .setDescription(`> **<@${member.user.id}> was added to ${role} role.**`)
            .setFooter({ text: `User's ID: ${member.user.id}`})
 
        return send_log(member.guild.id, embed);
 
    } catch (err) {
        console.log("Error member role add")
    }
 
    })
 
    // Member Lost Role
    client.on("guildMemberRoleRemove", function (member, role) {
       
        try {
       
        if (member.guild === null) return;
        const pfp = member.user.displayAvatarURL()
 
        const embed = new EmbedBuilder()
            .setAuthor({ name: `${member.user.username}`, iconURL: `${pfp}` })
            .setColor('#A5D3F7')
            .setTimestamp()
            .setDescription(`> **<@${member.user.id}> was removed from ${role} role.**`)
            .setFooter({ text: `User's ID: ${member.user.id}`})
 
        return send_log(member.guild.id, embed);
 
    } catch (err) {
        console.log("Error member role remove")
    }
 
    })
 
    // Nickname Changed
    client.on("guildMemberNicknameUpdate", function (member, oldNickname, newNickname) {
 
        try {
        const pfp = member.user.displayAvatarURL();
 
        const embed = new EmbedBuilder()
            .setColor('#A5D3F7')
            .setTimestamp()
            
            .setAuthor({ name: `${member.user.username}`, iconURL: pfp})
            .setFooter({ text: `User's ID: ${member.id}`})
            
            .addFields({ name: `Old:`, value: `> \`${oldNickname || 'None'}\``})
            .addFields({ name: `New:`, value: `> \`${newNickname || 'None'}\``})
 
        return send_log(member.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging nick update')
    }
 
    });
 
    // Member Joined
    // client.on("guildMemberAdd", (member) => {
 
    //     try {
 
    //     if (member.guild === null) return;
 
    //     const embed = new EmbedBuilder()
    //         .setTitle('> User Joined')
    //         .setColor('DarkRed')
    //         .addFields({ name: `• Member`, value: `> ${member.user}`})
    //         .addFields({ name: `• Member ID`, value: `> ${member.user.id}`})
    //         .addFields({ name: `• Member Tag`, value: `> ${member.user.tag}`})
    //         .setTimestamp()
            
    //         .setAuthor({ name: `🚧 Logging System`})
    //         .setFooter({ text: `🚧 User Joined`})
 
    //     return send_log(member.guild.id, embed);
 
    // } catch (err) {
    //     console.log('Err logging member add')
    // }
 
    // });
 
    // Member Left
    // client.on("guildMemberRemove", (member) => {
 
    //     try {
 
    //     if (member.guild === null) return;
 
    //     const embed = new EmbedBuilder()
    //         .setTitle('> User Left')
    //         .setColor('DarkRed')
    //         .addFields({ name: `• Member`, value: `> ${member.user}`})
    //         .addFields({ name: `• Member ID`, value: `> ${member.user.id}`})
    //         .addFields({ name: `• Member Tag`, value: `> ${member.user.tag}`})
    //         .setTimestamp()
            
    //         .setAuthor({ name: `🚧 Logging System`})
    //         .setFooter({ text: `🚧 User Left`})
 
    //     return send_log(member.guild.id, embed);
 
    // } catch (err) {
    //     console.log('Err logging member leave')
    // }
 
    // });
 
    // Server Boost Level Up
    /*client.on("guildBoostLevelUp", function (guild, oldLevel, newLevel) {
 
        try {
 
        if (guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle(`> ${guild.name} advanced a Boosting Level`)
        .setColor('DarkRed')
        .setTimestamp()
        .addFields({ name: `• Info`, value: `> **${guild.name}** advanced from level **${oldLevel}** to **${newLevel}**!`})
        .addFields({ name: `• Server`, value: `> ${member.guild.name}`})
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 Boosting Level Up`})
 
        return send_log(guild.id, embed);
 
    } catch (err) {
        console.log('Err logging boost level up')
    }
 
    })
 */
    // Server Boost Level Down
    /*client.on("guildBoostLevelDown", function (guild, oldLevel, newLevel) {
 
        try {
 
        if (guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle(`> ${guild.name} lost a Boosting Level`)
        .setColor('DarkRed')
        .setTimestamp()
        .addFields({ name: `• Info`, value: `> **${guild.name}** lost a level, from **${oldLevel}** to **${newLevel}**!`})
        .addFields({ name: `• Server`, value: `> ${member.guild.name}`})
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 Boosting Level Down`})
 
        return send_log(guild.id, embed);
 
    } catch (err) {
        console.log('Err logging level down')
    }
 
    })
 */
    // Banner Added
    /*client.on("guildBannerAdd", function (guild, bannerURL) {
 
        try {
 
        if (guild === null) return;
 
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name}'s Banner was Updated`)
            .setColor('Purple')
            .addFields({ name: `• Banner URL`, value: `> ${bannerURL}`})
            .setImage(bannerURL)
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Banner Updated`})
            .setTimestamp()
 
        return send_log(guild.id, embed);
 
    } catch (err) {
        console.log('Err logging banner change')
    }
 
    })
 */
    // AFK Channel Added
    /*client.on("guildAfkChannelAdd", function (guild, afkChannel) {
 
        try {
 
        if (guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle('> AFK channel Added')
        .setColor('DarkRed')
        .addFields({ name: `• AFK Channel`, value: `> ${afkChannel}`})
        .setTimestamp()
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 AFK Channel Added`})
 
        return send_log(guild.id, embed);
 
    } catch (err) {
        console.log('Err logging afk channel add')
    }
 
    })
 */
    // Guild Vanity Add
    /*client.on("guildVanityURLAdd", function (guild, vanityURL) {
 
        try {
 
        if (guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle('> Vanity URL Added')
        .setColor('DarkRed')
        .setTimestamp()
        .addFields({ name: `• Vanity URL`, value: `> ${vanityURL}`})
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 Vanity Created`})
 
 
        return send_log(guild.id, embed);
 
    } catch (err) {
        console.log('Err logging vanity add')
    }
 
    })
 */
    // Guild Vanity Remove
    /*client.on("guildVanityURLRemove", function (guild, vanityURL) {
 
        try {
 
        if (guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle('> Vanity URL Removed')
        .setColor('DarkRed')
        .addFields({ name: `• Old Vanity`, value: `> ${vanityURL}`})
        .setTimestamp()
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 Vanity Removed`})
 
        return send_log(guild.id, embed);
 
    } catch (err) {
        console.log('Err logging vanity remove')
    }
 
    })
 */
    // Guild Vanity Link Updated
    /*client.on("guildVanityURLUpdate", function (guild, oldVanityURL, newVanityURL) {
 
        try {
 
        if (guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle('> Vanity URL Updated')
        .setColor('DarkRed')
        .addFields({ name: `• Old Vanity`, value: `> ${oldVanityURL}`})
        .addFields({ name: `• New Vanity`, value: `> ${newVanityURL}`})
        .setTimestamp()
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 Vanity Updated`})
 
        return send_log(guild.id, embed);
 
    } catch (err) {
        console.log('Err logging vanity update')
    }
 
    })
 */
    // Message Pinned
    /*client.on("messagePinned", function (message) {
 
        try {
 
        if (message.guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle('> Message Pinned')
        .setColor('DarkRed')
        .setTimestamp()
        .addFields({ name: `• Pinner`, value: `> ${message.author}`})
        .addFields({ name: `• Message`, value: `> ${message.content}`})
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 Message Pinned`})
 
        return send_log(message.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging pin add')
    }
 
    })
 */
    // Message Edited
    client.on("messageContentEdited", function (message, oldContent, newContent) {
 
        try {
 
        if (message.guild === null) return;
        if (message.author.bot) return;

        const guildId = message.guild.id; // ID des Servers
        const channelId = message.channel.id; // ID des Kanals, in dem sich die Nachricht befindet
        const messageId = message.id;

        const messageLink = `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
 
        const pfp = message.author.displayAvatarURL();

        const embed = new EmbedBuilder()
        .setColor("#A5D3F7")
        .setTimestamp()
        .setDescription(`> **Message Edited in ${message.channel}** [To Message](${messageLink})`)
        .addFields({ name: `**Old:**`, value: `> \`${oldContent}\``})
        .addFields({ name: `**New:**`, value: `> \`${newContent}\``})
        .setAuthor({ name: `${message.author.username}`, iconURL: `${pfp}` })
        .setFooter({ text: `User's ID: ${message.author.id}`})
 
 
 
        return send_log(message.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging message edit')
    }
 
    })
 
    // Role Position Updated
    /*client.on("rolePositionUpdate", function (role, oldPosition, newPosition) {
 
        try {
 
        if (role.guild === null) return;
 
        const embed = new EmbedBuilder()
        .setTitle('> Role position Updated')
        .setColor('DarkRed')
        .addFields({ name: `• Role`, value: `> ${role}`})
        .addFields({ name: `• Old Position`, value: `> ${oldPosition}`})
        .addFields({ name: `• New Position`, value: `> ${newPosition}`})
        .setTimestamp()
        
        .setAuthor({ name: `🚧 Logging System`})
        .setFooter({ text: `🚧 Role Position Updated`})
 
    return send_log(role.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging role pos update')
    }
 
    })
 */
    // Role Permission Updated
    /*client.on("rolePermissionsUpdate", function (role, oldPermissions, newPermissions) {
 
        try {
 
        if (role.guild === null) return;
 
        const embed = new EmbedBuilder()
            .setTitle('> Role permissions Updated')
            .setColor('DarkRed')
            .addFields({ name: `• Role`, value: `> ${role}`})
            .addFields({ name: `• Old Permissions`, value: `> ${oldPermissions}`})
            .addFields({ name: `• New Permissions`, value: `> ${newPermissions}`})
            .setTimestamp()
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Role Permissions Updated`})
 
        return send_log(role.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging role perms update')
    }
 
    })
 */
    // VC Switch
    /*client.on("voiceChannelSwitch", function (member, oldChannel, newChannel) {
 
        try {
 
        if (member.guild === null) return;
 
        const embed = new EmbedBuilder()
            .setTitle('> Voice channel Switched')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields({ name: `• Member`, value: `> ${member.user}`})
            .addFields({ name: `• From`, value: `> ${oldChannel}`})
            .addFields({ name: `• To`, value: `> ${newChannel}`})
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Voice Swtich`})
 
        return send_log(member.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging vc switch')
    }
 
    })
 */
    // Role Created
    client.on("roleCreate", function (role) {
        try {
            if (role.guild === null) return;
            const serverName = role.guild.name
            const serverIconURL = role.guild.iconURL();
            
            setTimeout(async () => {
                const embed = new EmbedBuilder()
                    .setTimestamp()
                    .setDescription(`**A role was created: \`${role.name}\`** `)
    
                if (serverIconURL) {
                    embed.setAuthor({ name: `${serverName}`, iconURL: serverIconURL });
                } else {
                    embed.setAuthor({ name: `${serverName}`});
                }
    
                if (role.hexColor && role.hexColor !== '#000000') {
                    embed.setColor(role.hexColor);
                } else {
                    embed.setColor('#A5D3F7'); 
                }
    
                embed.setFooter({ text: `Role ID: ${role.id}` });
    
                await send_log(role.guild.id, embed);
            }, 20000);
        } catch (err) {
            console.log('Error logging role create:', err);
        }
    });
    
    

    
    
 
    // Role Deleted
    client.on("roleDelete", function (role) {
 
        try {
 
        if (role.guild === null) return;
        const serverName = role.guild.name
        const serverIconURL = role.guild.iconURL();
 
        const embed = new EmbedBuilder()
        .setColor('#A5D3F7')
        .setDescription(`**A role was Deleted: \`${role.name}\`**`)
        .setTimestamp()
        
        if (serverIconURL) {
            embed.setAuthor({ name: `${serverName}`, iconURL: serverIconURL });
        } else {
            embed.setAuthor({ name: `${serverName}`});
        }
        
        if (role.hexColor && role.hexColor !== '#000000') {
            embed.setColor(role.hexColor);
        } else {
            embed.setColor('#A5D3F7'); 
        }

        embed.setFooter({ text: `Role ID: ${role.id}` });
 
    return send_log(role.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging role delete')
    }
    });
 
    
    
 
    
 
    // Channel Created
    /*client.on("channelCreate", function (channel) {
 
        try {
 
        if (channel.guild === null) return;
 
        const embed = new EmbedBuilder()
            .setTitle('> Channel Created')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields({ name: `• Channel`, value: `> ${channel}`})
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Channel Created`})
 
        return send_log(channel.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging channel create')
    }
 
    });
 */
    // Channel Deleted
    /*client.on("channelDelete", function (channel) {
 
        try {
 
        if (channel.guild === null) return;
 
        const embed = new EmbedBuilder()
            .setTitle('> Channel Deleted')
            .setColor('DarkRed')
            .setTimestamp()
            .addFields({ name: `• Channel`, value: `> ${channel}`})
            
            .setAuthor({ name: `🚧 Logging System`})
            .setFooter({ text: `🚧 Channel Deleted`})
 
        return send_log(channel.guild.id, embed);
 
    } catch (err) {
        console.log('Err logging channel delete')
    }
 
    });
*/
}

module.exports = { handleLogs };
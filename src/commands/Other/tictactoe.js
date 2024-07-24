const { TicTacToe } = require('discord-gamecord');
const { SlashCommandBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
    .setName('tictactoe')
    .setDescription('Play ttt with your friends.')
    .addUserOption(option => option.setName('user').setDescription('The opponent').setRequired(true)),
    async execute (interaction) {
        if (cooldowns.has(interaction.user.id)) {
            const expirationTime = cooldowns.get(interaction.user.id) + 5000; 
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return interaction.reply({ content: `**⚠️ ${interaction.user.username} You are on cooldown.**\nPlease wait \`${timeLeft.toFixed(1)}\` seconds before using \`/tictactoe\` again.`, ephemeral: true });
            }
        }

        cooldowns.set(interaction.user.id, Date.now());

        const filter = i => i.isStringSelectMenu() && i.customId === 'ttt';
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000 
        });

        const opponent = interaction.options.getUser('user');
        
        
        if (opponent.id === interaction.client.user.id) {
            return await interaction.reply({content: "❌ You can't play TicTacToe against the bot!", ephemeral: true});
        }

        const Game = new TicTacToe({
            message: interaction,
            isSlashGame: true,
            opponent: interaction.options.getUser('user'),
            embed: {
                title: 'Tic Tac Toe',
                color: '#2B2D31',
                statusTitle: 'Status',
                overTitle: 'Game Over'
            },
            emojis: {
                xButton: '❌',
                oButton: '𖧋',
                blankButton: '🟧'
            },
            mentionUser: true,
            timeoutTime: 60000,
            xButtonStyle: 'DANGER',
            oButtonStyle: 'PRIMARY',
            turnMessage: '{emoji} | its turn of player **{player}**',
            winMessage: '**{player}** won the TicTacToe Game.',
            tieMessage: 'The game tied! No one won the game.',
            timeoutMessage: 'The game went unfinished! No one won the game.',
            playerOnlyMessage: 'Only {player} and {opponent} can use these Buttons.'
        });

        Game.startGame();
        Game.on('gameover', result => {
            return;
        })

        collector.on('end', () => {
            cooldowns.delete(interaction.user.id);
        });
    }
}
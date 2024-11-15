const { TicTacToe } = require('discord-gamecord');
const { SlashCommandBuilder } = require('discord.js');
const cooldowns = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Play Tic Tac Toe with a friend.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The opponent')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const userId = interaction.user.id;

        const cooldownDuration = 5000;
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + cooldownDuration;
            if (Date.now() < expirationTime) {
                const timeLeft = ((expirationTime - Date.now()) / 1000).toFixed(1);
                return interaction.reply({ 
                    content: `**⏳ ${interaction.user.username}, you're on cooldown!**\nPlease wait \`${timeLeft}s\` before using \`/tictactoe\` again.`,
                    ephemeral: true 
                });
            }
        }

        cooldowns.set(userId, Date.now());

        const opponent = interaction.options.getUser('user');

        if (opponent.id === interaction.client.user.id) {
            cooldowns.delete(userId);
            return interaction.reply({ content: "❌ You can't play Tic Tac Toe against the bot!", ephemeral: true });
        }

        try {
            const Game = new TicTacToe({
                message: interaction,
                isSlashGame: true,
                opponent: opponent,
                embed: {
                    title: 'Tic Tac Toe',
                    color: '#2B2D31',
                    statusTitle: 'Status',
                    overTitle: 'Game Over'
                },
                emojis: {
                    xButton: '✖️',
                    oButton: '⭕',
                    blankButton: '🟧'
                },
                mentionUser: true,
                timeoutTime: 60000,
                xButtonStyle: 'DANGER',
                oButtonStyle: 'PRIMARY',
                turnMessage: '{emoji} | It’s **{player}**’s turn.',
                winMessage: '🎉 Congratulations! **{player}** won the Tic Tac Toe game.',
                tieMessage: 'It’s a tie! No one won the game.',
                timeoutMessage: 'The game was left unfinished. No one won.',
                playerOnlyMessage: 'Only {player} and {opponent} can use these buttons.'
            });

            Game.startGame();
            Game.on('gameover', () => {
                cooldowns.delete(userId);
            });
        } catch (error) {
            cooldowns.delete(userId);
            console.error("An error occurred while starting the Tic Tac Toe game:", error);
            interaction.reply({ content: "❌ An error occurred while trying to start the game. Please try again later.", ephemeral: true });
        }
    }
};

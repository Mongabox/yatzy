using Yatzy.AI;
using Yatzy.Models;
using Yatzy.Models.Enums;
using Yatzy.Presentation;
using Yatzy.Views;

namespace Yatzy.Controllers;

public sealed class GameController
{
    private readonly IGameView _view;
    private readonly IBotStrategy _botStrategy;
    private readonly Func<GameState> _createGame;

    public GameController(
        IGameView view,
        IBotStrategy botStrategy,
        Func<GameState> createGame)
    {
        _view = view ?? throw new ArgumentNullException(nameof(view));
        _botStrategy = botStrategy ?? throw new ArgumentNullException(nameof(botStrategy));
        _createGame = createGame ?? throw new ArgumentNullException(nameof(createGame));
    }

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            var action = await _view.RequestMainMenuActionAsync(cancellationToken);
            if (action == MainMenuAction.Exit)
                return;

            bool playAgain;
            do
            {
                playAgain = await PlayGameAsync(cancellationToken) == FinalAction.PlayAgain;
            }
            while (playAgain && !cancellationToken.IsCancellationRequested);

            if (!playAgain)
                return;
        }
    }

    private async Task<FinalAction> PlayGameAsync(CancellationToken cancellationToken)
    {
        var state = _createGame();

        while (state.IsGameRunning)
        {
            state.StartRound();
            await PlayerTurnAsync(state, cancellationToken);
            await BotTurnAsync(state, cancellationToken);
            state.AdvanceRound();
        }

        return await _view.RequestFinalActionAsync(
            GameViewModelFactory.CreateFinal(state),
            cancellationToken);
    }

    private async Task PlayerTurnAsync(GameState state, CancellationToken cancellationToken)
    {
        state.Dice.RollAll();
        state.RegisterThrow();

        while (state.ThrowsLeft > 0)
        {
            var selected = await _view.RequestDiceToRerollAsync(
                GameViewModelFactory.CreateBoard(state),
                cancellationToken);

            if (selected.Count == 0)
                break;

            state.Dice.Reroll(selected);
            state.RegisterThrow();
        }

        var category = await _view.RequestCategoryChoiceAsync(
            GameViewModelFactory.CreateBoard(state),
            state.PlayerCard.AvailableCategories,
            cancellationToken);

        int score = state.PlayerCard.Record(category, state.Dice.Values);
        await _view.ContinueAfterPlayerTurnAsync(
            GameViewModelFactory.CreateBoard(state),
            new TurnResultViewModel(category.ToString(), score),
            cancellationToken);
    }

    private async Task BotTurnAsync(GameState state, CancellationToken cancellationToken)
    {
        state.Dice.RollAll();

        for (int throwIndex = 0; throwIndex < GameState.MaxThrows - 1; throwIndex++)
        {
            var selected = _botStrategy.ChooseDiceToReroll(state.BotCard, state.Dice.Values);
            if (selected.Count == 0)
                break;
            state.Dice.Reroll(selected);
        }

        var category = _botStrategy.ChooseCategory(state.BotCard, state.Dice.Values);
        int score = state.BotCard.Record(category, state.Dice.Values);

        await _view.ContinueAfterBotTurnAsync(
            GameViewModelFactory.CreateBoard(state),
            new TurnResultViewModel(category.ToString(), score),
            cancellationToken);
    }
}

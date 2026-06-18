using Yatzy.Models.Enums;
using Yatzy.Presentation;

namespace Yatzy.Views;

public interface IGameView
{
    Task<MainMenuAction> RequestMainMenuActionAsync(CancellationToken cancellationToken);

    Task<IReadOnlySet<int>> RequestDiceToRerollAsync(
        BoardViewModel board,
        CancellationToken cancellationToken);

    Task<Category> RequestCategoryChoiceAsync(
        BoardViewModel board,
        IReadOnlyList<Category> availableCategories,
        CancellationToken cancellationToken);

    Task ContinueAfterPlayerTurnAsync(
        BoardViewModel board,
        TurnResultViewModel result,
        CancellationToken cancellationToken);

    Task ContinueAfterBotTurnAsync(
        BoardViewModel board,
        TurnResultViewModel result,
        CancellationToken cancellationToken);

    Task<FinalAction> RequestFinalActionAsync(
        FinalViewModel final,
        CancellationToken cancellationToken);
}

using Yatzy.Models.Enums;
using Yatzy.Presentation;

namespace Yatzy.Views;

public sealed class ConsoleView : IGameView
{
    public Task<MainMenuAction> RequestMainMenuActionAsync(CancellationToken cancellationToken)
    {
        Console.WriteLine("1 — играть, 2 — выйти");
        return Task.FromResult(Console.ReadLine()?.Trim() == "2"
            ? MainMenuAction.Exit
            : MainMenuAction.Play);
    }

    public Task<IReadOnlySet<int>> RequestDiceToRerollAsync(
        BoardViewModel board,
        CancellationToken cancellationToken)
    {
        PrintBoard(board);
        Console.WriteLine("Кубики для переброса (1-5 через пробел), Enter — оставить:");
        var selected = (Console.ReadLine() ?? string.Empty)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(value => int.TryParse(value, out int index) ? index - 1 : -1)
            .Where(index => index is >= 0 and < 5)
            .ToHashSet();
        return Task.FromResult<IReadOnlySet<int>>(selected);
    }

    public Task<Category> RequestCategoryChoiceAsync(
        BoardViewModel board,
        IReadOnlyList<Category> availableCategories,
        CancellationToken cancellationToken)
    {
        PrintBoard(board);
        Console.WriteLine(string.Join(", ", availableCategories.Select((category, index) => $"{index + 1}:{category}")));
        int.TryParse(Console.ReadLine(), out int selected);
        selected = Math.Clamp(selected, 1, availableCategories.Count);
        return Task.FromResult(availableCategories[selected - 1]);
    }

    public Task ContinueAfterPlayerTurnAsync(
        BoardViewModel board,
        TurnResultViewModel result,
        CancellationToken cancellationToken) =>
        WaitAsync(board, $"Записано: {result.Category} → {result.Score}");

    public Task ContinueAfterBotTurnAsync(
        BoardViewModel board,
        TurnResultViewModel result,
        CancellationToken cancellationToken) =>
        WaitAsync(board, $"Бот записал: {result.Category} → {result.Score}");

    public Task<FinalAction> RequestFinalActionAsync(
        FinalViewModel final,
        CancellationToken cancellationToken)
    {
        Console.WriteLine($"Финал: вы {final.PlayerTotal}, бот {final.BotTotal}");
        Console.WriteLine("1 — ещё раз, 2 — выйти");
        return Task.FromResult(Console.ReadLine()?.Trim() == "1"
            ? FinalAction.PlayAgain
            : FinalAction.Exit);
    }

    private static Task WaitAsync(BoardViewModel board, string message)
    {
        PrintBoard(board);
        Console.WriteLine(message);
        Console.ReadLine();
        return Task.CompletedTask;
    }

    private static void PrintBoard(BoardViewModel board)
    {
        Console.Clear();
        Console.WriteLine($"Раунд {board.Round}/13, бросков осталось: {board.ThrowsLeft}");
        Console.WriteLine($"Кубики: {string.Join(" ", board.Dice)}");
        Console.WriteLine($"Счёт: {board.PlayerTotal} — {board.BotTotal}");
    }
}

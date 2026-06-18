using Yatzy.Models;
using Yatzy.Models.Enums;

namespace Yatzy.Presentation;

public enum FinalAction
{
    PlayAgain,
    Exit,
}

public sealed record BoardViewModel(
    IReadOnlyDictionary<string, int?> PlayerCard,
    IReadOnlyDictionary<string, int?> BotCard,
    IReadOnlyDictionary<string, int> PotentialScores,
    IReadOnlyList<int> Dice,
    int ThrowsLeft,
    int Round,
    int PlayerUpperSum,
    int BotUpperSum,
    int PlayerTotal,
    int BotTotal);

public sealed record FinalViewModel(
    IReadOnlyDictionary<string, int?> PlayerCard,
    IReadOnlyDictionary<string, int?> BotCard,
    int PlayerUpperSum,
    int BotUpperSum,
    int PlayerTotal,
    int BotTotal);

public sealed record TurnResultViewModel(string Category, int Score);

public static class GameViewModelFactory
{
    public static BoardViewModel CreateBoard(GameState state)
    {
        var values = state.Dice.Values;
        var potentialScores = values.All(value => value is >= 1 and <= 6)
            ? CombinationChecker.GetAllScores(values)
                .ToDictionary(pair => pair.Key.ToString(), pair => pair.Value)
            : new Dictionary<string, int>();

        return new BoardViewModel(
            SerializeCard(state.PlayerCard),
            SerializeCard(state.BotCard),
            potentialScores,
            values,
            state.ThrowsLeft,
            state.CurrentRound,
            state.PlayerCard.UpperSectionSum,
            state.BotCard.UpperSectionSum,
            state.PlayerCard.TotalScore,
            state.BotCard.TotalScore);
    }

    public static FinalViewModel CreateFinal(GameState state) =>
        new(
            SerializeCard(state.PlayerCard),
            SerializeCard(state.BotCard),
            state.PlayerCard.UpperSectionSum,
            state.BotCard.UpperSectionSum,
            state.PlayerCard.TotalScore,
            state.BotCard.TotalScore);

    private static IReadOnlyDictionary<string, int?> SerializeCard(ScoreCard card) =>
        Enum.GetValues<Category>().ToDictionary(category => category.ToString(), card.GetScore);
}

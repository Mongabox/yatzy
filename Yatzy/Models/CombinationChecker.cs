using Yatzy.Models.Enums;

namespace Yatzy.Models;

public static class CombinationChecker
{
    public static int Calculate(Category category, IReadOnlyList<int> dice)
    {
        ValidateDice(dice);

        return category switch
        {
            Category.Ones => UpperSection(dice, 1),
            Category.Twos => UpperSection(dice, 2),
            Category.Threes => UpperSection(dice, 3),
            Category.Fours => UpperSection(dice, 4),
            Category.Fives => UpperSection(dice, 5),
            Category.Sixes => UpperSection(dice, 6),
            Category.ThreeOfAKind => CheckNOfAKind(dice, 3),
            Category.FourOfAKind => CheckNOfAKind(dice, 4),
            Category.FullHouse => GetCounts(dice).Values.Order().SequenceEqual([2, 3]) ? 25 : 0,
            Category.SmallStraight => CheckSmallStraight(dice),
            Category.BigStraight => CheckBigStraight(dice),
            Category.Yahtzee => dice.Distinct().Count() == 1 ? 50 : 0,
            Category.Chance => dice.Sum(),
            _ => throw new ArgumentOutOfRangeException(nameof(category), category, null),
        };
    }

    public static IReadOnlyDictionary<Category, int> GetAllScores(IReadOnlyList<int> dice) =>
        Enum.GetValues<Category>().ToDictionary(category => category, category => Calculate(category, dice));

    internal static Dictionary<int, int> GetCounts(IReadOnlyList<int> dice) =>
        dice.GroupBy(value => value).ToDictionary(group => group.Key, group => group.Count());

    private static int UpperSection(IReadOnlyList<int> dice, int face) =>
        dice.Count(value => value == face) * face;

    private static int CheckNOfAKind(IReadOnlyList<int> dice, int count) =>
        GetCounts(dice).Values.Any(value => value >= count) ? dice.Sum() : 0;

    private static int CheckSmallStraight(IReadOnlyList<int> dice)
    {
        var unique = dice.ToHashSet();
        return new[]
        {
            new HashSet<int> { 1, 2, 3, 4 },
            new HashSet<int> { 2, 3, 4, 5 },
            new HashSet<int> { 3, 4, 5, 6 },
        }.Any(straight => straight.IsSubsetOf(unique)) ? 30 : 0;
    }

    private static int CheckBigStraight(IReadOnlyList<int> dice)
    {
        var sorted = dice.Order().ToArray();
        return sorted.SequenceEqual([1, 2, 3, 4, 5]) ||
               sorted.SequenceEqual([2, 3, 4, 5, 6])
            ? 40
            : 0;
    }

    private static void ValidateDice(IReadOnlyList<int> dice)
    {
        ArgumentNullException.ThrowIfNull(dice);
        if (dice.Count != DiceSet.Count || dice.Any(value => value is < 1 or > 6))
            throw new ArgumentException("Ожидалось ровно пять кубиков со значениями от 1 до 6.", nameof(dice));
    }
}

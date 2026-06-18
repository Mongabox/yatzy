using Yatzy.Models;
using Yatzy.Models.Enums;

namespace Yatzy.AI;

public sealed class HeuristicBotStrategy : IBotStrategy
{
    private const double RandomRerollChance = 0.15;
    private const double RandomChoiceChance = 0.12;
    private readonly Random _random;

    public HeuristicBotStrategy(Random? random = null)
    {
        _random = random ?? Random.Shared;
    }

    public IReadOnlySet<int> ChooseDiceToReroll(ScoreCard card, IReadOnlyList<int> dice)
    {
        ArgumentNullException.ThrowIfNull(card);
        _ = CombinationChecker.Calculate(Category.Chance, dice);
        var counts = CombinationChecker.GetCounts(dice);

        if (_random.NextDouble() < RandomRerollChance)
            return GetRandomIndices(dice.Count, _random.Next(1, 3));

        if (card.UpperSectionSum < ScoreCard.BonusThreshold)
        {
            int bestUpper = Enumerable.Range(1, 6)
                .OrderByDescending(value => (counts.GetValueOrDefault(value, 0) * value, value))
                .First();

            if (counts.GetValueOrDefault(bestUpper, 0) >= 2)
                return IndicesWhere(dice, value => value != bestUpper);
        }

        var best = counts.OrderByDescending(pair => pair.Value).First();
        if (best.Value >= 2)
            return IndicesWhere(dice, value => value != best.Key);

        foreach (var straight in CandidateStraights)
        {
            if (dice.Distinct().Intersect(straight).Count() >= 3)
                return IndicesWhere(dice, value => !straight.Contains(value));
        }

        return IndicesWhere(dice, value => value < 5);
    }

    public Category ChooseCategory(ScoreCard card, IReadOnlyList<int> dice)
    {
        ArgumentNullException.ThrowIfNull(card);
        var scores = CombinationChecker.GetAllScores(dice);
        var available = card.AvailableCategories;

        if (available.Count == 0)
            throw new InvalidOperationException("Нет доступных категорий.");

        var sorted = available
            .Select(category => (category, weight: CalculateWeight(category, scores[category], card)))
            .OrderByDescending(item => item.weight)
            .ToList();

        return sorted.Count >= 2 && _random.NextDouble() < RandomChoiceChance
            ? sorted[1].category
            : sorted[0].category;
    }

    private static readonly IReadOnlyList<HashSet<int>> CandidateStraights =
    [
        [1, 2, 3, 4],
        [2, 3, 4, 5],
        [3, 4, 5, 6],
    ];

    private static double CalculateWeight(Category category, int score, ScoreCard card)
    {
        double weight = score;
        if ((int)category <= 6 && card.UpperSectionSum < ScoreCard.BonusThreshold)
            weight += score * 0.8;
        if (category == Category.Yahtzee && score > 0) weight += 40;
        if (category == Category.BigStraight && score > 0) weight += 20;
        if (category == Category.FullHouse && score > 0) weight += 15;
        return weight;
    }

    private static HashSet<int> IndicesWhere(IReadOnlyList<int> dice, Func<int, bool> predicate) =>
        dice.Select((value, index) => (value, index))
            .Where(item => predicate(item.value))
            .Select(item => item.index)
            .ToHashSet();

    private HashSet<int> GetRandomIndices(int count, int amount)
    {
        var remaining = Enumerable.Range(0, count).ToList();
        var selected = new HashSet<int>();

        while (selected.Count < amount && remaining.Count > 0)
        {
            int position = _random.Next(remaining.Count);
            selected.Add(remaining[position]);
            remaining.RemoveAt(position);
        }

        return selected;
    }
}

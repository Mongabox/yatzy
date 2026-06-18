using System.Collections.ObjectModel;
using Yatzy.Models.Enums;

namespace Yatzy.Models;

public sealed class ScoreCard
{
    public const int BonusThreshold = 63;
    public const int BonusValue = 35;
    private readonly Dictionary<Category, int?> _scores =
        Enum.GetValues<Category>().ToDictionary(category => category, _ => (int?)null);

    public bool IsUsed(Category category) => _scores[category].HasValue;

    public IReadOnlyList<Category> AvailableCategories =>
        _scores.Where(pair => !pair.Value.HasValue)
            .OrderBy(pair => pair.Key)
            .Select(pair => pair.Key)
            .ToArray();

    public int? GetScore(Category category) => _scores[category];

    public int UpperSectionSum =>
        Enumerable.Range(1, 6).Sum(value => _scores[(Category)value] ?? 0);

    public int TotalScore =>
        _scores.Values.Sum(value => value ?? 0) +
        (UpperSectionSum >= BonusThreshold ? BonusValue : 0);

    public int RemainingCategories => _scores.Count(pair => !pair.Value.HasValue);

    public int Record(Category category, IReadOnlyList<int> dice)
    {
        if (IsUsed(category))
            throw new InvalidOperationException($"Категория {category} уже использована.");

        int score = CombinationChecker.Calculate(category, dice);
        _scores[category] = score;
        return score;
    }

    public IReadOnlyDictionary<Category, int?> AllScores =>
        new ReadOnlyDictionary<Category, int?>(_scores);
}

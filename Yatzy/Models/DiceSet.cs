namespace Yatzy.Models;

public sealed class DiceSet
{
    public const int Count = 5;
    private readonly Dice[] _dice;

    public DiceSet(IDiceRandom random)
    {
        ArgumentNullException.ThrowIfNull(random);
        _dice = Enumerable.Range(0, Count).Select(_ => new Dice(random)).ToArray();
    }

    public Dice this[int index] => _dice[index];
    public int Length => Count;
    public int[] Values => _dice.Select(die => die.Value).ToArray();

    public void RollAll()
    {
        foreach (var die in _dice)
            die.Roll();
    }

    public void Reroll(IEnumerable<int> zeroBasedIndices)
    {
        ArgumentNullException.ThrowIfNull(zeroBasedIndices);

        foreach (int index in zeroBasedIndices.Distinct())
        {
            ArgumentOutOfRangeException.ThrowIfNegative(index);
            ArgumentOutOfRangeException.ThrowIfGreaterThanOrEqual(index, Count);
            _dice[index].Roll();
        }
    }

    public void Reset()
    {
        foreach (var die in _dice)
            die.Reset();
    }
}

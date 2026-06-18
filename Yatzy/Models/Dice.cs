namespace Yatzy.Models;

public sealed class Dice
{
    private readonly IDiceRandom _random;

    public Dice(IDiceRandom random)
    {
        _random = random ?? throw new ArgumentNullException(nameof(random));
    }

    public int Value { get; private set; }

    public void Roll() => Value = _random.NextValue();

    internal void Reset() => Value = 0;

    internal void SetValue(int value)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(value, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(value, 6);
        Value = value;
    }

    public override string ToString() => Value.ToString();
}

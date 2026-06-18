namespace Yatzy.Models;

public interface IDiceRandom
{
    int NextValue();
}

public sealed class SystemDiceRandom : IDiceRandom
{
    public int NextValue() => Random.Shared.Next(1, 7);
}

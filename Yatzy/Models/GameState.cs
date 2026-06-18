namespace Yatzy.Models;

public sealed class GameState
{
    public const int TotalRounds = 13;
    public const int MaxThrows = 3;

    public GameState(IDiceRandom random)
    {
        PlayerCard = new ScoreCard();
        BotCard = new ScoreCard();
        Dice = new DiceSet(random);
        CurrentRound = 1;
        ThrowsLeft = MaxThrows;
    }

    public ScoreCard PlayerCard { get; }
    public ScoreCard BotCard { get; }
    public int CurrentRound { get; private set; }
    public int ThrowsLeft { get; private set; }
    public DiceSet Dice { get; }
    public bool IsGameRunning => CurrentRound <= TotalRounds;

    public void StartRound()
    {
        if (!IsGameRunning)
            throw new InvalidOperationException("Игра уже завершена.");

        ThrowsLeft = MaxThrows;
        Dice.Reset();
    }

    public void RegisterThrow()
    {
        if (ThrowsLeft <= 0)
            throw new InvalidOperationException("Броски закончились.");
        ThrowsLeft--;
    }

    public void AdvanceRound()
    {
        if (!IsGameRunning)
            throw new InvalidOperationException("Игра уже завершена.");
        CurrentRound++;
    }
}

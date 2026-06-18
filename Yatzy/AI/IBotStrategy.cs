using Yatzy.Models;
using Yatzy.Models.Enums;

namespace Yatzy.AI;

public interface IBotStrategy
{
    IReadOnlySet<int> ChooseDiceToReroll(ScoreCard card, IReadOnlyList<int> dice);
    Category ChooseCategory(ScoreCard card, IReadOnlyList<int> dice);
}

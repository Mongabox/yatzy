using System.Collections.Concurrent;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Nodes;
using Microsoft.Web.WebView2.Core;
using Yatzy.Models;
using Yatzy.Models.Enums;
using Yatzy.Presentation;

namespace Yatzy.Views;

public sealed class WebView2View : IGameView, IDisposable
{
    private static readonly TimeSpan ResponseTimeout = TimeSpan.FromMinutes(5);
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    private readonly string _uiUrl;
    private readonly Action<Action> _dispatch;
    private readonly ConcurrentDictionary<Guid, PendingRequest> _pending = new();
    private readonly CancellationTokenSource _disposeCancellation = new();
    private readonly TaskCompletionSource _ready = new(
        TaskCreationOptions.RunContinuationsAsynchronously);
    private CoreWebView2? _webView;

    public WebView2View(Action<Action> dispatch, string? uiUrl = null)
    {
        _dispatch = dispatch ?? throw new ArgumentNullException(nameof(dispatch));
        _uiUrl = uiUrl ?? "https://app.yatzy/index.html";
    }

    public void AttachWebView(CoreWebView2 webView)
    {
        if (_webView is not null)
            throw new InvalidOperationException("WebView уже подключён.");

        _webView = webView ?? throw new ArgumentNullException(nameof(webView));
        _webView.WebMessageReceived += OnWebMessageReceived;
        _webView.Navigate(_uiUrl);
    }

    public Task<MainMenuAction> RequestMainMenuActionAsync(CancellationToken cancellationToken) =>
        RequestAsync<MainMenuAction>("REQUEST_MENU", "MENU_ACTION", null, cancellationToken);

    public async Task<IReadOnlySet<int>> RequestDiceToRerollAsync(
        BoardViewModel board,
        CancellationToken cancellationToken)
    {
        var oneBasedIndices = await RequestAsync<int[]>(
            "REQUEST_REROLL",
            "REROLL_CHOICE",
            board,
            cancellationToken);

        var zeroBasedIndices = oneBasedIndices
            .Distinct()
            .Select(index => index - 1)
            .ToHashSet();

        if (zeroBasedIndices.Any(index => index is < 0 or >= DiceSet.Count))
            throw new InvalidDataException("UI вернул недопустимый индекс кубика.");

        return zeroBasedIndices;
    }

    public async Task<Category> RequestCategoryChoiceAsync(
        BoardViewModel board,
        IReadOnlyList<Category> availableCategories,
        CancellationToken cancellationToken)
    {
        string selected = await RequestAsync<string>(
            "REQUEST_CATEGORY",
            "CATEGORY_CHOICE",
            new
            {
                board,
                available = availableCategories.Select(category => category.ToString()).ToArray(),
            },
            cancellationToken);

        if (!Enum.TryParse<Category>(selected, out var category) ||
            !availableCategories.Contains(category))
        {
            throw new InvalidDataException("UI вернул недоступную категорию.");
        }

        return category;
    }

    public Task ContinueAfterPlayerTurnAsync(
        BoardViewModel board,
        TurnResultViewModel result,
        CancellationToken cancellationToken) =>
        RequestAsync<JsonNode?>(
            "REQUEST_PLAYER_CONTINUE",
            "INPUT_CONFIRMED",
            new { board, result },
            cancellationToken);

    public Task ContinueAfterBotTurnAsync(
        BoardViewModel board,
        TurnResultViewModel result,
        CancellationToken cancellationToken) =>
        RequestAsync<JsonNode?>(
            "REQUEST_BOT_CONTINUE",
            "INPUT_CONFIRMED",
            new { board, result },
            cancellationToken);

    public Task<FinalAction> RequestFinalActionAsync(
        FinalViewModel final,
        CancellationToken cancellationToken) =>
        RequestAsync<FinalAction>("REQUEST_FINAL", "FINAL_ACTION", final, cancellationToken);

    private async Task<T> RequestAsync<T>(
        string requestType,
        string responseType,
        object? data,
        CancellationToken cancellationToken)
    {
        if (_webView is null)
            throw new InvalidOperationException("WebView ещё не подключён.");

        await WaitUntilReadyAsync(cancellationToken).ConfigureAwait(false);

        var requestId = Guid.NewGuid();
        var completion = new TaskCompletionSource<JsonNode?>(
            TaskCreationOptions.RunContinuationsAsynchronously);
        var pending = new PendingRequest(responseType, completion);

        if (!_pending.TryAdd(requestId, pending))
            throw new InvalidOperationException("Не удалось зарегистрировать UI-запрос.");

        using var timeout = new CancellationTokenSource(ResponseTimeout);
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeout.Token,
            _disposeCancellation.Token);
        using var registration = linked.Token.Register(() =>
        {
            if (_pending.TryRemove(requestId, out var removed))
                removed.Completion.TrySetCanceled(linked.Token);
        });

        Post(new { type = requestType, requestId, data });

        JsonNode? responseData;
        try
        {
            responseData = await completion.Task.ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (timeout.IsCancellationRequested)
        {
            throw new TimeoutException($"UI не ответил на запрос {requestType} за {ResponseTimeout}.");
        }

        if (typeof(T) == typeof(JsonNode))
            return (T)(object?)responseData!;
        if (responseData is null)
            return default!;

        return responseData.Deserialize<T>(JsonOptions)
            ?? throw new InvalidDataException($"Ответ {responseType} не удалось десериализовать.");
    }

    private void Post(object payload)
    {
        string json = JsonSerializer.Serialize(payload, JsonOptions);
        _dispatch(() =>
        {
            if (_webView is null)
                throw new ObjectDisposedException(nameof(WebView2View));
            _webView.PostWebMessageAsJson(json);
        });
    }

    private void OnWebMessageReceived(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            var message = ParseMessage(e.WebMessageAsJson);
            string? type = message?["type"]?.GetValue<string>();

            if (type == "UI_READY")
            {
                _ready.TrySetResult();
                return;
            }

            if (type is "WINDOW_MINIMIZE" or "WINDOW_MAXIMIZE" or "WINDOW_CLOSE")
                return;

            if (!Guid.TryParse(message?["requestId"]?.GetValue<string>(), out var requestId))
                return;

            if (!_pending.TryGetValue(requestId, out var pending) ||
                !string.Equals(type, pending.ResponseType, StringComparison.Ordinal))
                return;

            if (_pending.TryRemove(requestId, out pending))
                pending.Completion.TrySetResult(message?["data"]?.DeepClone());
        }
        catch (Exception exception)
        {
            System.Diagnostics.Debug.WriteLine($"[WebView2View] Invalid UI message: {exception}");
        }
    }

    private async Task WaitUntilReadyAsync(CancellationToken cancellationToken)
    {
        using var timeout = new CancellationTokenSource(ResponseTimeout);
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeout.Token,
            _disposeCancellation.Token);

        try
        {
            await _ready.Task.WaitAsync(linked.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (timeout.IsCancellationRequested)
        {
            throw new TimeoutException($"UI не сообщил о готовности за {ResponseTimeout}.");
        }
    }

    private static JsonNode? ParseMessage(string raw)
    {
        var parsed = JsonNode.Parse(raw);
        if (parsed is JsonValue value && value.TryGetValue<string>(out var nested))
            parsed = JsonNode.Parse(nested);
        return parsed;
    }

    public void Dispose()
    {
        _disposeCancellation.Cancel();
        if (_webView is not null)
            _webView.WebMessageReceived -= OnWebMessageReceived;

        foreach (var request in _pending.Values)
            request.Completion.TrySetCanceled();
        _pending.Clear();
        _ready.TrySetCanceled();
        _disposeCancellation.Dispose();
        _webView = null;
    }

    private sealed record PendingRequest(
        string ResponseType,
        TaskCompletionSource<JsonNode?> Completion);
}

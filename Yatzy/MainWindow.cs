using System.IO;
using System.Text.Json.Nodes;
using System.Windows;
using Microsoft.Web.WebView2.Core;
using Yatzy.AI;
using Yatzy.Controllers;
using Yatzy.Models;
using Yatzy.Views;

namespace Yatzy;

public partial class MainWindow : Window
{
    private readonly CancellationTokenSource _lifetime = new();
    private WebView2View? _view;

    public MainWindow()
    {
        InitializeComponent();
        Background = new System.Windows.Media.SolidColorBrush(
            System.Windows.Media.Color.FromRgb(0xFB, 0xFB, 0xFA));
        _wv.DefaultBackgroundColor = System.Drawing.Color.FromArgb(255, 251, 251, 250);
        _wv.CoreWebView2InitializationCompleted += OnWebViewReady;
        Loaded += (_, _) => _ = InitializeWebView2Async();
    }

    private async Task InitializeWebView2Async()
    {
        var dataFolder = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Yatzy",
            "WebView2Profile");

        try
        {
            var options = new CoreWebView2EnvironmentOptions();
            bool disableSandbox = Environment.GetCommandLineArgs().Any(argument =>
                string.Equals(argument, "--no-sandbox", StringComparison.OrdinalIgnoreCase));

            if (disableSandbox || IsNetworkPath(AppContext.BaseDirectory))
            {
                options.AdditionalBrowserArguments = "--no-sandbox";
                Environment.SetEnvironmentVariable(
                    "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
                    "--no-sandbox");
            }

            var environment = await CoreWebView2Environment.CreateAsync(null, dataFolder, options);
            await _wv.EnsureCoreWebView2Async(environment);
        }
        catch (Exception exception)
        {
            ShowFatalError("Ошибка инициализации WebView2", exception);
        }
    }

    private void OnWebViewReady(
        object? sender,
        CoreWebView2InitializationCompletedEventArgs eventArgs)
    {
        if (!eventArgs.IsSuccess)
        {
            ShowFatalError(
                "Ошибка инициализации WebView2",
                eventArgs.InitializationException ?? new InvalidOperationException());
            return;
        }

        ConfigureWebView();
        _wv.CoreWebView2.WebMessageReceived += OnWindowControlMessageReceived;

        _view = new WebView2View(
            action => Dispatcher.Invoke(action),
            "https://app.yatzy/index.html");
        _view.AttachWebView(_wv.CoreWebView2);
        _ = RunGameAsync(_view);
    }

    private void ConfigureWebView()
    {
        _wv.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
        _wv.CoreWebView2.Settings.AreDevToolsEnabled =
#if DEBUG
            true;
#else
            false;
#endif
        _wv.CoreWebView2.Settings.IsStatusBarEnabled = false;
        _wv.CoreWebView2.Settings.IsZoomControlEnabled = false;

        var wwwroot = Path.Combine(AppContext.BaseDirectory, "wwwroot");
        if (!Directory.Exists(wwwroot))
            throw new DirectoryNotFoundException($"Не найдена папка UI: {wwwroot}");

        _wv.CoreWebView2.SetVirtualHostNameToFolderMapping(
            "app.yatzy",
            wwwroot,
            CoreWebView2HostResourceAccessKind.DenyCors);

        _wv.CoreWebView2.NavigationCompleted += (_, args) =>
        {
            if (!args.IsSuccess)
                ShowFatalError(
                    "Не удалось загрузить интерфейс",
                    new InvalidOperationException($"{args.WebErrorStatus}, HTTP {args.HttpStatusCode}"));
        };
    }

    private async Task RunGameAsync(IGameView view)
    {
        try
        {
            var random = new SystemDiceRandom();
            var controller = new GameController(
                view,
                new HeuristicBotStrategy(),
                () => new GameState(random));
            await controller.RunAsync(_lifetime.Token);
        }
        catch (OperationCanceledException) when (_lifetime.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            ShowFatalError("Критическая ошибка игрового цикла", exception);
        }
        finally
        {
            if (!_lifetime.IsCancellationRequested)
                Close();
        }
    }

    private void OnWindowControlMessageReceived(
        object? sender,
        CoreWebView2WebMessageReceivedEventArgs eventArgs)
    {
        try
        {
            var message = ParseMessage(eventArgs.WebMessageAsJson);
            switch (message?["type"]?.GetValue<string>())
            {
                case "WINDOW_MINIMIZE":
                    WindowState = WindowState.Minimized;
                    break;
                case "WINDOW_MAXIMIZE":
                    WindowState = WindowState == WindowState.Maximized
                        ? WindowState.Normal
                        : WindowState.Maximized;
                    break;
                case "WINDOW_CLOSE":
                    Close();
                    break;
            }
        }
        catch (Exception exception)
        {
            System.Diagnostics.Debug.WriteLine($"[MainWindow] Invalid window message: {exception}");
        }
    }

    private static JsonNode? ParseMessage(string raw)
    {
        var parsed = JsonNode.Parse(raw);
        if (parsed is JsonValue value && value.TryGetValue<string>(out var nested))
            parsed = JsonNode.Parse(nested);
        return parsed;
    }

    private static bool IsNetworkPath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return false;
        if (path.StartsWith(@"\\") || path.StartsWith("//"))
            return true;

        try
        {
            string? root = Path.GetPathRoot(path);
            return !string.IsNullOrEmpty(root) &&
                   new DriveInfo(root).DriveType == DriveType.Network;
        }
        catch
        {
            return false;
        }
    }

    private void ShowFatalError(string title, Exception exception)
    {
        MessageBox.Show(
            $"{title}:\n{exception.Message}",
            "Яцы — ошибка",
            MessageBoxButton.OK,
            MessageBoxImage.Error);
        Close();
    }

    protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
    {
        _lifetime.Cancel();
        _view?.Dispose();
        _view = null;
        base.OnClosing(e);
    }

    protected override void OnClosed(EventArgs e)
    {
        _lifetime.Dispose();
        base.OnClosed(e);
    }
}

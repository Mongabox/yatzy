using System;
using System.Windows;
using Yatzy;

internal static class Program
{
    [STAThread]
    static void Main()
    {
        var app = new Application();
        app.Run(new MainWindow());
    }
}

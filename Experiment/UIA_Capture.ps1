# Capture a screenshot of a top-level window found by UIA runtime id.
# Usage:
#   powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File .\Experiment\UIA_Capture.ps1 -RuntimeId 42.399080

#requires -Version 5.1

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RuntimeId
)

Set-StrictMode -Version Latest
. $PSScriptRoot\UIA_Common.ps1

$outPath = Join-Path $PSScriptRoot "UIA_Capture.png"
Remove-Item -LiteralPath $outPath -Force -ErrorAction SilentlyContinue

Add-Type -AssemblyName System.Drawing | Out-Null

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class UiaCaptureNative {
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdcBlt, uint nFlags);
}
"@ -ErrorAction Stop | Out-Null

function Save-WindowScreenshot {
    param(
        [Parameter(Mandatory = $true)][System.Windows.Automation.AutomationElement]$Element,
        [Parameter(Mandatory = $true)][string]$Path
    )

    $hwndValue = 0
    try { $hwndValue = $Element.Current.NativeWindowHandle } catch { }
    $hwnd = [IntPtr]$hwndValue

    $saved = $false

    if ($hwndValue -ne 0) {
        $rect = New-Object UiaCaptureNative+RECT
        if ([UiaCaptureNative]::GetWindowRect($hwnd, [ref]$rect)) {
            $width = [Math]::Max(0, $rect.Right - $rect.Left)
            $height = [Math]::Max(0, $rect.Bottom - $rect.Top)
            if ($width -gt 0 -and $height -gt 0) {
                $bmp = New-Object System.Drawing.Bitmap $width, $height
                $gfx = [System.Drawing.Graphics]::FromImage($bmp)
                try {
                    $hdc = $gfx.GetHdc()
                    try {
                        $ok = [UiaCaptureNative]::PrintWindow($hwnd, $hdc, 0)
                        if (-not $ok) {
                            $ok = [UiaCaptureNative]::PrintWindow($hwnd, $hdc, 2)
                        }
                    } finally {
                        $gfx.ReleaseHdc($hdc)
                    }

                    if ($ok) {
                        $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
                        $saved = $true
                    }
                } finally {
                    $gfx.Dispose()
                    $bmp.Dispose()
                }
            }
        }
    }

    if (-not $saved) {
        $rect = $null
        try { $rect = $Element.Current.BoundingRectangle } catch { }
        if ($null -eq $rect) { return $false }

        $x = [int][Math]::Round($rect.X)
        $y = [int][Math]::Round($rect.Y)
        $w = [int][Math]::Round($rect.Width)
        $h = [int][Math]::Round($rect.Height)
        if ($w -le 0 -or $h -le 0) { return $false }

        $bmp = New-Object System.Drawing.Bitmap $w, $h
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        try {
            $gfx.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
            $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
            return $true
        } finally {
            $gfx.Dispose()
            $bmp.Dispose()
        }
    }

    return $true
}

$target = (EnumerateWindows -RuntimeId $RuntimeId -SkipNameless:$false -NoSort:$true | Select-Object -First 1)
if ($null -eq $target) {
    exit 1
}

if (Save-WindowScreenshot -Element $target.Element -Path $outPath) {
    [System.IO.Path]::GetFullPath($outPath)
} else {
    exit 1
}

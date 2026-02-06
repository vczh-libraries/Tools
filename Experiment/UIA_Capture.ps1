# UIA_Capture.ps1
#
# Captures a screenshot of a visible top-level window found by UIA RuntimeId.
# The output file is always `UIA_Capture.png` next to this script.
#
# Notes:
# - Some UIA providers behave better in an STA host. Recommended:
#     powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File .\Experiment\UIA_Capture.ps1 -RuntimeId 42.399080
# - The script deletes `UIA_Capture.png` at startup.
#
# Parameters / switches:
# - `-RuntimeId <id>`: Required. UIA RuntimeId of a visible top-level window (from `UIA_List.ps1`).
# - `-Overlay`: Draws a green rectangle for each UIA node over the captured image and prints that node's RuntimeId
#   (8pt text) at the rectangle's top-left corner. Uses `UIA_List.ps1 -RawTree` to obtain bounds.
# - `-Base64`: Outputs the PNG content as a Base64 string instead of writing `UIA_Capture.png`.

# Key knowledge (maintenance notes):
# - UIA element bounds are in screen coordinates (`BoundingRectangle`), not relative to the window image.
#   Overlay converts bounds to image coordinates by subtracting the window's `BoundingRectangle.X/Y` (origin).
# - Capturing:
#   - Prefer `PrintWindow` when a valid `NativeWindowHandle` exists (captures even when occluded in some cases).
#   - Fallback to `CopyFromScreen` when `PrintWindow` fails (requires the window to be visible on screen).
# - If `-Base64` is enabled, everything stays in-memory (no PNG file is created at the end),
#   but the script still deletes `UIA_Capture.png` at startup for consistent behavior.

#requires -Version 5.1

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$RuntimeId,

    [switch]$Overlay,
    [switch]$Base64
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

function Get-WindowBitmap {
    param(
        [Parameter(Mandatory = $true)][System.Windows.Automation.AutomationElement]$Element
    )

    $hwndValue = 0
    try { $hwndValue = $Element.Current.NativeWindowHandle } catch { }
    $hwnd = [IntPtr]$hwndValue

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
                        $result = $bmp
                        $bmp = $null
                        return $result
                    }
                } finally {
                    $gfx.Dispose()
                    if ($null -ne $bmp) { $bmp.Dispose() }
                }
            }
        }
    }

    $rect = $null
    try { $rect = $Element.Current.BoundingRectangle } catch { }
    if ($null -eq $rect) { return $null }

    $x = [int][Math]::Round($rect.X)
    $y = [int][Math]::Round($rect.Y)
    $w = [int][Math]::Round($rect.Width)
    $h = [int][Math]::Round($rect.Height)
    if ($w -le 0 -or $h -le 0) { return $null }

    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $gfx.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
        return $bmp
    } finally {
        $gfx.Dispose()
    }
}

$uiListScript = Join-Path $PSScriptRoot "UIA_List.ps1"

$tree = $null
if ($Overlay) {
    $tree = & $uiListScript -RuntimeId $RuntimeId -RawTree -View Control -MaxDepth 500 -MaxChildren 0
    if ($null -eq $tree) { exit 1 }
}

$target = (EnumerateWindows -RuntimeId $RuntimeId -SkipNameless:$false -NoSort:$true | Select-Object -First 1)
if ($null -eq $target) {
    exit 1
}

try {
    $bitmap = Get-WindowBitmap -Element $target.Element
    if ($null -eq $bitmap) { exit 1 }

    if ($Overlay) {
        $windowRect = $null
        try { $windowRect = $target.Element.Current.BoundingRectangle } catch { }
        if ($null -eq $windowRect) { exit 1 }

        $originX = [double]$windowRect.X
        $originY = [double]$windowRect.Y

        function Draw-OverlayNode {
            param(
                [Parameter(Mandatory = $true)]$Node,
                [Parameter(Mandatory = $true)][System.Drawing.Graphics]$Graphics,
                [Parameter(Mandatory = $true)][System.Drawing.Pen]$Pen,
                [Parameter(Mandatory = $true)][System.Drawing.Font]$Font,
                [Parameter(Mandatory = $true)][System.Drawing.Brush]$TextBrush,
                [Parameter(Mandatory = $true)][System.Drawing.Brush]$ShadowBrush
            )

            try {
                if ($null -ne $Node.Bounds) {
                    $x = [double]$Node.Bounds.X - $originX
                    $y = [double]$Node.Bounds.Y - $originY
                    $w = [double]$Node.Bounds.Width
                    $h = [double]$Node.Bounds.Height

                    if ($w -gt 0 -and $h -gt 0) {
                        $Graphics.DrawRectangle($Pen, [float]$x, [float]$y, [float]$w, [float]$h)

                        $rid = [string]$Node.RuntimeId
                        if (-not [string]::IsNullOrWhiteSpace($rid)) {
                            $Graphics.DrawString($rid, $Font, $ShadowBrush, [float]($x + 1), [float]($y + 1))
                            $Graphics.DrawString($rid, $Font, $TextBrush, [float]$x, [float]$y)
                        }
                    }
                }
            } catch {
            }

            if ($null -ne $Node.Children) {
                foreach ($child in $Node.Children) {
                    Draw-OverlayNode -Node $child -Graphics $Graphics -Pen $Pen -Font $Font -TextBrush $TextBrush -ShadowBrush $ShadowBrush
                }
            }
        }

        $gfx = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::None
            $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Lime), 1
            $font = New-Object System.Drawing.Font "Segoe UI", 8
            $textBrush = [System.Drawing.Brushes]::Lime
            $shadowBrush = [System.Drawing.Brushes]::Black
            try {
                Draw-OverlayNode -Node $tree -Graphics $gfx -Pen $pen -Font $font -TextBrush $textBrush -ShadowBrush $shadowBrush
            } finally {
                $pen.Dispose()
                $font.Dispose()
            }
        } finally {
            $gfx.Dispose()
        }
    }

    if ($Base64) {
        $ms = New-Object System.IO.MemoryStream
        try {
            $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            [Convert]::ToBase64String($ms.ToArray())
        } finally {
            $ms.Dispose()
        }
    } else {
        $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        [System.IO.Path]::GetFullPath($outPath)
    }
} finally {
    if ($null -ne $bitmap) { $bitmap.Dispose() }
}

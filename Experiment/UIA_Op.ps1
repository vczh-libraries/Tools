# UIA_Op.ps1
#
# Performs simple mouse/keyboard operations (input simulation) for UI Automation experiments.
# The script takes a single operation string and executes it immediately.
#
# Notes:
# - Input simulation is inherently timing-sensitive. Run this from an STA host for best results:
#     powershell.exe -NoProfile -STA -ExecutionPolicy Bypass -File .\Experiment\UIA_Op.ps1 "Type:hello"
# - Coordinates are in screen space pixels (same as Windows cursor position).
#
# Supported operations:
# - `"Move:x:y"`: Move the mouse cursor to screen coordinate (x, y).
# - `"Left:x:y"` / `"Right:x:y"`: Move the mouse to (x, y) and click left/right button.
# - `"Drag:x1:y1:x2:y2"`: Move to (x1, y1), press left button, move to (x2, y2), release left button.
# - `"Type:xxxxxxxx"`: Types the specified text (Unicode) to the currently focused control.
#   Everything after the first `:` is treated as text (so `:` is allowed inside the text).
# - `"Press:Key1:Key2:..."`: Press keys down in order, then release in reverse order.
#   Example: `"Press:Ctrl:C"` performs Ctrl+C.
# - `"ListKey"`: Lists all key names accepted by `Press` (based on `System.Windows.Forms.Keys` plus aliases).
#
# Key names:
# - Uses `System.Windows.Forms.Keys` enum names (case-insensitive), e.g. `A`, `F5`, `Escape`, `Return`.
# - Common aliases are also accepted: `Ctrl`, `Control`, `Alt`, `Shift`, `Win`, `Enter`, `Esc`, `Del`, `PgUp`, `PgDn`,
#   arrow keys (`Left`, `Right`, `Up`, `Down`), etc.

#requires -Version 5.1

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Op,

    [int]$DelayMs = 20
)

Set-StrictMode -Version Latest

Add-Type -AssemblyName System.Windows.Forms | Out-Null

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class UiaOpNative {
    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT {
        public int type;
        public InputUnion U;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct InputUnion {
        [FieldOffset(0)]
        public MOUSEINPUT mi;
        [FieldOffset(0)]
        public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct MOUSEINPUT {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    public const int INPUT_MOUSE = 0;
    public const int INPUT_KEYBOARD = 1;

    public const uint MOUSEEVENTF_MOVE = 0x0001;
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;

    public const uint KEYEVENTF_KEYUP = 0x0002;
    public const uint KEYEVENTF_UNICODE = 0x0004;

    [DllImport("user32.dll", SetLastError=true)]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll", SetLastError=true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);
}
"@ -ErrorAction Stop | Out-Null

function Invoke-Sleep {
    param([int]$Ms)
    if ($Ms -gt 0) { Start-Sleep -Milliseconds $Ms }
}

function Set-MousePos {
    param([Parameter(Mandatory = $true)][int]$X, [Parameter(Mandatory = $true)][int]$Y)
    [void][UiaOpNative]::SetCursorPos($X, $Y)
}

function Send-MouseEvent {
    param([Parameter(Mandatory = $true)][uint32]$Flags)

    $input = New-Object UiaOpNative+INPUT
    $input.type = [UiaOpNative]::INPUT_MOUSE
    $input.U.mi = New-Object UiaOpNative+MOUSEINPUT
    $input.U.mi.dwFlags = $Flags
    [void][UiaOpNative]::SendInput(1, @($input), [Runtime.InteropServices.Marshal]::SizeOf([type]([UiaOpNative+INPUT])))
}

function Send-KeyVk {
    param(
        [Parameter(Mandatory = $true)][uint16]$Vk,
        [Parameter(Mandatory = $true)][bool]$Down
    )

    $input = New-Object UiaOpNative+INPUT
    $input.type = [UiaOpNative]::INPUT_KEYBOARD
    $input.U.ki = New-Object UiaOpNative+KEYBDINPUT
    $input.U.ki.wVk = $Vk
    $input.U.ki.wScan = 0
    $input.U.ki.dwFlags = if ($Down) { 0 } else { [UiaOpNative]::KEYEVENTF_KEYUP }
    [void][UiaOpNative]::SendInput(1, @($input), [Runtime.InteropServices.Marshal]::SizeOf([type]([UiaOpNative+INPUT])))
}

function Send-TextUnicode {
    param([Parameter(Mandatory = $true)][string]$Text)

    foreach ($ch in $Text.ToCharArray()) {
        $scan = [uint16][int][char]$ch

        $down = New-Object UiaOpNative+INPUT
        $down.type = [UiaOpNative]::INPUT_KEYBOARD
        $down.U.ki = New-Object UiaOpNative+KEYBDINPUT
        $down.U.ki.wVk = 0
        $down.U.ki.wScan = $scan
        $down.U.ki.dwFlags = [UiaOpNative]::KEYEVENTF_UNICODE

        $up = New-Object UiaOpNative+INPUT
        $up.type = [UiaOpNative]::INPUT_KEYBOARD
        $up.U.ki = New-Object UiaOpNative+KEYBDINPUT
        $up.U.ki.wVk = 0
        $up.U.ki.wScan = $scan
        $up.U.ki.dwFlags = [UiaOpNative]::KEYEVENTF_UNICODE -bor [UiaOpNative]::KEYEVENTF_KEYUP

        [void][UiaOpNative]::SendInput(2, @($down, $up), [Runtime.InteropServices.Marshal]::SizeOf([type]([UiaOpNative+INPUT])))
        Invoke-Sleep -Ms $DelayMs
    }
}

function Get-KeyAliases {
    $m = @{}
    $m["CTRL"] = "ControlKey"
    $m["CONTROL"] = "ControlKey"
    $m["SHIFT"] = "ShiftKey"
    $m["ALT"] = "Menu"
    $m["WIN"] = "LWin"
    $m["WINDOWS"] = "LWin"
    $m["ENTER"] = "Return"
    $m["ESC"] = "Escape"
    $m["ESCAPE"] = "Escape"
    $m["DEL"] = "Delete"
    $m["DELETE"] = "Delete"
    $m["BKSP"] = "Back"
    $m["BACKSPACE"] = "Back"
    $m["PGUP"] = "Prior"
    $m["PAGEUP"] = "Prior"
    $m["PGDN"] = "Next"
    $m["PAGEDOWN"] = "Next"
    $m["SPACE"] = "Space"
    $m
}

function Resolve-KeyToVk {
    param([Parameter(Mandatory = $true)][string]$Name)

    $trimmed = $Name.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) { return $null }

    $upper = $trimmed.ToUpperInvariant()
    $aliases = Get-KeyAliases
    if ($aliases.ContainsKey($upper)) {
        $trimmed = $aliases[$upper]
    }

    try {
        $k = [System.Windows.Forms.Keys]([System.Enum]::Parse([System.Windows.Forms.Keys], $trimmed, $true))
        $vk = [uint16](([int]$k) -band 0xFF)
        if ($vk -eq 0) { return $null }
        return $vk
    } catch {
        return $null
    }
}

function Invoke-PressKeys {
    param([Parameter(Mandatory = $true)][string[]]$Keys)

    $vks = @()
    foreach ($k in $Keys) {
        $vk = Resolve-KeyToVk -Name $k
        if ($null -eq $vk) { throw "Unknown key '$k'. Use `"ListKey`" to see available names." }
        $vks += $vk
    }

    foreach ($vk in $vks) {
        Send-KeyVk -Vk $vk -Down $true
        Invoke-Sleep -Ms $DelayMs
    }

    for ($i = $vks.Count - 1; $i -ge 0; $i--) {
        Send-KeyVk -Vk $vks[$i] -Down $false
        Invoke-Sleep -Ms $DelayMs
    }
}

$parts = $Op.Split(':')
if ($parts.Count -le 0) { exit 1 }

$verb = $parts[0].Trim()
if ([string]::IsNullOrWhiteSpace($verb)) { exit 1 }

switch ($verb.ToUpperInvariant()) {
    "MOVE" {
        if ($parts.Count -ne 3) { throw "Expected Move:x:y" }
        Set-MousePos -X ([int]$parts[1]) -Y ([int]$parts[2])
    }
    "LEFT" {
        if ($parts.Count -ne 3) { throw "Expected Left:x:y" }
        Set-MousePos -X ([int]$parts[1]) -Y ([int]$parts[2])
        Invoke-Sleep -Ms $DelayMs
        Send-MouseEvent -Flags ([UiaOpNative]::MOUSEEVENTF_LEFTDOWN)
        Invoke-Sleep -Ms $DelayMs
        Send-MouseEvent -Flags ([UiaOpNative]::MOUSEEVENTF_LEFTUP)
    }
    "RIGHT" {
        if ($parts.Count -ne 3) { throw "Expected Right:x:y" }
        Set-MousePos -X ([int]$parts[1]) -Y ([int]$parts[2])
        Invoke-Sleep -Ms $DelayMs
        Send-MouseEvent -Flags ([UiaOpNative]::MOUSEEVENTF_RIGHTDOWN)
        Invoke-Sleep -Ms $DelayMs
        Send-MouseEvent -Flags ([UiaOpNative]::MOUSEEVENTF_RIGHTUP)
    }
    "DRAG" {
        if ($parts.Count -ne 5) { throw "Expected Drag:x1:y1:x2:y2" }
        $x1 = [int]$parts[1]
        $y1 = [int]$parts[2]
        $x2 = [int]$parts[3]
        $y2 = [int]$parts[4]
        Set-MousePos -X $x1 -Y $y1
        Invoke-Sleep -Ms $DelayMs
        Send-MouseEvent -Flags ([UiaOpNative]::MOUSEEVENTF_LEFTDOWN)
        Invoke-Sleep -Ms ([Math]::Max($DelayMs, 30))
        Set-MousePos -X $x2 -Y $y2
        Invoke-Sleep -Ms ([Math]::Max($DelayMs, 30))
        Send-MouseEvent -Flags ([UiaOpNative]::MOUSEEVENTF_LEFTUP)
    }
    "TYPE" {
        $text = ""
        if ($parts.Count -gt 1) {
            $text = $Op.Substring($Op.IndexOf(':') + 1)
        }
        Send-TextUnicode -Text $text
    }
    "PRESS" {
        if ($parts.Count -lt 2) { throw "Expected Press:Key1:Key2:..." }
        $keys = $parts | Select-Object -Skip 1
        Invoke-PressKeys -Keys $keys
    }
    "LISTKEY" {
        $aliases = Get-KeyAliases
        $aliasLines = foreach ($k in ($aliases.Keys | Sort-Object)) {
            "{0} -> {1}" -f $k, $aliases[$k]
        }

        $names = [System.Enum]::GetNames([System.Windows.Forms.Keys]) | Sort-Object
        $names
        ""
        "Aliases:"
        $aliasLines
    }
    default {
        throw "Unknown operation '$verb'."
    }
}

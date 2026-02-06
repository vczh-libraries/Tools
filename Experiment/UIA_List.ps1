# Lists all visible top-level windows (UI Automation) with their names and runtime IDs.
# Note: Some UIA providers behave better in an STA host. If you see COM/UIA errors, try:
#   powershell.exe -STA -File .\Experiment\UIA_List.ps1

#requires -Version 5.1

[CmdletBinding()]
param(
    [switch]$SkipNameless,
    [switch]$NoSort,
    [string]$RuntimeId = ""
)

Set-StrictMode -Version Latest

function Format-RuntimeId {
    param([int[]]$RuntimeId)
    if ($null -eq $RuntimeId -or $RuntimeId.Count -eq 0) { return "" }
    return ($RuntimeId -join ".")
}

function Trim-Text {
    param([string]$Text)
    if ([string]::IsNullOrEmpty($Text)) { return "" }
    if ($Text.Length -le 128) { return $Text }
    return ($Text.Substring(0, 128) + "...")
}

function Get-ElementTypeString {
    param([System.Windows.Automation.AutomationElement]$Element)

    try {
        $programmatic = $Element.Current.ControlType.ProgrammaticName
        if (-not [string]::IsNullOrWhiteSpace($programmatic)) {
            return ($programmatic -replace '^ControlType\.', '')
        }
    } catch {
    }

    try {
        $localized = $Element.Current.LocalizedControlType
        if (-not [string]::IsNullOrWhiteSpace($localized)) {
            return $localized
        }
    } catch {
    }

    return "Unknown"
}

function Get-ElementText {
    param([System.Windows.Automation.AutomationElement]$Element)

    try {
        $name = $Element.Current.Name
        if (-not [string]::IsNullOrWhiteSpace($name)) {
            return (Trim-Text -Text $name)
        }
    } catch {
    }

    try {
        $valuePattern = $Element.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        if ($null -ne $valuePattern) {
            $value = ([System.Windows.Automation.ValuePattern]$valuePattern).Current.Value
            if (-not [string]::IsNullOrWhiteSpace($value)) {
                return (Trim-Text -Text $value)
            }
        }
    } catch {
    }

    try {
        $legacyPattern = $Element.GetCurrentPattern([System.Windows.Automation.LegacyIAccessiblePattern]::Pattern)
        if ($null -ne $legacyPattern) {
            $legacyName = ([System.Windows.Automation.LegacyIAccessiblePattern]$legacyPattern).Current.Name
            if (-not [string]::IsNullOrWhiteSpace($legacyName)) {
                return (Trim-Text -Text $legacyName)
            }
        }
    } catch {
    }

    return ""
}

function EnumerateWindows {
    [CmdletBinding()]
    param(
        [string]$RuntimeId = "",
        [switch]$SkipNameless,
        [switch]$NoSort
    )

    $root = [System.Windows.Automation.AutomationElement]::RootElement
    if ($null -eq $root) {
        throw "AutomationElement.RootElement is null."
    }

    $condWindow = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Window
    )

    $condVisible = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::IsOffscreenProperty,
        $false
    )

    $cond = New-Object System.Windows.Automation.AndCondition($condWindow, $condVisible)
    $windows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $cond)

    $results = foreach ($window in $windows) {
        try {
            $name = $window.Current.Name
            if ([string]::IsNullOrWhiteSpace($name)) {
                if ($SkipNameless) { continue }
                $name = "<NoName>"
            }

            $rect = $window.Current.BoundingRectangle
            if ($rect.Width -le 0 -or $rect.Height -le 0) {
                continue
            }

            $rid = (Format-RuntimeId -RuntimeId ($window.GetRuntimeId()))
            if (-not [string]::IsNullOrEmpty($RuntimeId) -and $rid -ne $RuntimeId) {
                continue
            }

            [pscustomobject]@{
                Name      = $name
                RuntimeId = $rid
                Element   = $window
            }
        } catch {
        }
    }

    if (-not $NoSort) {
        $results = $results | Sort-Object -Property Name, RuntimeId
    }

    return @($results)
}

function Build-UiaTreeObject {
    param([System.Windows.Automation.AutomationElement]$Element)

    $children = @()
    try {
        $childElements = $Element.FindAll(
            [System.Windows.Automation.TreeScope]::Children,
            [System.Windows.Automation.Condition]::TrueCondition
        )
        foreach ($child in $childElements) {
            try {
                $children += (Build-UiaTreeObject -Element $child)
            } catch {
            }
        }
    } catch {
    }

    [pscustomobject]@{
        RuntimeId = (Format-RuntimeId -RuntimeId ($Element.GetRuntimeId()))
        Type      = (Get-ElementTypeString -Element $Element)
        Text      = (Get-ElementText -Element $Element)
        Children  = $children
    }
}

try {
    Add-Type -AssemblyName UIAutomationClient -ErrorAction Stop | Out-Null
    Add-Type -AssemblyName UIAutomationTypes -ErrorAction Stop | Out-Null
} catch {
    throw "Failed to load UI Automation assemblies (UIAutomationClient/UIAutomationTypes): $($_.Exception.Message)"
}

$windows = EnumerateWindows -RuntimeId $RuntimeId -SkipNameless:$SkipNameless -NoSort:$NoSort

if ([string]::IsNullOrEmpty($RuntimeId)) {
    $windows | Select-Object Name, RuntimeId
} else {
    $target = $windows | Select-Object -First 1
    if ($null -eq $target) {
        "null"
    } else {
        $tree = Build-UiaTreeObject -Element $target.Element
        $tree | ConvertTo-Json -Depth 100
    }
}

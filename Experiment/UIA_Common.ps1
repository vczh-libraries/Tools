# Shared UI Automation helpers for scripts in this folder.
# Dot-source this file to reuse EnumerateWindows and related helpers.

#requires -Version 5.1

Set-StrictMode -Version Latest

function Ensure-UiaAssemblies {
    try {
        Add-Type -AssemblyName UIAutomationClient -ErrorAction Stop | Out-Null
        Add-Type -AssemblyName UIAutomationTypes -ErrorAction Stop | Out-Null
    } catch {
        throw "Failed to load UI Automation assemblies (UIAutomationClient/UIAutomationTypes): $($_.Exception.Message)"
    }
}

function Format-RuntimeId {
    param([int[]]$RuntimeId)
    if ($null -eq $RuntimeId -or $RuntimeId.Count -eq 0) { return "" }
    return ($RuntimeId -join ".")
}

function EnumerateWindows {
    [CmdletBinding()]
    param(
        [string]$RuntimeId = "",
        [switch]$SkipNameless,
        [switch]$NoSort
    )

    Ensure-UiaAssemblies

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


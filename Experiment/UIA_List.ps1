# Lists all visible top-level windows (UI Automation) with their names and runtime IDs.
# Note: Some UIA providers behave better in an STA host. If you see COM/UIA errors, try:
#   powershell.exe -STA -File .\Experiment\UIA_List.ps1
# Tree output is provider-dependent. Many frameworks expose "container" nodes as ControlType.Pane.
# If you see too many Pane nodes, try `-View Content` (or `-View Control`) to reduce noise.

#requires -Version 5.1

[CmdletBinding()]
param(
    [switch]$SkipNameless,
    [switch]$NoSort,
    [string]$RuntimeId = "",

    [ValidateSet('Raw', 'Control', 'Content')]
    [string]$View = "Control",

    [int]$MaxDepth = 80,
    [int]$MaxChildren = 0,

    [switch]$IncludeInvisible
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

    return "Unknown"
}

function Get-ElementLocalizedTypeString {
    param([System.Windows.Automation.AutomationElement]$Element)

    try {
        $localized = $Element.Current.LocalizedControlType
        if (-not [string]::IsNullOrWhiteSpace($localized)) {
            return $localized
        }
    } catch {
    }

    return ""
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

function Format-Json2Spaces {
    param([Parameter(Mandatory = $true)][string]$Json)

    $chars = $Json.ToCharArray()
    $indentLevel = 0
    $inString = $false
    $escape = $false
    $sb = New-Object System.Text.StringBuilder

    for ($i = 0; $i -lt $chars.Length; $i++) {
        $ch = $chars[$i]

        if ($inString) {
            [void]$sb.Append($ch)
            if ($escape) {
                $escape = $false
            } elseif ($ch -eq '\') {
                $escape = $true
            } elseif ($ch -eq '"') {
                $inString = $false
            }
            continue
        }

        switch ($ch) {
            '"' {
                $inString = $true
                [void]$sb.Append($ch)
            }
            '{' {
                if ($i + 1 -lt $chars.Length -and $chars[$i + 1] -eq '}') {
                    [void]$sb.Append("{}")
                    $i++
                    break
                }
                [void]$sb.Append('{')
                $indentLevel++
                [void]$sb.Append("`n")
                [void]$sb.Append((' ' * ($indentLevel * 2)))
            }
            '[' {
                if ($i + 1 -lt $chars.Length -and $chars[$i + 1] -eq ']') {
                    [void]$sb.Append("[]")
                    $i++
                    break
                }
                [void]$sb.Append('[')
                $indentLevel++
                [void]$sb.Append("`n")
                [void]$sb.Append((' ' * ($indentLevel * 2)))
            }
            '}' {
                $indentLevel = [Math]::Max(0, $indentLevel - 1)
                [void]$sb.Append("`n")
                [void]$sb.Append((' ' * ($indentLevel * 2)))
                [void]$sb.Append('}')
            }
            ']' {
                $indentLevel = [Math]::Max(0, $indentLevel - 1)
                [void]$sb.Append("`n")
                [void]$sb.Append((' ' * ($indentLevel * 2)))
                [void]$sb.Append(']')
            }
            ',' {
                [void]$sb.Append(',')
                [void]$sb.Append("`n")
                [void]$sb.Append((' ' * ($indentLevel * 2)))
            }
            ':' {
                [void]$sb.Append(': ')
            }
            default {
                if (-not [char]::IsWhiteSpace($ch)) {
                    [void]$sb.Append($ch)
                }
            }
        }
    }

    return $sb.ToString()
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
    param(
        [System.Windows.Automation.AutomationElement]$Element,
        [switch]$SkipInvisible,
        [ValidateSet('Raw', 'Control', 'Content')][string]$View = "Control",
        [int]$MaxDepth = 80,
        [int]$MaxChildren = 0,
        [int]$Depth = 0
    )

    if ($SkipInvisible) {
        try {
            if ($Element.Current.IsOffscreen) { return $null }
        } catch {
        }
    }

    if ($Depth -ge $MaxDepth) {
        return [pscustomobject]@{
            RuntimeId      = (Format-RuntimeId -RuntimeId ($Element.GetRuntimeId()))
            Type           = (Get-ElementTypeString -Element $Element)
            TypeLocalized  = (Get-ElementLocalizedTypeString -Element $Element)
            Text           = (Get-ElementText -Element $Element)
            AutomationId   = ""
            ClassName      = ""
            FrameworkId    = ""
            IsControl      = $false
            IsContent      = $false
            Bounds         = $null
            Children       = @()
            DepthTruncated = $true
        }
    }

    $bounds = $null
    try {
        $rect = $Element.Current.BoundingRectangle
        $bounds = [pscustomobject]@{
            X      = $rect.X
            Y      = $rect.Y
            Width  = $rect.Width
            Height = $rect.Height
        }

        if ($SkipInvisible -and ($rect.Width -le 0 -or $rect.Height -le 0)) {
            return $null
        }
    } catch {
        if ($SkipInvisible) { return $null }
        $bounds = [pscustomobject]@{ X = 0; Y = 0; Width = 0; Height = 0 }
    }

    $children = @()
    try {
        $walker = switch ($View) {
            'Raw' { [System.Windows.Automation.TreeWalker]::RawViewWalker }
            'Content' { [System.Windows.Automation.TreeWalker]::ContentViewWalker }
            default { [System.Windows.Automation.TreeWalker]::ControlViewWalker }
        }

        $child = $walker.GetFirstChild($Element)
        $childCount = 0
        while ($null -ne $child) {
            try {
                $childObj = Build-UiaTreeObject -Element $child -SkipInvisible:$SkipInvisible -View $View -MaxDepth $MaxDepth -MaxChildren $MaxChildren -Depth ($Depth + 1)
                if ($null -ne $childObj) {
                    $children += $childObj
                }
            } catch {
            }

            $childCount++
            if ($MaxChildren -gt 0 -and $childCount -ge $MaxChildren) { break }

            try {
                $child = $walker.GetNextSibling($child)
            } catch {
                break
            }
        }
    } catch {
    }

    $automationId = ""
    $className = ""
    $frameworkId = ""
    try { $automationId = $Element.Current.AutomationId } catch { }
    try { $className = $Element.Current.ClassName } catch { }
    try { $frameworkId = $Element.Current.FrameworkId } catch { }

    [pscustomobject]@{
        RuntimeId      = (Format-RuntimeId -RuntimeId ($Element.GetRuntimeId()))
        Type           = "$($frameworkId):$(Get-ElementTypeString -Element $Element):$($className)"
        Text           = (Get-ElementText -Element $Element)
        AutomationId   = $automationId
        Bounds         = $bounds
        DepthTruncated = $false
        Children       = $children
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
        $skipInvisible = -not $IncludeInvisible
        $tree = Build-UiaTreeObject -Element $target.Element -SkipInvisible:$skipInvisible -View $View -MaxDepth $MaxDepth -MaxChildren $MaxChildren
        $jsonDepth = [Math]::Min(100, [Math]::Max(10, $MaxDepth + 5))
        $json = $tree | ConvertTo-Json -Depth $jsonDepth -Compress
        Format-Json2Spaces -Json $json
    }
}

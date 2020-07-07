param (
    [String]$Project = ""
)

Set-ItemProperty $dontshowui_key -Name DontShowUI -Value 1
Push-Location $PSScriptRoot | Out-Null

function DocGen-Build-Index {
    throw "Not implemented."
}

function DocGen-Index {
    throw "Not implemented."
}

function DocGen-Verify {
    throw "Not implemented."
}

function DocGen-BuildWebsite {
    throw "Not implemented."
}

function DocGen-Copy {
    throw "Not implemented."
}

try {
    switch ($Project) {
        "build-index" {
            DocGen-Build-Index
        }
        "index" {
            DocGen-Index
        }
        "verify" {
            DocGen-Verify
        }
        "build-website" {
            DocGen-BuildWebsite
        }
        "copy" {
            DocGen-Copy
        }
        default {
            throw "Unknown project `"$Project`". Project can be either unspecified or one of the following value: build-index, index, verify, build-website, copy."
        }
    }
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Pop-Location | Out-Null
Set-ItemProperty $dontshowui_key -Name DontShowUI -Value $dontshowui_value
[Console]::ResetColor()
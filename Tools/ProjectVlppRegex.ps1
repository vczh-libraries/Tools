function Build-VlppRegex {
    # Run test cases
    Test-Vlpp "VlppRegex"
}

function Import-VlppRegex {
    # Import
    Import-Project VlppRegex ("Vlpp","VlppOS")
}

function Release-VlppRegex {
    # Release
    Release-Project VlppRegex
}
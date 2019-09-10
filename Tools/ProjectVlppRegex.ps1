function Build-VlppRegex {
    # Run test cases
    Test-Vlpp "VlppRegex"
}

function Update-VlppRegex {
    # Import
    Import-Project VlppRegex ("Vlpp","VlppOS")

    # Release
    Release-Project VlppRegex
}
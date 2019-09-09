function Update-VlppRegex {
    # Import
    Import-Project VlppRegex ("Vlpp","VlppOS")

    # Run test cases
    Test-Vlpp "VlppRegex"

    # Release
    Release-Project VlppRegex
}
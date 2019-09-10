function Build-VlppReflection {
    # Run test cases
    Test-Vlpp "VlppReflection"
}

function Update-VlppReflection {
    # Import
    Import-Project VlppReflection ("Vlpp","VlppOS","VlppRegex")

    # Release
    Release-Project VlppReflection
}
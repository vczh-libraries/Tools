function Update-VlppReflection {
    # Import
    Import-Project VlppReflection ("Vlpp","VlppOS","VlppRegex")

    # Run test cases
    Test-Vlpp "VlppReflection"

    # Release
    Release-Project VlppReflection
}
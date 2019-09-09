function Update-VlppOS {
    # Import
    Import-Project VlppOS ("Vlpp")

    # Run test cases
    Test-Vlpp "VlppOS"

    # Release
    Release-Project VlppOS
}
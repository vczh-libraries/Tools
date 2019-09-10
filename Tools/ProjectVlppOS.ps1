function Build-VlppOS {
    # Run test cases
    Test-Vlpp "VlppOS"
}

function Update-VlppOS {
    # Import
    Import-Project VlppOS ("Vlpp")

    # Release
    Release-Project VlppOS
}
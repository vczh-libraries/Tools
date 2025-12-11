function Build-VlppOS {
    # Run test cases
    Test-Vlpp "VlppOS"
}

function Import-VlppOS {
    # Import
    Import-Project VlppOS ("Vlpp")
}

function Release-VlppOS {
    # Release
    Release-Project VlppOS
}
function Build-VlppReflection {
    # Run test cases
    Test-Vlpp-SubProject "VlppReflection" "Metadata_Generate"
    Test-Vlpp-SubProject "VlppReflection" "Metadata_Test"
    Test-Vlpp-SubProject "VlppReflection" "UnitTest"
}

function Update-VlppReflection {
    # Import
    Import-Project VlppReflection ("Vlpp","VlppOS","VlppRegex")

    # Release
    Release-Project VlppReflection
}
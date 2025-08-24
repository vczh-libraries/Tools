# Prepare Copilot workspace files

# Create or override the markdown files with the specified content
$filesToCreate = @{
    "Copilot_Planning.md" = "# !!!PLANNING!!!"
    "Copilot_Execution.md" = "# !!!EXECUTION!!!"
    "Copilot_Task.md" = "# !!!TASK!!!"
}

# Create each markdown file with the specified content
foreach ($file in $filesToCreate.GetEnumerator()) {
    $filePath = ".\$($file.Key)"
    Write-Host "Creating/overriding $($file.Key)..."
    $file.Value | Out-File -FilePath $filePath -Encoding UTF8
}

Write-Host "Copilot preparation completed."
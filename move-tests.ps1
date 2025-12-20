# PowerShell script to move all test files to centralized __tests__ folder

$testFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.test.tsx","*.test.ts" | Where-Object { $_.DirectoryName -like "*__tests__*" }

Write-Host "Found $($testFiles.Count) test files to move"

foreach ($file in $testFiles) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    $sourcePath = $relativePath
    
    # Determine destination based on source location
    $destPath = $relativePath -replace "src\\", "src\__tests__\"
    $destPath = $destPath -replace "\\__tests__\\", "\"
    
    $destDir = Split-Path -Path $destPath -Parent
    
    # Create destination directory if it doesn't exist
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    
    Write-Host "Moving: $sourcePath -> $destPath"
    Move-Item -Path $file.FullName -Destination $destPath -Force
}

Write-Host "Done! All test files moved to src/__tests__/"


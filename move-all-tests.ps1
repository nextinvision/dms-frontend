# PowerShell script to move all test files to centralized __tests__ folder

Write-Host "Starting test file migration..." -ForegroundColor Green

# Find all test files in __tests__ folders
$testFiles = Get-ChildItem -Path "src" -Recurse -Include "*.test.tsx","*.test.ts" | 
    Where-Object { 
        $_.DirectoryName -like "*__tests__*" -or 
        $_.FullName -like "*\__tests__\*"
    }

Write-Host "Found $($testFiles.Count) test files to move" -ForegroundColor Yellow

$movedCount = 0
$errorCount = 0

foreach ($file in $testFiles) {
    try {
        $fullPath = $file.FullName
        $relativePath = $fullPath.Replace((Get-Location).Path + "\", "").Replace("\", "/")
        
        # Build destination path
        # Remove src/ prefix and __tests__ folder from path
        $destRelative = $relativePath -replace "^src/", ""
        $destRelative = $destRelative -replace "/__tests__/", "/"
        $destRelative = $destRelative -replace "__tests__/", ""
        
        # Add src/__tests__ prefix
        $destPath = "src/__tests__/$destRelative"
        $destPath = $destPath.Replace("/", "\")
        
        $destDir = Split-Path -Path $destPath -Parent
        
        # Create destination directory if it doesn't exist
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
            Write-Host "Created directory: $destDir" -ForegroundColor Cyan
        }
        
        # Move file
        if (Test-Path $destPath) {
            Write-Host "Skipping (already exists): $destPath" -ForegroundColor Yellow
        } else {
            Move-Item -Path $fullPath -Destination $destPath -Force
            Write-Host "Moved: $($file.Name) -> $destPath" -ForegroundColor Green
            $movedCount++
        }
    }
    catch {
        Write-Host "Error moving $($file.Name): $_" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`nMigration complete!" -ForegroundColor Green
Write-Host "Moved: $movedCount files" -ForegroundColor Green
Write-Host "Errors: $errorCount files" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run test" -ForegroundColor White
Write-Host "2. Verify all tests pass" -ForegroundColor White
Write-Host "3. Delete empty __tests__ folders from source directories" -ForegroundColor White


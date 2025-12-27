# Fix all component imports in test files

Write-Host "Fixing component imports..." -ForegroundColor Green

$testFiles = Get-ChildItem -Path "src/__tests__" -Recurse -Include "*.test.tsx","*.test.ts"

$importFixes = @{
    # UI Components
    'from [''"]\.\./Button[''"]' = 'from "@/components/ui/Button"'
    'from [''"]\.\./Modal[''"]' = 'from "@/components/ui/Modal"'
    'from [''"]\.\./Input[''"]' = 'from "@/components/ui/Input"'
    'from [''"]\.\./Card[''"]' = 'from "@/components/ui/Card"'
    'from [''"]\.\./CardHeader[''"]' = 'from "@/components/ui/Card/CardHeader"'
    'from [''"]\.\./CardBody[''"]' = 'from "@/components/ui/Card/CardBody"'
    'from [''"]\.\./CardFooter[''"]' = 'from "@/components/ui/Card/CardFooter"'
    'from [''"]\.\./Badge[''"]' = 'from "@/components/ui/Badge"'
    'from [''"]\.\./Table[''"]' = 'from "@/components/ui/Table"'
    'from [''"]\.\./TableHeader[''"]' = 'from "@/components/ui/Table/TableHeader"'
    'from [''"]\.\./TableRow[''"]' = 'from "@/components/ui/Table/TableRow"'
    'from [''"]\.\./TableCell[''"]' = 'from "@/components/ui/Table/TableCell"'
    'from [''"]\.\./Toast[''"]' = 'from "@/components/ui/Toast"'
    'from [''"]\.\./ToastContainer[''"]' = 'from "@/components/ui/Toast/ToastContainer"'
    'from [''"]\.\./EmptyState[''"]' = 'from "@/components/ui/EmptyState"'
    'from [''"]\.\./ConfirmModal[''"]' = 'from "@/components/ui/ConfirmModal"'
    'from [''"]\.\./FilterBar[''"]' = 'from "@/components/ui/FilterBar"'
    'from [''"]\.\./SearchBar[''"]' = 'from "@/components/ui/SearchBar"'
    'from [''"]\.\./PageLoader[''"]' = 'from "@/components/ui/PageLoader"'
    'from [''"]\.\./LoadingSpinner[''"]' = 'from "@/components/ui/LoadingSpinner"'
    'from [''"]\.\./TopLoadingBar[''"]' = 'from "@/components/ui/TopLoadingBar"'
    
    # Form Components
    'from [''"]\.\./FormField[''"]' = 'from "@/components/forms/FormField"'
    'from [''"]\.\./FormSelect[''"]' = 'from "@/components/forms/FormSelect"'
    'from [''"]\.\./FormTextarea[''"]' = 'from "@/components/forms/FormTextarea"'
    'from [''"]\.\./FormDatePicker[''"]' = 'from "@/components/forms/FormDatePicker"'
    
    # Data Display Components
    'from [''"]\.\./DataTable[''"]' = 'from "@/components/data-display/DataTable"'
    'from [''"]\.\./StatsCard[''"]' = 'from "@/components/data-display/StatsCard"'
    'from [''"]\.\./StatusBadge[''"]' = 'from "@/components/data-display/StatusBadge"'
    'from [''"]\.\./PriorityIndicator[''"]' = 'from "@/components/data-display/PriorityIndicator"'
    
    # Types
    'from [''"]\.\./types/job-card\.types[''"]' = 'from "@/features/job-cards/types/job-card.types"'
    'from [''"]\.\./\.\./types/job-card\.types[''"]' = 'from "@/features/job-cards/types/job-card.types"'
}

$fixedCount = 0

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    foreach ($pattern in $importFixes.GetEnumerator()) {
        if ($content -match $pattern.Key) {
            $content = $content -replace $pattern.Key, $pattern.Value
            $changed = $true
        }
    }
    
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "`nFixed imports in $fixedCount files" -ForegroundColor Green


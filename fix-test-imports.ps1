# PowerShell script to fix imports in test files after moving to __tests__ folder

Write-Host "Fixing imports in test files..." -ForegroundColor Green

$testFiles = Get-ChildItem -Path "src/__tests__" -Recurse -Include "*.test.tsx","*.test.ts"

$fixedCount = 0

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    # Fix relative imports that go up from __tests__ to source
    # Pattern: from "../something" or from "../../something"
    # Should become: from "@/core/something" or "@/features/something" etc.
    
    # Get the relative path from src/__tests__ to determine correct @/ path
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\src\__tests__\", "").Replace("\", "/")
    $testDir = Split-Path -Path $relativePath -Parent
    
    # Common patterns to fix
    $patterns = @{
        'from "\.\./client"' = 'from "@/core/api/client"'
        'from "\.\./\.\./client"' = 'from "@/core/api/client"'
        'from "\.\./customer\.repository"' = 'from "@/core/repositories/customer.repository"'
        'from "\.\./\.\./customer\.repository"' = 'from "@/core/repositories/customer.repository"'
        'from "\.\./job-card\.repository"' = 'from "@/core/repositories/job-card.repository"'
        'from "\.\./vehicle\.repository"' = 'from "@/core/repositories/vehicle.repository"'
        'from "\.\./jobCard\.service"' = 'from "@/features/job-cards/services/jobCard.service"'
        'from "\.\./\.\./jobCard\.service"' = 'from "@/features/job-cards/services/jobCard.service"'
        'from "\.\./customer\.service"' = 'from "@/features/customers/services/customer.service"'
        'from "\.\./\.\./customer\.service"' = 'from "@/features/customers/services/customer.service"'
        'from "\.\./staff\.service"' = 'from "@/features/workshop/services/staff.service"'
        'from "\.\./quotations\.service"' = 'from "@/features/quotations/services/quotations.service"'
        'from "\.\./useJobCards"' = 'from "@/features/job-cards/hooks/useJobCards"'
        'from "\.\./useJobCardForm"' = 'from "@/features/job-cards/hooks/useJobCardForm"'
        'from "\.\./useJobCardView"' = 'from "@/features/job-cards/hooks/useJobCardView"'
        'from "\.\./useJobCardCreation"' = 'from "@/features/job-cards/hooks/useJobCardCreation"'
        'from "\.\./useCustomers"' = 'from "@/features/customers/hooks/useCustomers"'
        'from "\.\./jobCardAdapter"' = 'from "@/features/job-cards/utils/jobCardAdapter"'
        'from "\.\./jobCardUtils"' = 'from "@/features/job-cards/utils/jobCardUtils"'
        'from "\.\./invoice\.utils"' = 'from "@/shared/utils/invoice.utils"'
        'from "\.\./service-center\.utils"' = 'from "@/shared/utils/service-center.utils"'
        'from "\.\./job-card\.utils"' = 'from "@/shared/utils/job-card.utils"'
        'from "\.\./validation"' = 'from "@/shared/utils/validation"'
        'from "\.\./date"' = 'from "@/shared/utils/date"'
    }
    
    foreach ($pattern in $patterns.GetEnumerator()) {
        if ($content -match $pattern.Key) {
            $content = $content -replace $pattern.Key, $pattern.Value
            $changed = $true
        }
    }
    
    # Fix component imports
    $content = $content -replace 'from "\.\./\.\./\.\./components/ui/Button"', 'from "@/components/ui/Button"'
    $content = $content -replace 'from "\.\./\.\./\.\./components/ui/Modal"', 'from "@/components/ui/Modal"'
    $content = $content -replace 'from "\.\./\.\./\.\./components/ui/Input"', 'from "@/components/ui/Input"'
    $content = $content -replace 'from "\.\./\.\./\.\./components/forms/FormField"', 'from "@/components/forms/FormField"'
    $content = $content -replace 'from "\.\./\.\./\.\./components/forms/FormSelect"', 'from "@/components/forms/FormSelect"'
    $content = $content -replace 'from "\.\./\.\./\.\./components/forms/FormTextarea"', 'from "@/components/forms/FormTextarea"'
    $content = $content -replace 'from "\.\./\.\./\.\./components/forms/FormDatePicker"', 'from "@/components/forms/FormDatePicker"'
    
    # Fix test utils imports
    $content = $content -replace 'from "\.\./\.\./\.\./test/utils/render"', 'from "@/test/utils/render"'
    $content = $content -replace 'from "\.\./\.\./\.\./test/utils/mocks"', 'from "@/test/utils/mocks"'
    $content = $content -replace 'from "\.\./\.\./\.\./test/utils/helpers"', 'from "@/test/utils/helpers"'
    
    if ($changed -or $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

Write-Host "`nFixed imports in $fixedCount files" -ForegroundColor Green
Write-Host "Run: npm run test to verify" -ForegroundColor Yellow


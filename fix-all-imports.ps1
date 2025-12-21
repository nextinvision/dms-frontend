# Comprehensive script to fix all relative imports in test files

Write-Host "Fixing all relative imports..." -ForegroundColor Green

$testFiles = Get-ChildItem -Path "src/__tests__" -Recurse -Include "*.test.tsx","*.test.ts"

$fixes = @{
    # Core API
    'from [''"]\.\./client[''"]' = 'from "@/core/api/client"'
    'from [''"]\.\./\.\./client[''"]' = 'from "@/core/api/client"'
    
    # Repositories
    'from [''"]\.\./customer\.repository[''"]' = 'from "@/core/repositories/customer.repository"'
    'from [''"]\.\./\.\./customer\.repository[''"]' = 'from "@/core/repositories/customer.repository"'
    'from [''"]\.\./job-card\.repository[''"]' = 'from "@/core/repositories/job-card.repository"'
    'from [''"]\.\./vehicle\.repository[''"]' = 'from "@/core/repositories/vehicle.repository"'
    
    # Services
    'from [''"]\.\./jobCard\.service[''"]' = 'from "@/features/job-cards/services/jobCard.service"'
    'from [''"]\.\./\.\./jobCard\.service[''"]' = 'from "@/features/job-cards/services/jobCard.service"'
    'from [''"]\.\./customer\.service[''"]' = 'from "@/features/customers/services/customer.service"'
    'from [''"]\.\./\.\./customer\.service[''"]' = 'from "@/features/customers/services/customer.service"'
    'from [''"]\.\./staff\.service[''"]' = 'from "@/features/workshop/services/staff.service"'
    'from [''"]\.\./quotations\.service[''"]' = 'from "@/features/quotations/services/quotations.service"'
    
    # Hooks
    'from [''"]\.\./useJobCards[''"]' = 'from "@/features/job-cards/hooks/useJobCards"'
    'from [''"]\.\./useJobCardForm[''"]' = 'from "@/features/job-cards/hooks/useJobCardForm"'
    'from [''"]\.\./useJobCardView[''"]' = 'from "@/features/job-cards/hooks/useJobCardView"'
    'from [''"]\.\./useJobCardCreation[''"]' = 'from "@/features/job-cards/hooks/useJobCardCreation"'
    'from [''"]\.\./useCustomers[''"]' = 'from "@/features/customers/hooks/useCustomers"'
    
    # Utils
    'from [''"]\.\./jobCardAdapter[''"]' = 'from "@/features/job-cards/utils/jobCardAdapter"'
    'from [''"]\.\./jobCardUtils[''"]' = 'from "@/features/job-cards/utils/jobCardUtils"'
    'from [''"]\.\./invoice\.utils[''"]' = 'from "@/shared/utils/invoice.utils"'
    'from [''"]\.\./service-center\.utils[''"]' = 'from "@/shared/utils/service-center.utils"'
    'from [''"]\.\./job-card\.utils[''"]' = 'from "@/shared/utils/job-card.utils"'
    'from [''"]\.\./validation[''"]' = 'from "@/shared/utils/validation"'
    'from [''"]\.\./date[''"]' = 'from "@/shared/utils/date"'
    'from [''"]\.\./jobCardPartsRequest\.util[''"]' = 'from "@/shared/utils/jobCardPartsRequest.util"'
    
    # Components - UI
    'from [''"]\.\./\.\./\.\./components/ui/Button[''"]' = 'from "@/components/ui/Button"'
    'from [''"]\.\./\.\./components/ui/Button[''"]' = 'from "@/components/ui/Button"'
    'from [''"]\.\./components/ui/Button[''"]' = 'from "@/components/ui/Button"'
    'from [''"]\.\./\.\./\.\./components/ui/Modal[''"]' = 'from "@/components/ui/Modal"'
    'from [''"]\.\./\.\./components/ui/Modal[''"]' = 'from "@/components/ui/Modal"'
    'from [''"]\.\./components/ui/Modal[''"]' = 'from "@/components/ui/Modal"'
    'from [''"]\.\./\.\./\.\./components/ui/Input[''"]' = 'from "@/components/ui/Input"'
    'from [''"]\.\./\.\./components/ui/Input[''"]' = 'from "@/components/ui/Input"'
    'from [''"]\.\./components/ui/Input[''"]' = 'from "@/components/ui/Input"'
    'from [''"]\.\./\.\./\.\./components/ui/Card[''"]' = 'from "@/components/ui/Card"'
    'from [''"]\.\./\.\./components/ui/Card[''"]' = 'from "@/components/ui/Card"'
    'from [''"]\.\./components/ui/Card[''"]' = 'from "@/components/ui/Card"'
    'from [''"]\.\./\.\./\.\./components/ui/Table[''"]' = 'from "@/components/ui/Table"'
    'from [''"]\.\./\.\./components/ui/Table[''"]' = 'from "@/components/ui/Table"'
    'from [''"]\.\./components/ui/Table[''"]' = 'from "@/components/ui/Table"'
    'from [''"]\.\./\.\./\.\./components/ui/Toast[''"]' = 'from "@/components/ui/Toast"'
    'from [''"]\.\./\.\./components/ui/Toast[''"]' = 'from "@/components/ui/Toast"'
    'from [''"]\.\./components/ui/Toast[''"]' = 'from "@/components/ui/Toast"'
    'from [''"]\.\./\.\./\.\./components/ui/EmptyState[''"]' = 'from "@/components/ui/EmptyState"'
    'from [''"]\.\./\.\./components/ui/EmptyState[''"]' = 'from "@/components/ui/EmptyState"'
    'from [''"]\.\./components/ui/EmptyState[''"]' = 'from "@/components/ui/EmptyState"'
    
    # Components - Forms
    'from [''"]\.\./\.\./\.\./components/forms/FormField[''"]' = 'from "@/components/forms/FormField"'
    'from [''"]\.\./\.\./components/forms/FormField[''"]' = 'from "@/components/forms/FormField"'
    'from [''"]\.\./components/forms/FormField[''"]' = 'from "@/components/forms/FormField"'
    'from [''"]\.\./\.\./\.\./components/forms/FormSelect[''"]' = 'from "@/components/forms/FormSelect"'
    'from [''"]\.\./\.\./components/forms/FormSelect[''"]' = 'from "@/components/forms/FormSelect"'
    'from [''"]\.\./components/forms/FormSelect[''"]' = 'from "@/components/forms/FormSelect"'
    
    # Test utils
    'from [''"]\.\./\.\./\.\./test/utils/render[''"]' = 'from "@/test/utils/render"'
    'from [''"]\.\./\.\./test/utils/render[''"]' = 'from "@/test/utils/render"'
    'from [''"]\.\./test/utils/render[''"]' = 'from "@/test/utils/render"'
    'from [''"]\.\./\.\./\.\./test/utils/mocks[''"]' = 'from "@/test/utils/mocks"'
    'from [''"]\.\./\.\./test/utils/mocks[''"]' = 'from "@/test/utils/mocks"'
    'from [''"]\.\./test/utils/mocks[''"]' = 'from "@/test/utils/mocks"'
}

$fixedCount = 0

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    foreach ($pattern in $fixes.GetEnumerator()) {
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


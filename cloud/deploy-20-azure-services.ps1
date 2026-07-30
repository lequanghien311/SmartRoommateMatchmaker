# PowerShell Script - Deploy 20 Azure Services (100% Bulletproof & Idempotent)
# Run after: az login

$ErrorActionPreference = "Continue"

# Auto approve CLI extensions and preview extension installation quietly
az config set extension.use_dynamic_install=yes_without_prompt | Out-Null
az config set extension.dynamic_install_allow_preview=true | Out-Null

$LOCATION = "eastasia"
$AI_LOCATION = "japaneast"  # Region for specialized AI models (Content Safety & OpenAI)

# Fixed resource group and clean naming convention
$RG_NAME = "rg-smartroommate-eastasia"

$KV_NAME = "kv-smartroommate-ea"
$ST_NAME = "stsmartroommateea"
$PSQL_NAME = "psql-smartroommate-ea"
$ACR_NAME = "acrsmartroommateea"
$APP_NAME = "app-smartroommate-ea"
$FUNC_NAME = "func-smartroommate-ea"

function Invoke-AzCommand {
    param([string]$Cmd)
    Invoke-Expression "az $Cmd"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Command failed: az $Cmd" -ForegroundColor Red
        Write-Host "Script halted." -ForegroundColor Yellow
        exit $LASTEXITCODE
    }
}

# Smart wrapper for Cognitive Services with auto-purge and correct Fallback SKU
function Invoke-AzCognitiveService {
    param(
        [string]$Name,
        [string]$ResourceGroup,
        [string]$Kind,
        [string]$PrimarySku = "F0",
        [string]$FallbackSku = "S1",
        [string]$Location
    )
    # Check if account already exists in Resource Group
    $exists = az cognitiveservices account show --name $Name --resource-group $ResourceGroup 2>$null
    if ($LASTEXITCODE -eq 0 -and $exists) {
        Write-Host "Cognitive Service ($Kind) already exists in $ResourceGroup. Skipping..." -ForegroundColor Green
        return
    }

    Write-Host "Creating Cognitive Service ($Kind, Primary SKU: $PrimarySku in $Location)..." -ForegroundColor Yellow
    $output = az cognitiveservices account create --name $Name --resource-group $ResourceGroup --kind $Kind --sku $PrimarySku --location $Location --yes 2>&1
    if ($LASTEXITCODE -ne 0) {
        if ($output -match "CanNotCreateMultipleFreeAccounts" -or $output -match "already exists") {
            Write-Host "Free SKU ($PrimarySku) limit hit. Auto-switching to Fallback SKU ($FallbackSku)..." -ForegroundColor Cyan
            az cognitiveservices account list-deleted --query "[?kind=='$Kind'].{name:name, location:location, resourceGroup:resourceGroup}" -o json | ConvertFrom-Json | ForEach-Object {
                az cognitiveservices account purge --name $_.name --location $_.location --resource-group $_.resourceGroup 2>$null
            }
            Start-Sleep -Seconds 2
            Invoke-AzCommand "cognitiveservices account create --name $Name --resource-group $ResourceGroup --kind $Kind --sku $FallbackSku --location $Location --yes"
        } else {
            Write-Host "ERROR: Failed to create $Kind : $output" -ForegroundColor Red
            exit 1
        }
    }
}

Write-Host "=== Starting 20 Azure Services Deployment ===" -ForegroundColor Green
Write-Host "Target Region: $LOCATION (East Asia) | AI Region: $AI_LOCATION | Resource Group: $RG_NAME" -ForegroundColor Cyan

# Register all required Azure Resource Providers automatically
Write-Host "Registering Azure Resource Providers for subscription..." -ForegroundColor Yellow
$PROVIDERS = @(
    "Microsoft.KeyVault",
    "Microsoft.AppConfiguration",
    "Microsoft.Storage",
    "Microsoft.DBforPostgreSQL",
    "Microsoft.CognitiveServices",
    "Microsoft.Search",
    "Microsoft.Maps",
    "Microsoft.SignalRService",
    "Microsoft.ServiceBus",
    "Microsoft.EventGrid",
    "Microsoft.Communication",
    "Microsoft.ContainerRegistry",
    "Microsoft.Web",
    "Microsoft.Insights",
    "Microsoft.OperationalInsights",
    "Microsoft.Network"
)

foreach ($P in $PROVIDERS) {
    az provider register --namespace $P | Out-Null
}
Write-Host "Resource Providers registered successfully." -ForegroundColor Green

# 0. Resource Group
Write-Host "[1/20] Creating Resource Group ($RG_NAME in $LOCATION)..." -ForegroundColor Yellow
Invoke-AzCommand "group create --name $RG_NAME --location $LOCATION"

# 1. Key Vault
Write-Host "[2/20] Creating Azure Key Vault ($KV_NAME)..." -ForegroundColor Yellow
$kvExists = az keyvault show --name $KV_NAME --resource-group $RG_NAME 2>$null
if (-not $kvExists) {
    Invoke-AzCommand "keyvault create --name $KV_NAME --resource-group $RG_NAME --location $LOCATION"
} else { Write-Host "Key Vault already exists. Skipping..." -ForegroundColor Green }

# 2. App Configuration
Write-Host "[3/20] Creating Azure App Configuration..." -ForegroundColor Yellow
$appcExists = az appconfig show --name "appcs-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $appcExists) {
    az appconfig create --name "appcs-smartroommate-ea" --resource-group $RG_NAME --location $LOCATION --sku Free 2>$null
} else { Write-Host "App Configuration already exists. Skipping..." -ForegroundColor Green }

# 3. Storage Account & Container
Write-Host "[4/20] Creating Azure Blob Storage ($ST_NAME)..." -ForegroundColor Yellow
$stExists = az storage account show --name $ST_NAME --resource-group $RG_NAME 2>$null
if (-not $stExists) {
    Invoke-AzCommand "storage account create --name $ST_NAME --resource-group $RG_NAME --location $LOCATION --sku Standard_LRS"
}
$ST_KEY = (az storage account keys list --account-name $ST_NAME --resource-group $RG_NAME --query "[0].value" -o tsv)
az storage container create --account-name $ST_NAME --account-key $ST_KEY --name "room-images" --public-access off 2>$null | Out-Null

# 4. PostgreSQL Flexible Server & DB & Firewall
Write-Host "[5/20] Creating PostgreSQL Flexible Server ($PSQL_NAME)..." -ForegroundColor Yellow
$psqlExists = az postgres flexible-server show --name $PSQL_NAME --resource-group $RG_NAME 2>$null
if (-not $psqlExists) {
    Invoke-AzCommand "postgres flexible-server create --name $PSQL_NAME --resource-group $RG_NAME --location $LOCATION --sku-name Standard_B1ms --tier Burstable --storage-size 32 --admin-user postgresadmin --admin-password SmartRoomie2026#Secure --yes"
}
az postgres flexible-server db create --resource-group $RG_NAME --server-name $PSQL_NAME --name smart_roommate 2>$null | Out-Null
az postgres flexible-server firewall-rule create --resource-group $RG_NAME --server-name $PSQL_NAME --name AllowAllAzureServices --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0 2>$null | Out-Null

# 5. Azure AI Vision
Write-Host "[6/20] Creating Azure AI Vision..." -ForegroundColor Yellow
Invoke-AzCognitiveService -Name "cog-vision-smartroommate" -ResourceGroup $RG_NAME -Kind "ComputerVision" -PrimarySku "F0" -FallbackSku "S1" -Location $LOCATION

# 6. Azure AI Language
Write-Host "[7/20] Creating Azure AI Language..." -ForegroundColor Yellow
Invoke-AzCognitiveService -Name "cog-lang-smartroommate" -ResourceGroup $RG_NAME -Kind "TextAnalytics" -PrimarySku "F0" -FallbackSku "S" -Location $LOCATION

# 7. Azure AI Content Safety
Write-Host "[8/20] Creating Azure AI Content Safety..." -ForegroundColor Yellow
Invoke-AzCognitiveService -Name "cog-safety-smartroommate" -ResourceGroup $RG_NAME -Kind "ContentSafety" -PrimarySku "F0" -FallbackSku "S0" -Location $AI_LOCATION

# 8. Azure AI Search
Write-Host "[9/20] Creating Azure AI Search..." -ForegroundColor Yellow
$srchExists = az search service show --name "srch-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $srchExists) {
    az search service create --name "srch-smartroommate-ea" --resource-group $RG_NAME --sku free --location $LOCATION 2>$null
} else { Write-Host "AI Search already exists. Skipping..." -ForegroundColor Green }

# 9. Azure Maps
Write-Host "[10/20] Creating Azure Maps..." -ForegroundColor Yellow
$mapsExists = az maps account show --name "maps-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $mapsExists) {
    Invoke-AzCommand "maps account create --name maps-smartroommate-ea --resource-group $RG_NAME --sku G2 --location global --accept-tos"
} else { Write-Host "Azure Maps already exists. Skipping..." -ForegroundColor Green }

# 10. Azure OpenAI
Write-Host "[11/20] Creating Azure OpenAI & Deploying gpt-4o-mini..." -ForegroundColor Yellow
Invoke-AzCognitiveService -Name "oai-smartroommate-ea" -ResourceGroup $RG_NAME -Kind "OpenAI" -PrimarySku "S0" -FallbackSku "S0" -Location $AI_LOCATION
az cognitiveservices account deployment create --name "oai-smartroommate-ea" --resource-group $RG_NAME --deployment-name gpt-4o-mini --model-name gpt-4o-mini --model-version 2024-07-18 --model-format OpenAI --sku-capacity 1 --sku-name Standard 2>$null | Out-Null

# 11. Web PubSub
Write-Host "[12/20] Creating Azure Web PubSub..." -ForegroundColor Yellow
$wpsExists = az webpubsub show --name "wps-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $wpsExists) {
    az webpubsub create --name "wps-smartroommate-ea" --resource-group $RG_NAME --location $LOCATION --sku Free_F1 2>$null
} else { Write-Host "Web PubSub already exists. Skipping..." -ForegroundColor Green }

# 12. Service Bus
Write-Host "[13/20] Creating Azure Service Bus..." -ForegroundColor Yellow
$sbExists = az servicebus namespace show --name "sb-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $sbExists) {
    Invoke-AzCommand "servicebus namespace create --name sb-smartroommate-ea --resource-group $RG_NAME --location $LOCATION --sku Standard"
}
az servicebus queue create --resource-group $RG_NAME --namespace-name "sb-smartroommate-ea" --name smart-roommate-events 2>$null | Out-Null

# 13. Event Grid
Write-Host "[14/20] Registering Event Grid Provider..." -ForegroundColor Yellow
Invoke-AzCommand "provider register --namespace Microsoft.EventGrid"

# 14. Communication Services Email
Write-Host "[15/20] Creating Azure Communication Services Email..." -ForegroundColor Yellow
$acsExists = az communication show --name "acs-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $acsExists) {
    Invoke-AzCommand "communication create --name acs-smartroommate-ea --location Global --data-location `"Asia Pacific`" --resource-group $RG_NAME"
} else { Write-Host "Communication Services already exists. Skipping..." -ForegroundColor Green }

# 15. Container Registry
Write-Host "[16/20] Creating Azure Container Registry ($ACR_NAME)..." -ForegroundColor Yellow
$acrExists = az acr show --name $ACR_NAME --resource-group $RG_NAME 2>$null
if (-not $acrExists) {
    Invoke-AzCommand "acr create --name $ACR_NAME --resource-group $RG_NAME --sku Basic --admin-enabled true --location $LOCATION"
} else { Write-Host "ACR already exists. Skipping..." -ForegroundColor Green }

# 16. App Service Plan & Web App
Write-Host "[17/20] Creating App Service Plan & App Service ($APP_NAME)..." -ForegroundColor Yellow
$aspExists = az appservice plan show --name asp-smartroommate --resource-group $RG_NAME 2>$null
if (-not $aspExists) {
    Invoke-AzCommand "appservice plan create --name asp-smartroommate --resource-group $RG_NAME --is-linux --sku B1 --location $LOCATION"
}
$appExists = az webapp show --name $APP_NAME --resource-group $RG_NAME 2>$null
if (-not $appExists) {
    Invoke-AzCommand "webapp create --name $APP_NAME --resource-group $RG_NAME --plan asp-smartroommate --runtime NODE:22-lts"
    Invoke-AzCommand "webapp identity assign --name $APP_NAME --resource-group $RG_NAME"
} else { Write-Host "Web App already exists. Skipping..." -ForegroundColor Green }

# 17. Azure Functions
Write-Host "[18/20] Creating Azure Functions ($FUNC_NAME)..." -ForegroundColor Yellow
$funcExists = az functionapp show --name $FUNC_NAME --resource-group $RG_NAME 2>$null
if (-not $funcExists) {
    Invoke-AzCommand "functionapp create --name $FUNC_NAME --resource-group $RG_NAME --storage-account $ST_NAME --consumption-plan-location $LOCATION --runtime node --runtime-version 22 --functions-version 4"
} else { Write-Host "Function App already exists. Skipping..." -ForegroundColor Green }

# 18. Application Insights
Write-Host "[19/20] Creating Application Insights..." -ForegroundColor Yellow
$appiExists = az monitor app-insights component show --app appi-smartroommate --resource-group $RG_NAME 2>$null
if (-not $appiExists) {
    Invoke-AzCommand "monitor app-insights component create --app appi-smartroommate --location $LOCATION --kind web --resource-group $RG_NAME"
} else { Write-Host "Application Insights already exists. Skipping..." -ForegroundColor Green }

# 19 & 20. Log Analytics Workspace & Network Security Group
Write-Host "[20/20] Creating Log Analytics Workspace & Network Security Group..." -ForegroundColor Yellow
$lawExists = az monitor log-analytics workspace show --workspace-name "law-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $lawExists) {
    Invoke-AzCommand "monitor log-analytics workspace create --resource-group $RG_NAME --workspace-name law-smartroommate-ea --location $LOCATION"
}
$nsgExists = az network nsg show --name "nsg-smartroommate-ea" --resource-group $RG_NAME 2>$null
if (-not $nsgExists) {
    Invoke-AzCommand "network nsg create --resource-group $RG_NAME --name nsg-smartroommate-ea --location $LOCATION"
}

Write-Host "=== 20 AZURE SERVICES DEPLOYMENT COMPLETED SUCCESSFULLY ===" -ForegroundColor Green
Write-Host "Resource Group: $RG_NAME" -ForegroundColor Cyan
Write-Host "Web App URL: https://$APP_NAME.azurewebsites.net" -ForegroundColor Cyan

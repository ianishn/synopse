	# Synopse - Backup n8n Cloud vers disque local
# Usage : .\sync_n8n_backup.ps1

$N8N_API_URL = $env:N8N_API_URL
$N8N_API_KEY = $env:N8N_API_KEY
$BACKUP_DIR  = "C:\Users\heini\OneDrive\Desktop\Synopse\sandbox\_briques\exports"
$DATE        = Get-Date -Format "yyyyMMdd_HHmm"

if (-not $N8N_API_URL -or -not $N8N_API_KEY) {
    Write-Host "Variables manquantes." -ForegroundColor Red
    Write-Host '   $env:N8N_API_URL = "https://synopse.app.n8n.cloud/api/v1"'
    Write-Host '   $env:N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlN2FjMDRhOC1hYmM0LTQ4ZWQtODY4Yy0xODhkMDk4Nzk3ZWEiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiZjY2ZmM4YjItYzFlZC00N2ZhLWJkNjQtMzE2MDY4ZmYxNzQ5IiwiaWF0IjoxNzgwMDY1MjQ5fQ.ugo1EWswreZgOTztZJXdcK9z9v-n31YuZk7CaP4hGWU"'
    exit 1
}

New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

Write-Host "Connexion a n8n Cloud..." -ForegroundColor Cyan

$headers = @{ "X-N8N-API-KEY" = $N8N_API_KEY }

try {
    $response = Invoke-RestMethod -Uri "$N8N_API_URL/workflows" -Headers $headers -Method Get
} catch {
    Write-Host "Erreur de connexion : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$workflows = $response.data
if (-not $workflows -or $workflows.Count -eq 0) {
    Write-Host "Aucun workflow recupere. Verifie tes variables." -ForegroundColor Red
    exit 1
}

$count = 0
foreach ($wf in $workflows) {
    $slug     = $wf.name -replace '[\\/:*?"<>| ]', '-'
    $filename = "$BACKUP_DIR\n8n_export_${slug}_${DATE}.json"
    $detail   = Invoke-RestMethod -Uri "$N8N_API_URL/workflows/$($wf.id)" -Headers $headers -Method Get
    $detail | ConvertTo-Json -Depth 20 | Out-File -FilePath $filename -Encoding UTF8
    Write-Host "  OK : $($wf.name)" -ForegroundColor Green
    $count++
}

Write-Host ""
Write-Host "Backup termine : $count workflow(s) dans $BACKUP_DIR" -ForegroundColor Cyan

<#
.SYNOPSIS
FGate Logs Server - Modo Puente & Auto-Configurator 

.DESCRIPTION
Servidor HTTP "Puente" para FGate.
- Inyección automática en js/state.js
- Validación de archivos.

.PARAMETER Open
Abre el navegador automáticamente.

.EXAMPLE
.\server_js_injector.ps1 -Open
#>

param (
    [switch]$Open
)
#Se que es mala practica tenerl los logs en c:\logs pero es un entorno controlado y es mas facil para pruebas
$LogMapping = @{
    "BuscarServiciosClientesSlam" = "C:\logs\BuscarServiciosClientesSlam.log"
    "FTPenviosSLAM"               = "C:\logs\FTPenviosSLAM.log"
    "FTPenviosSLAMservicio"       = "C:\logs\FTPenviosSLAMservicio.log"
    "ManifestacionMongoService"   = "C:\logs\ManifestacionMongoService.log"
    "ManifestacionRepository"     = "C:\logs\ManifestacionRepository.log"
    "Parser_MV_Service"           = "C:\logs\Parser_MV_Service.log"
    "PedimentoLookupHelper"       = "C:\logs\PedimentoLookupHelper.log"
    "QuerysToCasaDB"              = "C:\logs\QuerysToCasaDB.log"
    "servicio_ftp"                = "C:\logs\servicio_ftp.log"
    "toter_sync"                  = "C:\logs\toter_sync.log"
    "vucem_consultas"             = "C:\Ruta\Falsa\vucem_consultas.log" 
}

$Port = 5050
$Root = $PSScriptRoot
$JsPath = Join-Path $Root "js\state.js"
$JsBackup = Join-Path $Root "js\state.js.old"

Write-Host "Preparando entorno..." -ForegroundColor Cyan

$ValidEntries = @()
Write-Host "Verificando existencia de archivos:" -ForegroundColor Gray

foreach ($key in $LogMapping.Keys) {
    $path = $LogMapping[$key]
    if (Test-Path $path) {
        $ValidEntries += "    `"api/log?id=$key`","
        Write-Host " [OK]  $key" -ForegroundColor Green
    }
    else {
        Write-Host " [SKIP] No encontrado: $path" -ForegroundColor DarkGray
    }
}

if (Test-Path $JsBackup) { Copy-Item $JsBackup $JsPath -Force }
Copy-Item $JsPath $JsBackup -Force

$JsBlock = @"
// --- INYECCION AUTOMATICA DEL SERVER ---
try { localStorage.clear(); console.log('Storage limpiado por Server Mode'); } catch(e){}
export var AUTO_LOAD_FILES = [
$($ValidEntries -join "`n")
];
"@

$Content = Get-Content $JsPath -Raw -Encoding UTF8
$NewContent = $Content -replace 'export var AUTO_LOAD_FILES = \[[\s\S]*?\];', $JsBlock
Set-Content $JsPath $NewContent -Encoding UTF8

Write-Host "`n -> Configuracion JS actualizada." -ForegroundColor Yellow
Write-Host ""

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add("http://localhost:$Port/")
$Listener.Start()

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   FGate Server (Modo Puente) - LISTO" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " 1. Monitor: http://localhost:$Port"
Write-Host " 2. Ctrl+C para salir (respuesta rápida)."
Write-Host "==============================================" -ForegroundColor Cyan

if ($Open) {
    Write-Host " -> Abriendo navegador..." -ForegroundColor Cyan
    Start-Process "http://localhost:$Port"
}

try {
    while ($Listener.IsListening) {
        $ContextTask = $Listener.GetContextAsync()
        while (-not $ContextTask.AsyncWaitHandle.WaitOne(500)) {
            if (-not $Listener.IsListening) { break }
        }
        
        if ($Listener.IsListening -and $ContextTask.Status -eq 'RanToCompletion') {
            $Context = $ContextTask.Result
            $Request = $Context.Request
            $Response = $Context.Response
            $UrlPath = $Request.Url.LocalPath.ToLower()

            $Response.Headers.Add("Access-Control-Allow-Origin", "*")
            $Response.Headers.Add("Cache-Control", "no-store, no-cache, must-revalidate")
            
            if ($UrlPath -eq "/api/log") {
                $LogIdRaw = $Request.QueryString["id"]
                $LogId = if ($null -ne $LogIdRaw) { $LogIdRaw.Split("?")[0] } else { $null }

                if ($null -ne $LogId -and $LogMapping.ContainsKey($LogId)) {
                    $RealPath = $LogMapping[$LogId]
                    if (Test-Path $RealPath) {
                        try {
                            $Stream = [System.IO.File]::Open($RealPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
                            $Reader = New-Object System.IO.StreamReader($Stream)
                            $ContentLog = $Reader.ReadToEnd()
                            $Reader.Close(); $Stream.Close()

                            $Buffer = [System.Text.Encoding]::UTF8.GetBytes($ContentLog)
                            $Response.ContentType = "text/plain"
                            $Response.ContentLength64 = $Buffer.Length
                            $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
                        }
                        catch { $Response.StatusCode = 500 }
                    }
                    else { $Response.StatusCode = 404 }
                }
                else { $Response.StatusCode = 400 }
            }
            else {
                $FilePath = Join-Path $Root $UrlPath.TrimStart('/')
                if ($UrlPath -eq "/") { $FilePath = Join-Path $Root "index.html" }

                if (Test-Path $FilePath -PathType Leaf) {
                    $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
                    $Ext = [System.IO.Path]::GetExtension($FilePath)
                    $Mime = switch ($Ext) { ".html" { "text/html" } ".js" { "application/javascript" } ".css" { "text/css" } default { "application/octet-stream" } }
                    $Response.ContentType = $Mime
                    $Response.ContentLength64 = $Bytes.Length
                    $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
                }
                else { $Response.StatusCode = 404 }
            }
            $Response.Close()
        }
    }
}
catch {
    Write-Host "`n -> Servidor detenido." -ForegroundColor Yellow
}
finally {
    $Listener.Stop()
    $Listener.Close()
    if (Test-Path $JsBackup) {
        Copy-Item $JsBackup $JsPath -Force
        Remove-Item $JsBackup -Force
        Write-Host "`n -> Entorno restaurado correctamente." -ForegroundColor Green
    }
}
$port = 5050
$root = Get-Location
$url = "http://localhost:$port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "   Logs Manager POC SERVER - CORRIENDO"     -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " 1. Escuchando en: $url"
    Write-Host " 2. Raiz: $root"
    Write-Host " 3. Para salir presiona Ctrl + C"
    Write-Host "==========================================" -ForegroundColor Cyan

    Start-Process $url

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.LocalPath.TrimStart('/')

        if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }        
        $path = [Uri]::UnescapeDataString($path)
        $localPath = Join-Path $root $path

        if (Test-Path $localPath -PathType Leaf) {
            try {

                $content = [System.IO.File]::ReadAllBytes($localPath)
                                $extension = [System.IO.Path]::GetExtension($localPath).ToLower()
                switch ($extension) {
                    ".html" { $response.ContentType = "text/html; charset=utf-8" }
                    ".css"  { $response.ContentType = "text/css" }
                    ".js"   { $response.ContentType = "application/javascript" }
                    ".json" { $response.ContentType = "application/json" }
                    ".log"  { $response.ContentType = "text/plain; charset=utf-8" }
                    ".txt"  { $response.ContentType = "text/plain; charset=utf-8" }
                    Default { $response.ContentType = "application/octet-stream" }
                }
                $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
                $response.AddHeader("Pragma", "no-cache")
                $response.AddHeader("Expires", "0")
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
                $response.StatusCode = 200
            }
            catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
        }
        
        $response.Close()
    }
}
finally {
    if ($listener.IsListening) { $listener.Stop() }
    Write-Host "Servidor detenido." -ForegroundColor Yellow
}
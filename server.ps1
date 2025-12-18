# Logs Manager POC - Servidor estático simple usando HttpListener
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\server.ps1
#   O (para cambiar la política permanente del usuario):
#     Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# Descripción:
#   - Define el puerto y la carpeta raíz
#   - Crea un HttpListener y registra el prefijo (URL)
#   - Inicia el listener y abre el navegador en la URL
#   - Atiende peticiones y sirve archivos estáticos (usa index.html por defecto)
#   - Asigna Content-Type según la extensión y añade cabeceras anti-cache
# Notas de seguridad: usar 'ExecutionPolicy Bypass' sólo en desarrollo o cuando confíes en el script

# Puerto en el que escucha el servidor (puedes cambiarlo)
$port = 5050
# Carpeta raíz desde la que se sirven los archivos (se usa la carpeta actual)
$root = Get-Location
# URL base que escucha el HttpListener (y que se abrirá en el navegador)
$url = "http://localhost:$port/"

# Crear instancia de HttpListener y registrar el prefijo (URL) que deberá atender
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

    # Abrir la URL en el navegador predeterminado para facilitar pruebas
    Start-Process $url

    # Bucle principal: mientras el listener esté activo, atender peticiones HTTP
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $path = $request.Url.LocalPath.TrimStart('/')

        if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }        
        $path = [Uri]::UnescapeDataString($path)
        # Combinar la ruta solicitada con la carpeta raíz del servidor
        $localPath = Join-Path $root $path

        # Si existe el archivo solicitado, leer su contenido y devolverlo
        if (Test-Path $localPath -PathType Leaf) {
            try {

                $content = [System.IO.File]::ReadAllBytes($localPath)
                                # Determinar la extensión para asignar el encabezado Content-Type adecuado
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
                # Añadir cabeceras para evitar cacheo (útil en desarrollo)
                $response.AddHeader("Cache-Control", "no-cache, no-store, must-revalidate")
                $response.AddHeader("Pragma", "no-cache")
                $response.AddHeader("Expires", "0")
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
                $response.StatusCode = 200
            }
            catch {
                # Error interno al servir el archivo
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
        }
        
        $response.Close()
    }
}
finally {
    # Al finalizar el script, detener el listener si aún está activo
    if ($listener.IsListening) { $listener.Stop() }
    Write-Host "Servidor detenido." -ForegroundColor Yellow
}
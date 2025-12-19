"""
SYNOPSIS
FGate Logs Server - Python Modo Puente & Auto-Configurator

DESCRIPTION
1. Inyecta configuración en js/state.js solo con archivos existentes.
2. Limpia localStorage.
3. Sirve archivos bloqueados (modo lectura compartido).
4. Cierra limpiamente con Ctrl+C.

USO
python server_js_injector.py           -> Inicia el servidor
python server_js_injector.py --open    -> Inicia y abre el navegador
"""

import http.server
import socketserver
import os
import shutil
import re
import sys
import urllib.parse
import webbrowser
import argparse

LOG_MAPPING = {
    "BuscarServiciosClientesSlam": r"C:\logs\BuscarServiciosClientesSlam.log",
    "FTPenviosSLAM":               r"C:\logs\FTPenviosSLAM.log",
    "FTPenviosSLAMservicio":       r"C:\logs\FTPenviosSLAMservicio.log",
    "ManifestacionMongoService":   r"C:\logs\ManifestacionMongoService.log",
    "ManifestacionRepository":     r"C:\logs\ManifestacionRepository.log",
    "Parser_MV_Service":           r"C:\logs\Parser_MV_Service.log",
    "PedimentoLookupHelper":       r"C:\logs\PedimentoLookupHelper.log",
    "QuerysToCasaDB":              r"C:\logs\QuerysToCasaDB.log",
    "servicio_ftp":                r"C:\logs\servicio_ftp.log",
    "toter_sync":                  r"C:\logs\toter_sync.log",
    "vucem_consultas":             r"C:\Ruta\Falsa\vucem_consultas.log"
}

PORT = 5050
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
# Ajusta ".." si el script está en una subcarpeta (ej: scripts/), o quítalo si está en raíz
PROJECT_ROOT = os.path.abspath(os.path.join(ROOT_DIR, "..")) 

JS_PATH = os.path.join(PROJECT_ROOT, "js", "state.js")
JS_BACKUP = os.path.join(PROJECT_ROOT, "js", "state.js.old")

def setup_environment():
    print("⚙️  Preparando entorno...")
    
    if os.path.exists(JS_BACKUP):
        shutil.copyfile(JS_BACKUP, JS_PATH)

    if os.path.exists(JS_PATH):
        shutil.copyfile(JS_PATH, JS_BACKUP)
    else:
        print(f"❌ Error: No se encuentra {JS_PATH}")
        sys.exit(1)

    print("   Verificando existencia de archivos:")
    valid_logs = []
    
    for key, path in LOG_MAPPING.items():
        full_path = path
        if not os.path.isabs(path):
            full_path = os.path.join(PROJECT_ROOT, path)
        
        if os.path.exists(full_path):
            valid_logs.append(f'    "api/log?id={key}"')
            print(f"   ✅ [OK] {key}")
        else:
            print(f"   🚫 [SKIP] No encontrado: {full_path}")

    js_array_content = ",\n".join(valid_logs)
    
    new_block = f"""
    // --- INYECCION AUTOMATICA PYTHON ---
    try {{ localStorage.clear(); console.log('Storage limpiado por Server Python'); }} catch(e){{}}
    export var AUTO_LOAD_FILES = [
    {js_array_content}
    ];
    """

    with open(JS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = re.sub(r'export var AUTO_LOAD_FILES = \[.*?\];', new_block, content, flags=re.DOTALL)

    with open(JS_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\n   -> Inyeccion completada: {len(valid_logs)} logs activos.")

def cleanup_environment():
    print("\n🧹 Limpiando y restaurando archivos...")
    if os.path.exists(JS_BACKUP):
        shutil.copyfile(JS_BACKUP, JS_PATH)
        os.remove(JS_BACKUP)
        print("   -> Entorno restaurado.")
    print("👋 Servidor detenido.")

class LogBridgeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_ROOT, **kwargs)

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if path == "/api/log":
            log_id_raw = query.get('id', [None])[0]
            log_id = log_id_raw.split('?')[0] if log_id_raw else None

            self.send_response(200) 
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store, no-cache")
            self.send_header("Content-type", "text/plain; charset=utf-8")
            
            if log_id and log_id in LOG_MAPPING:
                file_path = LOG_MAPPING[log_id]
                if not os.path.isabs(file_path):
                    file_path = os.path.join(PROJECT_ROOT, file_path)

                if os.path.exists(file_path):
                    try:
                        with open(file_path, 'rb') as f:
                            content = f.read().decode('utf-8', errors='replace')
                            self.send_header("Content-Length", len(content.encode('utf-8')))
                            self.end_headers()
                            self.wfile.write(content.encode('utf-8'))
                    except Exception as e:
                        self.send_response(500)
                        self.end_headers()
                else:
                    self.send_response(404)
                    self.end_headers()
            else:
                self.send_response(400)
                self.end_headers()
            return

        return super().do_GET()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='FGate Logs Server')
    parser.add_argument('--open', action='store_true', help='Abrir navegador automaticamente')
    args = parser.parse_args()

    setup_environment()
    socketserver.TCPServer.allow_reuse_address = True 
    
    try:
        with socketserver.TCPServer(("", PORT), LogBridgeHandler) as httpd:
            print("==============================================")
            print(f"   FGate Server (Python Modo Puente) - LISTO")
            print("==============================================")
            print(f" 1. Monitor: http://localhost:{PORT}")
            print(" 2. Presiona Ctrl+C para detener.")
            
            if args.open:
                print("   -> Abriendo navegador...")
                webbrowser.open(f"http://localhost:{PORT}")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        cleanup_environment()
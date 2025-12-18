import http.server
import socketserver
import os
import sys

PORT = 5050
class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    if hasattr(sys, '_MEIPASS'):
        os.chdir(sys._MEIPASS)
    else:
        os.chdir(os.path.dirname(os.path.abspath(__file__)))

    Handler = NoCacheHTTPRequestHandler

    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"\n==========================================")
            print(f"   Logs Manager POC SERVER.py - CORRIENDO")
            print(f"==========================================")
            print(f" 1. Escuchando en: http://localhost:{PORT}")
            print(f" 2. Sirviendo: {os.getcwd()}")
            print(f" 3. Ctrl+C para detener")
            print(f"==========================================\n")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
    except OSError as e:
        print(f"\nError: El puerto {PORT} probablemente está ocupado.")
        print("Intenta cerrar otros procesos de python o cambia el puerto en el script.")
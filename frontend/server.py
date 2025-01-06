from http.server import HTTPServer, SimpleHTTPRequestHandler
import socket
import webbrowser

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Adicionar headers CORS para permitir acesso de qualquer origem
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        SimpleHTTPRequestHandler.end_headers(self)

def get_local_ip():
    # Obter o IP local da máquina
    try:
        # Criar um socket UDP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Não precisamos realmente conectar, mas isso nos ajuda a obter o IP local
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return '127.0.0.1'  # fallback para localhost

def run_server(port=8000):
    local_ip = get_local_ip()
    server_address = ('', port)
    httpd = HTTPServer(server_address, CORSRequestHandler)
    
    print(f'\nServidor rodando em:')
    print(f'Local: http://localhost:{port}')
    print(f'Rede: http://{local_ip}:{port}')
    print('\nPara acessar de outros dispositivos, use o endereço da Rede')
    print('Para parar o servidor, pressione Ctrl+C\n')
    
    # Abrir o navegador automaticamente
    webbrowser.open(f'http://localhost:{port}')
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServidor encerrado.')
        httpd.server_close()

if __name__ == '__main__':
    run_server() 
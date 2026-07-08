from http.server import HTTPServer, SimpleHTTPRequestHandler
import os


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    os.chdir(r'C:\Users\veena\OneDrive\Documents\eaii')
    server = HTTPServer(('0.0.0.0', 8080), NoCacheHandler)
    print("Serving frontend at http://localhost:8080 (no cache)")
    server.serve_forever()

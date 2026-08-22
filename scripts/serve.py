#!/usr/bin/env python3
"""
serve.py — server lokal sederhana untuk mencoba game ini di komputer
sebelum di-upload ke GitHub Pages.

Cara pakai:
    python3 scripts/serve.py
    (lalu buka http://localhost:8000 di browser)

Kenapa perlu server (bukan buka index.html langsung)?
Karena game ini men-deteksi file voiceover/facecam lewat fetch(),
dan browser modern memblokir fetch() untuk file yang dibuka langsung
dari disk (file://). Menjalankan server lokal kecil ini menghindari masalah itu.
"""
import http.server
import socketserver
import os
import sys

PORT = 8000

# Pastikan MIME type video/audio terbaca dengan benar
EXTRA_TYPES = {
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.webm': 'video/webm',
    '.ogg': 'audio/ogg',
}

class Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        base, ext = os.path.splitext(path)
        if ext in EXTRA_TYPES:
            return EXTRA_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):
        # supaya file bisa di-fetch dengan HEAD/GET tanpa masalah cache saat testing
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    os.chdir(root)

    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    with socketserver.TCPServer(('0.0.0.0', port), Handler) as httpd:
        print(f'Menjalankan server lokal di http://localhost:{port}')
        print(f'Folder root: {root}')
        print('Tekan Ctrl+C untuk berhenti.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer dihentikan.')


if __name__ == '__main__':
    main()

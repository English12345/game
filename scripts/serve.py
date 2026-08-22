#!/usr/bin/env python3
"""
serve.py — server lokal untuk mencoba game ini di komputer sebelum
di-upload ke GitHub Pages. Sudah mendukung HTTP Range request supaya
file video (.mp4) bisa diputar dengan lancar (server bawaan Python
default TIDAK mendukung ini, yang bisa bikin video terlihat "macet"
di satu frame saat testing lokal).

Cara pakai:
    python3 scripts/serve.py
    (lalu buka http://localhost:8000 di browser)

Kenapa perlu server (bukan buka index.html langsung)?
Karena game ini mendeteksi file voiceover/facecam lewat fetch(),
dan browser memblokir fetch() untuk file yang dibuka langsung dari
disk (file://). GitHub Pages nanti otomatis jadi server yang benar,
jadi ini hanya dipakai untuk testing di komputer sendiri.
"""
import http.server
import socketserver
import os
import re
import sys

PORT = 8000

EXTRA_TYPES = {
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.webm': 'video/webm',
    '.ogg': 'audio/ogg',
}


class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        base, ext = os.path.splitext(path)
        if ext in EXTRA_TYPES:
            return EXTRA_TYPES[ext]
        return super().guess_type(path)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        if not os.path.exists(path):
            self.send_error(404, 'File not found')
            return None

        range_header = self.headers.get('Range')
        file_size = os.path.getsize(path)
        ctype = self.guess_type(path)

        if not range_header:
            # request biasa (non-range) -> perilaku standar
            return super().send_head()

        m = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not m:
            self.send_error(416, 'Invalid range header')
            return None

        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else file_size - 1
        end = min(end, file_size - 1)

        if start >= file_size or start > end:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{file_size}')
            self.end_headers()
            return None

        f = open(path, 'rb')
        f.seek(start)
        length = end - start + 1

        self.send_response(206)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
        self.send_header('Content-Length', str(length))
        self.end_headers()

        self._range_start = start
        self._range_length = length
        return f

    def copyfile(self, source, outputfile):
        if hasattr(self, '_range_length'):
            remaining = self._range_length
            bufsize = 64 * 1024
            try:
                while remaining > 0:
                    chunk = source.read(min(bufsize, remaining))
                    if not chunk:
                        break
                    outputfile.write(chunk)
                    remaining -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass
        else:
            super().copyfile(source, outputfile)


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    os.chdir(root)

    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(('0.0.0.0', port), RangeRequestHandler) as httpd:
        print(f'Menjalankan server lokal di http://localhost:{port}')
        print(f'Folder root: {root}')
        print('Tekan Ctrl+C untuk berhenti.')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer dihentikan.')


if __name__ == '__main__':
    main()

import http.server
import socketserver
import os
import sys
import webbrowser


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve files from the frontend directory
        super().__init__(*args, directory=os.path.dirname(__file__), **kwargs)

    def end_headers(self):
        # Disable caching so changes are always visible
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        return super().end_headers()


def main():
    host = "127.0.0.1"
    port = int(os.environ.get("PORT", "5173"))
    with socketserver.ThreadingTCPServer((host, port), NoCacheHandler) as httpd:
        httpd.allow_reuse_address = True
        url = f"http://{host}:{port}/index.html"
        print("\nFront-end served with no-cache headers:")
        print(" ", url, "\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")


if __name__ == "__main__":
    sys.exit(main())


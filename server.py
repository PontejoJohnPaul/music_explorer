import base64
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib import request as urllib_request
from urllib import parse as urllib_parse

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID", "e171a509869a4302ae809bfd115eaf51")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET", "7a631abba6eb49cfa74a13596287d5e6")
HOST = "127.0.0.1"
PORT = 8000


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/spotify/"):
            self._proxy_spotify_request()
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/token":
            self._proxy_token_request()
            return
        self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def _proxy_token_request(self):
        body = urllib_parse.urlencode({"grant_type": "client_credentials"}).encode()
        auth_header = base64.b64encode(f"{CLIENT_ID}:{CLIENT_SECRET}".encode()).decode()

        req = urllib_request.Request(
            "https://accounts.spotify.com/api/token",
            data=body,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {auth_header}",
            },
            method="POST",
        )
        self._send_proxy_response(req)

    def _proxy_spotify_request(self):
        target_path = self.path[len("/api/spotify"):]
        target_url = f"https://api.spotify.com{target_path}"
        headers = {}
        auth = self.headers.get("Authorization")
        if auth:
            headers["Authorization"] = auth

        req = urllib_request.Request(target_url, headers=headers, method="GET")
        self._send_proxy_response(req)

    def _send_proxy_response(self, req):
        try:
            with urllib_request.urlopen(req, timeout=20) as response:
                payload = response.read()
                content_type = response.headers.get_content_type() or "application/json"
                self.send_response(response.status)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                self.send_header("Content-Type", content_type)
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except Exception as exc:
            payload = json.dumps({"error": str(exc)}).encode("utf-8")
            self.send_response(502)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Serving on http://{HOST}:{PORT}")
    server.serve_forever()

import json
import unittest
from backend.main import app


class TestHealthEndpoint(unittest.IsolatedAsyncioTestCase):
    """ASGI-level test that executes without external HTTP client dependencies."""

    async def test_health_check_asgi(self):
        scope = {
            "type": "http",
            "asgi": {"version": "3.0"},
            "http_version": "1.1",
            "method": "GET",
            "scheme": "http",
            "path": "/api/health",
            "raw_path": b"/api/health",
            "query_string": b"",
            "headers": [
                (b"host", b"localhost:8000"),
                (b"origin", b"http://localhost:5173"),
            ],
        }
        messages = []

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            messages.append(message)

        await app(scope, receive, send)

        start_message = next(m for m in messages if m["type"] == "http.response.start")
        body_messages = [m for m in messages if m["type"] == "http.response.body"]
        body = b"".join(m.get("body", b"") for m in body_messages)

        self.assertEqual(start_message["status"], 200)
        self.assertEqual(json.loads(body.decode("utf-8")), {"status": "healthy"})


# Pytest test cases using TestClient (active once httpx and pytest are installed)
try:
    from starlette.testclient import TestClient

    def test_health_with_test_client():
        with TestClient(app) as client:
            response = client.get("/api/health")
            assert response.status_code == 200
            assert response.json() == {"status": "healthy"}

    def test_cors_headers():
        with TestClient(app) as client:
            response = client.options(
                "/api/health",
                headers={
                    "Origin": "http://localhost:5173",
                    "Access-Control-Request-Method": "GET",
                },
            )
            assert response.status_code == 200
            assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
except (ImportError, RuntimeError):
    pass

if __name__ == "__main__":
    unittest.main()

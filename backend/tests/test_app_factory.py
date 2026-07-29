import pytest
from httpx import ASGITransport, AsyncClient

from app.create_app import create_app


@pytest.mark.anyio
async def test_health_endpoint():
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "app": "RestauTech"}

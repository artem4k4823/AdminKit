import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.database import db
from app.crud.auth import get_current_user

# Create a test client
client = TestClient(app)

# Dummy User to mock authentication
class DummyUser:
    def __init__(self):
        self.id = 1
        self.username = "testuser"
        self.displayName = "Test User"
        self.status = True
        self.isAdmin = True
        self.favorite_posts_ids = []
        self.avatar = None

class MockSession:
    async def commit(self):
        pass

def override_get_current_user():
    return (DummyUser(), MockSession())

async def override_session_getter():
    yield MockSession()

# Override dependencies globally for testing
app.dependency_overrides[get_current_user] = override_get_current_user
app.dependency_overrides[db.session_getter] = override_session_getter


def test_get_me():
    """
    Test the /log/me endpoint.
    It should return the mocked user's data.
    """
    response = client.get("/log/me")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["id"] == 1
    assert data["status"] == True


def test_get_all_users(mocker):
    """
    Test the /user/get_all_users endpoint.
    Mocks the DB call to avoid needing an active database setup.
    """
    mocker.patch(
        "app.api_v1.user_operation_views.get_all_users",
        return_value=[
            {
                "id": 1,
                "username": "testuser",
                "displayName": "Test User",
                "status": True,
                "isAdmin": True,
                "avatar": None
            }
        ]
    )
    
    response = client.get("/user/get_all_users")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["username"] == "testuser"


def test_get_favorite_posts():
    """
    Test the /post/get-favorite-posts endpoint.
    Since DummyUser has empty favorite_posts_ids, it should return an empty list without hitting the DB.
    """
    response = client.get("/post/get-favorite-posts")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


import pytest
from app import app as flask_app, db

@pytest.fixture
def app():
    # Configura la app para usar una base de datos en memoria para las pruebas
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SECRET_KEY": "test-secret-key"
    })

    with flask_app.app_context():
        db.create_all()
        yield flask_app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()
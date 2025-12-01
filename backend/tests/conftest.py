import pytest
from app import app as flask_app, db

@pytest.fixture
def app():
    # Configura la app para usar una base de datos en memoria
    flask_app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "SECRET_KEY": "test-secret-key"
    })

    with flask_app.app_context():
        db.create_all()     # Crea las tablas
        yield flask_app     # Ejecuta el test
        
        # --- LA CORRECCIÓN ESTÁ AQUÍ ---
        db.session.remove() # 1. Cierra la sesión y libera bloqueos
        db.drop_all()       # 2. Ahora sí, borra las tablas de forma segura

@pytest.fixture
def client(app):
    return app.test_client()
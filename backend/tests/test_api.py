# tests/test_api.py
import json

# --- Prueba 1: Acceso no autorizado ---
def test_get_products_unauthorized(client):
    """
    GIVEN un cliente de prueba de Flask
    WHEN se hace una petición GET a /api/products sin token
    THEN la respuesta debe ser un error 401 Unauthorized
    """
    response = client.get('/api/products')
    assert response.status_code == 401
    json_data = response.get_json()
    assert json_data['message'] == 'Token faltante' 

# --- Prueba 2: Registro nuevo usuario ---
def test_user_registration(client):
    """
    GIVEN un cliente de prueba de Flask
    WHEN se hace una petición POST a /api/register con datos de usuario nuevos
    THEN la respuesta debe ser 201 Created y un mensaje de éxito
    """
    new_user = {'username': 'testuser', 'password': 'password123'}
    response = client.post('/api/register', data=json.dumps(new_user), content_type='application/json')
    
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['message'] == 'Usuario registrado exitosamente'

# --- Prueba 3: Inicio de sesión ---
def test_user_login(client):
    """
    GIVEN un usuario ya registrado
    WHEN se hace una petición POST a /api/login con las credenciales correctas
    THEN la respuesta debe ser 200 OK y contener un token de autenticación
    """
    # Primero registrar un usuario 
    user = {'username': 'loginuser', 'password': 'password123'}
    client.post('/api/register', data=json.dumps(user), content_type='application/json')

    response = client.post('/api/login', data=json.dumps(user), content_type='application/json')
    
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'token' in json_data

# --- Prueba 4: Acceso autorizado a un endpoint protegido ---
def test_get_products_authorized(client):
    """
    GIVEN un usuario registrado y logueado (con un token)
    WHEN se hace una petición GET a /api/products con el token
    THEN la respuesta debe ser 200 OK
    """
    # Registrar y hacer login para obtener un token
    user = {'username': 'authuser', 'password': 'password123'}
    client.post('/api/register', data=json.dumps(user), content_type='application/json')
    login_response = client.post('/api/login', data=json.dumps(user), content_type='application/json')
    token = login_response.get_json()['token']

    # Hacer la petición a la ruta protegida con el token
    headers = {'Authorization': f'Bearer {token}'}
    response = client.get('/api/products', headers=headers)

    assert response.status_code == 200
    assert isinstance(response.get_json(), list) 

# --- Prueba 5: Verificación de aislamiento de datos entre usuarios ---
def test_data_isolation(client):
    """
    GIVEN dos usuarios diferentes, A y B
    WHEN el usuario A crea un producto
    THEN el usuario B no debe poder ver el producto del usuario A
    """
    # --- Setup Usuario A ---
    user_a = {'username': 'usera', 'password': 'password_a'}
    client.post('/api/register', data=json.dumps(user_a), content_type='application/json')
    login_a = client.post('/api/login', data=json.dumps(user_a), content_type='application/json')
    token_a = login_a.get_json()['token']
    headers_a = {'Authorization': f'Bearer {token_a}'}

    # --- Setup Usuario B ---
    user_b = {'username': 'userb', 'password': 'password_b'}
    client.post('/api/register', data=json.dumps(user_b), content_type='application/json')
    login_b = client.post('/api/login', data=json.dumps(user_b), content_type='application/json')
    token_b = login_b.get_json()['token']
    headers_b = {'Authorization': f'Bearer {token_b}'}

    # 1. Usuario A crea un producto
    product_a = {'name': 'Laptop de A', 'price': 1500}
    client.post('/api/products', data=json.dumps(product_a), content_type='application/json', headers=headers_a)

    # 2. Usuario B pide sus productos y no debería ver nada
    response_b = client.get('/api/products', headers=headers_b)
    assert response_b.status_code == 200
    assert len(response_b.get_json()) == 0 

    # 3. Usuario A pide sus productos y debería ver uno
    response_a = client.get('/api/products', headers=headers_a)
    assert response_a.status_code == 200
    assert len(response_a.get_json()) == 1
    assert response_a.get_json()[0]['name'] == 'Laptop de A'
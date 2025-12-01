import os
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from dotenv import load_dotenv
from functools import wraps
from urllib.parse import quote_plus

load_dotenv()
#test
app = Flask(__name__)
CORS(app)

# --- Configuración de la Base de Datos (MySQL) ---
DB_USER = os.getenv("MYSQL_USER")
DB_HOST = os.getenv("MYSQL_HOST")
DB_NAME = os.getenv("MYSQL_DATABASE")
DB_PASSWORD = quote_plus(os.getenv("MYSQL_PASSWORD"))

app.config["SQLALCHEMY_DATABASE_URI"] = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

db = SQLAlchemy(app)

# --- Modelos de la Base de Datos ---
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    products = db.relationship("Product", backref="owner", lazy=True)
    sales = db.relationship("Sale", backref="owner", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "price": self.price}

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    total = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    items = db.relationship("SaleItem", backref="sale", lazy=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "total": self.total,
            "created_at": self.created_at.isoformat(),
            "items": [item.to_dict() for item in self.items]
        }

class SaleItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey("sale.id"), nullable=False)
    product_name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "product_name": self.product_name,
            "quantity": self.quantity,
            "price": self.price
        }

# --- Decorador de Autenticacion ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            token = request.headers["Authorization"].split(" ")[1]
        if not token:
            return jsonify({"message": "Token faltante"}), 401
        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.get(data["user_id"])
        except:
            return jsonify({"message": "Token invalido"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- Rutas de Autenticacion ---
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"message": "Usuario ya existe"}), 409
    
    new_user = User(username=data["username"])
    new_user.set_password(data["password"])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Usuario registrado exitosamente"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data["username"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"message": "Credenciales Invalidas"}), 401
    
    token = jwt.encode({
        "user_id": user.id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }, app.config["SECRET_KEY"], algorithm="HS256")
    
    return jsonify({"token": token})

# --- Endpoints de Productos ---
@app.route("/api/products", methods=["GET"])
@token_required
def get_products(current_user):
    products = Product.query.filter_by(user_id=current_user.id).all()
    return jsonify([product.to_dict() for product in products])

@app.route("/api/products", methods=["POST"])
@token_required
def add_product(current_user):
    data = request.get_json()
    new_product = Product(name=data["name"], price=data["price"], user_id=current_user.id)
    db.session.add(new_product)
    db.session.commit()
    return jsonify(new_product.to_dict()), 201

@app.route("/api/products/<int:id>", methods=["DELETE"])
@token_required
def delete_product(current_user, id):
    product = Product.query.filter_by(id=id, user_id=current_user.id).first_or_404()
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200

# --- Endpoints de Ventas ---
@app.route("/api/sales", methods=["POST"])
@token_required
def create_sale(current_user):
    cart_items = request.get_json()
    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    total = sum(item["price"] * item["quantity"] for item in cart_items)
    new_sale = Sale(total=total, user_id=current_user.id)
    db.session.add(new_sale)
    db.session.flush()  

    for item in cart_items:
        sale_item = SaleItem(
            sale_id=new_sale.id,
            product_name=item["name"],
            quantity=item["quantity"],
            price=item["price"]
        )
        db.session.add(sale_item)
    
    db.session.commit()
    return jsonify(new_sale.to_dict()), 201

@app.route("/api/sales", methods=["GET"])
@token_required
def get_sales(current_user):
    sales = Sale.query.filter_by(user_id=current_user.id).order_by(Sale.created_at.desc()).all()
    return jsonify([sale.to_dict() for sale in sales])

# --- Inicialización de la BD ---
if __name__ == '__main__':
    # Mueve la creación de tablas DENTRO de este bloque
    with app.app_context():
        db.create_all()
        
    app.run(host="0.0.0.0", port=5000)

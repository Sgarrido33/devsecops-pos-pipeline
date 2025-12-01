import { useState, useEffect, useCallback } from 'react';
import './App.css';
import ConfirmationModal from './ConfirmationModal'; 
import './Modal.css';
import AlertModal from './AlertModal';

const API_URL_PRODUCTS = 'http://localhost:8080/api/products';
const API_URL_SALES = 'http://localhost:8080/api/sales';
const EPSILON = 0.01;

export function PosView({ token, onLogout }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const [modalState, setModalState] = useState({ isOpen: false });
  const [alertState, setAlertState] = useState({ isOpen: false, message: '' });

  // --- Funciones de API ---
  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(API_URL_PRODUCTS, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({ message: 'No se pudo leer el cuerpo del error.' }));
        console.error(`Error fetching products: ${response.status} ${response.statusText}`, errorDetails);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setProducts(await response.json());
    } catch (error) {
      console.error("La operación fetchProducts falló:", error);
      setAlertState({ isOpen: true, message: 'Error al cargar los productos.' });
    }
  }, [token]);

  const fetchSales = useCallback(async () => {
    try {
      const response = await fetch(API_URL_SALES, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Si la respuesta no es exitosa, obtenemos más detalles.
      if (!response.ok) {
        const errorDetails = await response.json().catch(() => ({ message: 'No se pudo leer el cuerpo del error.' }));
        console.error(`Error fetching sales: ${response.status} ${response.statusText}`, errorDetails);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setSales(await response.json());
    } catch (error) {
      // El console.error de arriba ya nos dará detalles más específicos.
      console.error("La operación fetchSales falló:", error);
      setAlertState({ isOpen: true, message: 'Error al cargar el historial de ventas.' });
    }
  }, [token]);

  
  // Carga inicial de productos e historial de ventas
  useEffect(() => {
    fetchProducts();
    fetchSales();
  }, [fetchProducts, fetchSales]);


  async function handleAddProduct(name, price) {
    const response = await fetch(API_URL_PRODUCTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, price }),
    });
    if (response.ok) fetchProducts();
  }

  async function handleDeleteProduct(id) {
    setModalState({
      isOpen: true,
      message: '¿Estás seguro de que quieres eliminar este producto?',
      onConfirm: async () => {
        const response = await fetch(`${API_URL_PRODUCTS}/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) fetchProducts();
        setModalState({ isOpen: false });
      },
    });
  }

  async function handleCheckout() {
    if (cart.length === 0) return;
    const totalSale = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setModalState({
      isOpen: true,
      message: `Total de la venta: $${totalSale.toFixed(2)}. Ingrese el monto pagado.`,
      showPaymentInput: true,
      onConfirm: async (value) => {
        const paid = parseFloat(value);

        if (isNaN(paid) || paid + EPSILON < totalSale) {
          setModalState({ isOpen: false });
          setAlertState({ isOpen: true, message: 'El monto pagado es inválido o insuficiente.' });
          return;
        }

        const change = paid - totalSale;
        setModalState({ isOpen: false });

        const response = await fetch(API_URL_SALES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(cart),
        });

        if (response.ok) {
          setAlertState({ isOpen: true, message: `Venta registrada con éxito. Cambio a dar: $${change.toFixed(2)}` });
          setCart([]);
          fetchSales();
          setPaymentAmount('');
        } else {
          setAlertState({ isOpen: true, message: 'Hubo un error al registrar la venta.' });
        }
      }
    });
  }



  // --- Lógica del Carrito ---
  function addToCart(product) { 
    setCart(currentCart => {
      const existing = currentCart.find(item => item.id === product.id);
      if (existing) {
        return currentCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

    function decreaseFromCart(product) {
    setCart(currentCart => {
      const existing = currentCart.find(item => item.id === product.id);
      if (existing.quantity === 1) {
        return currentCart.filter(item => item.id !== product.id);
      }
      return currentCart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }

  function removeFromCart(product) {
      setCart(currentCart => currentCart.filter(item => item.id !== product.id));
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="container" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: 0
      }}>
        <h1 style={{ marginBottom: 0 }}>Sistema POS</h1>
        <button onClick={onLogout} className="secondary outline">Cerrar Sesión</button>
      </header>


      <main className="container">

        <div>
          <ProductsPanel
            products={filteredProducts}
            onAddToCart={addToCart}
            onDeleteProduct={handleDeleteProduct}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
          <AddProductPanel onProductAdded={handleAddProduct} />
        </div>
        <div>
          <CartPanel
            cart={cart}
            total={total}
            onCheckout={handleCheckout}
            onIncrease={addToCart}
            onDecrease={decreaseFromCart}
            onRemove={removeFromCart}
          />
          <SalesHistoryPanel sales={sales} />
        </div>
      </main>
      
      <ConfirmationModal
        isOpen={modalState.isOpen}
        message={modalState.message}
        onConfirm={modalState.onConfirm}   
        onCancel={() => {
            setModalState({ isOpen: false });
        }}
        showPaymentInput={modalState.showPaymentInput}
        paymentAmount={paymentAmount}
        onPaymentChange={value => setPaymentAmount(value)}
      />
      
      <AlertModal
        isOpen={alertState.isOpen}
        message={alertState.message}
        onClose={() => setAlertState({ isOpen: false, message: '' })}
      />
    </>
  );
}

// --- Componentes ---

function ProductsPanel({ products, onAddToCart, onDeleteProduct, searchTerm, onSearchChange }) {
  return (
    <article>
      <header><h2>Productos</h2></header>

      <input
        type="search"
        placeholder="Buscar producto..."
        value={searchTerm}
        onChange={e => onSearchChange(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />

      <ul className="scrollable-list">
        {products.map(p => (
          <li key={p.id}>
            <span>{p.name} - ${p.price.toFixed(2)}</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => onAddToCart(p)}>Agregar</button>
              <button className="secondary" onClick={() => onDeleteProduct(p.id)}>Eliminar</button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}

function AddProductPanel({ onProductAdded }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const price = parseFloat(e.target.price.value);
    onProductAdded(name, price);
    e.target.reset();
  };
  return (
    <article>
      <header><h2>Agregar Nuevo Producto</h2></header>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" placeholder="Nombre" required />
        <input type="number" name="price" placeholder="Precio" step="0.01" required />
        <button type="submit">Guardar Producto</button>
      </form>
    </article>
  );
}

function CartPanel({ cart, total, onCheckout, onIncrease, onDecrease, onRemove }) {
  return (
    <article className="cart-panel">
      <header><h2>Carrito</h2></header>
      <div className="scrollable-list">
        <ul>
          {cart.map(item => (
            <li key={item.id}>
              <span>{item.name} (x{item.quantity})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <button onClick={() => onDecrease(item)} style={{ padding: '0 5px' }}>-</button>
                <button onClick={() => onIncrease(item)} style={{ padding: '0 5px' }}>+</button>
                <button onClick={() => onRemove(item)} className="secondary outline" style={{ padding: '0 5px' }}>x</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <hr />
      <h3>Total: ${total.toFixed(2)}</h3>
      <button onClick={onCheckout} disabled={cart.length === 0}>Finalizar Venta</button>
    </article>
  );
}

function SalesHistoryPanel({ sales }) {
    return (
      <article>
        <header><h2>Historial de Ventas</h2></header>
        {/* Aplicamos la clase para el scroll */}
        <div className="scrollable-list">
          {sales.map(sale => (
            <details key={sale.id}>
              <summary>
                Venta #{sale.id} - <strong>Total: ${sale.total.toFixed(2)}</strong>
                <br />
                <small>{new Date(sale.created_at).toLocaleString()}</small>
              </summary>
              <ul>
                {sale.items.map((item, index) => (
                  <li key={index}>{item.product_name} (x{item.quantity})</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </article>
    );
  }

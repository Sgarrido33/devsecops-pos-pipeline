import React, { useState } from 'react';

export function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const response = await fetch(`http://localhost:8080${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (response.ok) {
      if (isLogin) {
        onLogin(data.token);
      } else {
        alert('Registro exitoso! Ahora inicia sesión.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
      }
    } else {
      setError(data.message);
    }
  };

  return (
    <main className="container" style={{ display: 'block', maxWidth: '550px', margin: '3rem auto' }}>
      <article>
        <header>
          <hgroup>
            <h1>Sistema POS</h1>
            <h2>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h2>
          </hgroup>
        </header>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Usuario</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="nombre.apellido"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <label htmlFor="password">Contraseña</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="••••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p style={{ color: 'var(--pico-color-red-500)', marginBottom: '1rem' }}>{error}</p>}
          <button type="submit" style={{ width: '100%' }}>{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <footer>
          <a href="#" onClick={(e) => { 
            e.preventDefault(); 
            setIsLogin(!isLogin); 
            setError(''); 
            setUsername(''); 
            setPassword(''); 
          }}>
            {isLogin ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia sesión'}
          </a>
        </footer>
      </article>
    </main>
  );
}
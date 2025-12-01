import { useState } from 'react';
import './App.css';
import { AuthPage } from './AuthPage'; 
import { PosView } from './PosView';  

function App() {
  const [token, setToken] = useState(null);

  const handleLogout = () => {
    setToken(null); 
  };

  if (!token) {
    return <AuthPage onLogin={setToken} />;
  }

  return <PosView token={token} onLogout={handleLogout} />;
}

export default App;
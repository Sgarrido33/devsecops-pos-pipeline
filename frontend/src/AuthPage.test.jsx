import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthPage } from './AuthPage';

describe('AuthPage', () => {

  it('should render the login form by default', () => {
    render(<AuthPage />);
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
  });

  it('should switch to the register form when the link is clicked', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByText('¿No tienes una cuenta? Regístrate'));
    expect(screen.getByText('Registrarse')).toBeInTheDocument();
  });
  
  it('should call onLogin prop with token on successful login', async () => {
    const mockOnLogin = vi.fn();
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ token: 'fake-jwt-token' }),
      })
    );

    render(<AuthPage onLogin={mockOnLogin} />);

    fireEvent.change(screen.getByPlaceholderText('nombre.apellido'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••••'), { target: { value: 'password' } });

    fireEvent.click(screen.getByRole('button', { name: /Login/i }));

    await screen.findByText('Iniciar Sesión');
    expect(mockOnLogin).toHaveBeenCalledWith('fake-jwt-token');
  });
  
   it('should display an error message on failed login', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      })
    );
    
    render(<AuthPage onLogin={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('nombre.apellido'), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Login/i }));
    
    const errorMessage = await screen.findByText('Invalid credentials');
    expect(errorMessage).toBeInTheDocument();
  });
});
import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { toast } from 'sonner';

interface LoginViewProps {
  onLogin: (role: 'admin' | 'cajero') => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Credenciales de ejemplo (en producción validarías contra una base de datos)
    if (username === 'admin' && password === 'admin123') {
      onLogin('admin');
      toast.success('Bienvenido Administrador');
    } else if (username === 'cajero' && password === 'caja123') {
      onLogin('cajero');
      toast.success('Bienvenido Cajero');
    } else {
      toast.error('Credenciales incorrectas');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#121212] w-full min-h-screen">
      <div className="bg-[#1a1a1a] p-8 rounded-2xl w-full max-w-md border border-[#2a2a2a] shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#6B21A8] rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-3xl">LT</span>
          </div>
          <h1 className="text-white text-2xl font-bold">La Terraza Bebidas</h1>
          <p className="text-gray-400 mt-2">Iniciar Sesión</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-4 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white rounded-xl pl-12 pr-4 py-4 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl font-bold transition-all mt-4"
          >
            Ingresar
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-[#2a2a2a]">
          <p className="text-gray-500 text-sm text-center mb-4">Acceso rápido (Pruebas):</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('admin123'); }}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-2 rounded-lg text-sm transition-colors border border-[#333]"
            >
              Llenar Admin
            </button>
            <button
              type="button"
              onClick={() => { setUsername('cajero'); setPassword('caja123'); }}
              className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-2 rounded-lg text-sm transition-colors border border-[#333]"
            >
              Llenar Cajero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { UserPlus, Edit2, Trash2, Shield, User, X } from 'lucide-react';
import { toast } from 'sonner';

interface AppUser {
  id: string;
  name: string;
  username: string;
  password: string; // En un entorno real esto no se envía en texto plano
  role: 'admin' | 'cajero';
}

const MOCK_USERS: AppUser[] = [];

export function UsuariosView() {
  const [users, setUsers] = useState<AppUser[]>(MOCK_USERS);
  const [userModal, setUserModal] = useState<{isOpen: boolean, item: AppUser | null}>({isOpen: false, item: null});

  const startEdit = (user: AppUser) => {
    setUserModal({
      isOpen: true,
      item: user
    });
  };

  const handleAddUser = () => {
    setUserModal({
      isOpen: true,
      item: {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        username: '',
        password: '',
        role: 'cajero',
      }
    });
  };

  const handleSaveUser = () => {
    if (!userModal.item?.name || !userModal.item?.username || !userModal.item?.password) {
      toast.error('Todos los campos son obligatorios');
      return;
    }
    if (users.some(u => u.id === userModal.item!.id)) {
      setUsers(prev => prev.map(u => u.id === userModal.item!.id ? userModal.item! : u));
      toast.success('Usuario actualizado exitosamente');
    } else {
      setUsers([userModal.item!, ...users]);
      toast.success('Usuario creado exitosamente');
    }
    setUserModal({isOpen: false, item: null});
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuario eliminado');
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-400">Administra los accesos y roles del sistema</p>
        </div>
        <button onClick={handleAddUser} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
          <UserPlus size={20} />
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Nombre Completo</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Nombre de Usuario</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Contraseña</th>
                <th className="text-left text-gray-400 p-4 whitespace-nowrap">Rol</th>
                <th className="text-center text-gray-400 p-4 whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                return (
                  <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-white font-medium">{user.name}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-gray-400">{user.username}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-gray-400">••••••••</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1.5 w-fit ${user.role === 'admin' ? 'bg-[#6B21A8]/20 text-[#8B5CF6]' : 'bg-blue-500/20 text-blue-400'}`}>
                        {user.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                        {user.role === 'admin' ? 'Administrador' : 'Cajero'}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => startEdit(user)} className="text-gray-400 hover:text-white transition-colors p-2"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {userModal.isOpen && userModal.item && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-md border border-[#2a2a2a]">
            <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between">
              <h2 className="text-white text-2xl flex items-center gap-2">
                <User size={24} className="text-[#8B5CF6]" />
                {users.some(u => u.id === userModal.item!.id) ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button onClick={() => setUserModal({isOpen: false, item: null})} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre Completo</label>
                <input
                  type="text"
                  value={userModal.item.name}
                  onChange={(e) => setUserModal(prev => ({...prev, item: prev.item ? {...prev.item, name: e.target.value} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre de Usuario</label>
                <input
                  type="text"
                  value={userModal.item.username}
                  onChange={(e) => setUserModal(prev => ({...prev, item: prev.item ? {...prev.item, username: e.target.value.toLowerCase()} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                  placeholder="Usuario para login"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Contraseña</label>
                <input
                  type="text"
                  value={userModal.item.password}
                  onChange={(e) => setUserModal(prev => ({...prev, item: prev.item ? {...prev.item, password: e.target.value} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                  placeholder="Contraseña"
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Rol</label>
                <select
                  value={userModal.item.role}
                  onChange={(e) => setUserModal(prev => ({...prev, item: prev.item ? {...prev.item, role: e.target.value as 'admin' | 'cajero'} : null}))}
                  className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none transition-colors"
                >
                  <option value="admin">Administrador</option>
                  <option value="cajero">Cajero</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setUserModal({isOpen: false, item: null})} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">
                Cancelar
              </button>
              <button onClick={handleSaveUser} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] text-white py-4 rounded-xl transition-all">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
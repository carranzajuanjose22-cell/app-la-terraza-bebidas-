import { useState, useEffect } from "react";
import { UserPlus, Edit2, Trash2, Shield, User, X } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api.js";
import { Loader } from "./Loader.jsx";

export function UsuariosView() {
  const [users, setUsers] = useState([]);
  const [userModal, setUserModal] = useState({ isOpen: false, item: null, isNew: false });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data);
    } catch { toast.error("Error al cargar usuarios"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = () => {
    setUserModal({ isOpen: true, item: { name: "", email: "", password: "", role: "cajero" }, isNew: true });
  };

  const handleSaveUser = async () => {
    const { item, isNew } = userModal;
    if (!item?.name || !item?.email || (isNew && !item?.password)) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      if (isNew) {
        await api.post("/auth/register", item);
        toast.success("Usuario creado exitosamente");
      } else {
        const payload = { name: item.name, role: item.role };
        if (item.password) payload.password = item.password;
        await api.put(`/users/${item.id}`, payload);
        toast.success("Usuario actualizado exitosamente");
      }
      setUserModal({ isOpen: false, item: null, isNew: false });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario?")) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("Usuario eliminado");
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto relative">
      {loading && <Loader />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-white text-4xl mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-400">Administrá los accesos y roles del sistema</p>
        </div>
        <button onClick={handleAddUser} className="bg-[#6B21A8] hover:bg-[#581C87] text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all">
          <UserPlus size={20} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left text-gray-400 p-4">Nombre</th>
                <th className="text-left text-gray-400 p-4">Email</th>
                <th className="text-left text-gray-400 p-4">Rol</th>
                <th className="text-center text-gray-400 p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors">
                  <td className="p-4"><span className="text-white font-medium">{user.name}</span></td>
                  <td className="p-4"><span className="text-gray-400">{user.email}</span></td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm flex items-center gap-1.5 w-fit ${user.role === "admin" ? "bg-[#6B21A8]/20 text-[#8B5CF6]" : "bg-blue-500/20 text-blue-400"}`}>
                      {user.role === "admin" ? <Shield size={14} /> : <User size={14} />}
                      {user.role === "admin" ? "Administrador" : "Cajero"}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => setUserModal({ isOpen: true, item: { ...user, password: "" }, isNew: false })} className="text-gray-400 hover:text-white transition-colors p-2"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay usuarios</td></tr>
              )}
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
                {userModal.isNew ? "Nuevo Usuario" : "Editar Usuario"}
              </h2>
              <button onClick={() => setUserModal({ isOpen: false, item: null, isNew: false })} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-2">Nombre Completo</label>
                <input type="text" value={userModal.item.name} onChange={(e) => setUserModal((prev) => ({ ...prev, item: { ...prev.item, name: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none" placeholder="Ej. Juan Pérez" />
              </div>
              {userModal.isNew && (
                <div>
                  <label className="text-gray-400 text-sm block mb-2">Email</label>
                  <input type="email" value={userModal.item.email} onChange={(e) => setUserModal((prev) => ({ ...prev, item: { ...prev.item, email: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none" placeholder="usuario@terraza.com" />
                </div>
              )}
              <div>
                <label className="text-gray-400 text-sm block mb-2">{userModal.isNew ? "Contraseña" : "Nueva contraseña (opcional)"}</label>
                <input type="password" value={userModal.item.password} onChange={(e) => setUserModal((prev) => ({ ...prev, item: { ...prev.item, password: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none" placeholder={userModal.isNew ? "Contraseña" : "Dejar vacío para no cambiar"} />
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Rol</label>
                <select value={userModal.item.role} onChange={(e) => setUserModal((prev) => ({ ...prev, item: { ...prev.item, role: e.target.value } }))} className="w-full bg-[#2a2a2a] text-white rounded-xl px-4 py-3 border border-[#333] focus:border-[#6B21A8] outline-none">
                  <option value="admin">Administrador</option>
                  <option value="cajero">Cajero</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex gap-4">
              <button onClick={() => setUserModal({ isOpen: false, item: null, isNew: false })} className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white py-4 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSaveUser} disabled={submitting} className="flex-1 bg-[#6B21A8] hover:bg-[#581C87] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl transition-all">{submitting ? "Guardando..." : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

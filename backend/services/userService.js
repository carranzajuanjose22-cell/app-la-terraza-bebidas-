import bcrypt from "bcryptjs";
import { eq, ne } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../models/schema.js";

export async function getAllUsers() {
  // El rol "creator" es interno y no debe aparecer en el panel de administración
  return db.select({
    id: users.id, name: users.name, email: users.email,
    role: users.role, isActive: users.isActive, createdAt: users.createdAt,
  }).from(users).where(ne(users.role, "creator"));
}

export async function getUserById(id) {
  const [user] = await db.select({
    id: users.id, name: users.name, email: users.email,
    role: users.role, isActive: users.isActive, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

export async function updateUser(id, data) {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  data.updatedAt = new Date().toISOString();
  const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
  if (!updated) throw new Error("Usuario no encontrado");
  const { password: _, ...safe } = updated;
  return safe;
}

export async function toggleUserActive(id) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!user) throw new Error("Usuario no encontrado");
  const [updated] = await db
    .update(users)
    .set({ isActive: !user.isActive, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id))
    .returning();
  const { password: _, ...safe } = updated;
  return safe;
}

export async function deleteUser(id) {
  const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();
  if (!deleted) throw new Error("Usuario no encontrado");
  return { message: "Usuario eliminado" };
}

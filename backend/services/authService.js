import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../models/schema.js";

export async function loginUser(email, password) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error("Credenciales inválidas");
  if (!user.isActive) throw new Error("Usuario desactivado");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Credenciales inválidas");

  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const { password: _, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
}

export async function registerUser(data) {
  const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existing.length > 0) throw new Error("El email ya está registrado");

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const [newUser] = await db
    .insert(users)
    .values({ ...data, password: hashedPassword })
    .returning();

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

export async function getProfile(userId) {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new Error("Usuario no encontrado");
  return user;
}

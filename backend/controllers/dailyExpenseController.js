import { db } from "../db/index.js";
import { dailyExpenses, cashRegisters, users } from "../models/schema.js";
import { eq, desc } from "drizzle-orm";

export const createDailyExpense = async (req, res) => {
  try {
    const { reason, amount, method } = req.body;
    
    let userId = req.user?.id;
    if (!userId) {
      const [firstUser] = await db.select().from(users).limit(1);
      userId = firstUser?.id || null;
    }

    const [openRegister] = await db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.status, "open"))
      .limit(1);

    if (!openRegister) {
      return res.status(400).json({ message: "No hay una caja abierta para registrar el gasto" });
    }

    const [newExpense] = await db
      .insert(dailyExpenses)
      .values({ cashRegisterId: openRegister.id, userId, reason, amount, method })
      .returning();

    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDailyExpenses = async (req, res) => {
  try {
    const expenses = await db.select().from(dailyExpenses).orderBy(desc(dailyExpenses.createdAt));
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
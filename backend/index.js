import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";
import fixedExpenseRoutes from "./routes/fixedExpenseRoutes.js";
import cashRegisterRoutes from "./routes/cashRegisterRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/payment-methods", paymentMethodRoutes);
app.use("/api/fixed-expenses", fixedExpenseRoutes);
app.use("/api/cash-register", cashRegisterRoutes);
app.use("/api/transactions", transactionRoutes);

app.use((req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Error interno del servidor" });
});

app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));

# La Terraza Bebidas 🍹

Aplicación de gestión para terraza de bebidas. Backend con Express + Drizzle ORM + Turso. Frontend con React + Vite.

## Estructura

```
app-la-terraza-bebidas-/
├── backend/
│   ├── controllers/      # Lógica HTTP de cada recurso
│   ├── services/         # Lógica de negocio
│   ├── models/           # Esquema Drizzle (schema.js)
│   ├── routes/           # Rutas Express
│   ├── middleware/       # auth.js (JWT)
│   ├── db/               # Conexión Turso + migrate.js
│   ├── index.js          # Servidor Express
│   ├── drizzle.config.js
│   └── .env              # Variables de entorno (completar)
└── frontend/
    ├── src/
    │   ├── components/   # Layout
    │   ├── context/      # AuthContext
    │   ├── pages/        # Páginas JSX
    │   ├── services/     # api.js (axios)
    │   ├── App.jsx
    │   └── main.jsx
    └── vite.config.js
```

## Entidades de base de datos

| Tabla          | Descripción                              |
|----------------|------------------------------------------|
| `users`        | Personal del local (admin, mozo, bartender) |
| `categories`   | Categorías de bebidas                    |
| `products`     | Bebidas/productos con precio y stock     |
| `tables`       | Mesas físicas del local                  |
| `orders`       | Pedidos por mesa o sin mesa              |
| `order_items`  | Ítems de cada pedido                     |
| `payments`     | Pagos (efectivo, tarjeta, QR, etc.)      |

## Configuración

### 1. Backend

```bash
cd backend
npm install
```

Editar `backend/.env` con tus credenciales de Turso y clave JWT:

```env
TURSO_DATABASE_URL=libsql://tu-base.turso.io
TURSO_AUTH_TOKEN=tu-token-de-turso
JWT_SECRET=una-clave-secreta-muy-larga
```

Generar y ejecutar migraciones:

```bash
npm run db:generate
npm run db:migrate
```

Iniciar servidor:

```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Endpoints principales

| Método | Ruta                        | Descripción                     |
|--------|-----------------------------|---------------------------------|
| POST   | /api/auth/login             | Inicio de sesión                |
| GET    | /api/auth/profile           | Perfil del usuario autenticado  |
| GET    | /api/categories             | Listar categorías               |
| GET    | /api/products               | Listar productos/bebidas        |
| GET    | /api/tables                 | Listar mesas                    |
| GET    | /api/orders                 | Listar pedidos                  |
| POST   | /api/orders                 | Crear pedido                    |
| PATCH  | /api/orders/:id/status      | Cambiar estado del pedido       |
| POST   | /api/payments               | Registrar pago                  |

## Roles

- **admin**: acceso total
- **mozo**: crear y gestionar pedidos, cambiar estado de mesas
- **bartender**: ver pedidos, actualizar stock

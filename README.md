# Mis Finanzas

App web de finanzas personales. Backend en Go (Gin + GORM + SQLite), frontend en React + Vite.

## Correr localmente

### Backend
```bash
cd backend
go run main.go
# Corre en http://localhost:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Abre http://localhost:5173
```

Crear un archivo `frontend/.env` con:
```
VITE_API_URL=http://localhost:8080/api
```

---

## Deploy gratuito

### Backend → Railway

1. Crear cuenta en [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo → seleccionar este repositorio
3. Configurar el **Root Directory** como `backend`
4. Railway detecta el Dockerfile automáticamente
5. Copiar la URL pública generada (ej: `https://mis-finanzas-api.up.railway.app`)

### Frontend → Vercel

1. Crear cuenta en [vercel.com](https://vercel.com)
2. New Project → importar el repositorio
3. Configurar:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
4. Agregar variable de entorno:
   - `VITE_API_URL` = URL de Railway + `/api`  
     Ej: `https://mis-finanzas-api.up.railway.app/api`
5. Deploy

---

## Estructura

```
mis-finanzas/
├── backend/
│   ├── main.go
│   ├── go.mod / go.sum
│   ├── Dockerfile
│   ├── handlers/        # transactions, budgets, goals, debts
│   ├── models/          # structs GORM
│   └── db/              # init SQLite
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── components/  # Dashboard, Transacciones, Presupuesto, Ahorros, Deudas
    └── vite.config.js
```

# ExecuTrain API

Backend API (Express + PostgreSQL/Prisma) untuk ExecuTrain — di-recreate dari project original.

## Tech Stack

- **Express** (Node.js)
- **PostgreSQL** (via **Prisma 7** ORM + `@prisma/adapter-pg`)
- **JSON Web Token** (access token di `Authorization: Bearer`, refresh token di httpOnly cookie)
- **bcrypt** untuk hash password

## Struktur

```
api/
├── server.js                     # Entry point Express
├── prisma/
│   ├── schema.prisma             # Prisma schema (di-pull dari DB server)
│   └── migrations/               # (opsional)
└── src/
    ├── config/
    │   ├── var.js                # Baca .env
    │   ├── prisma.js             # Prisma client singleton (+ alias _id)
    │   └── enum.js               # Enum ROLE, RefreshToken
    ├── lib/
    │   ├── crypt.js              # bcrypt helper
    │   └── jwt.js                # JWT create/verify
    ├── middleware/privilege.js   # islogin (Bearer token check)
    ├── scripts/                  # Utility script Prisma dev
    └── routes-v2/
        ├── index.js              # Mount semua modul
        ├── health/               # Health check
        └── auth/                 # Login, genesis, me, refresh, dsb.
            ├── index.js          # Route definitions
            ├── controller.js     # Business logic
            └── repository.js     # Query DB (Prisma)
```

> Modul lain (product, schedule, article, dst.) akan ditambahkan bertahap mengikuti pola yang sama: repository → controller → index.

## Setup

1. **Salin env**
   ```bash
   cp .env.example .env
   ```
   Isi `DATABASE_URL` / `DATABASE_URL_DEV` dan secret JWT serta `GENESIS_PASSWORD`.

2. **Install**
   ```bash
   npm install
   ```

3. **Pull schema dari server** (sync dengan DB yang sudah ada)
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

4. **Jalankan**
   ```bash
   npm run dev        # development (nodemon)
   npm start          # production
   ```

## Auth Flow

| Method | Endpoint           | Auth  | Deskripsi                          |
|--------|--------------------|-------|-------------------------------------|
| POST   | `/api/v2/auth/genesis` | -  | Buat user SUPERADMIN pertama (hanya jika user kosong) |
| POST   | `/api/v2/auth/login`   | -  | Login → access_token                |
| GET    | `/api/v2/auth/me`      | Bearer | Profil user saat ini              |
| GET    | `/api/v2/auth/refresh` | Bearer | Refresh access token (via cookie)   |
| GET    | `/api/v2/auth/list`    | Bearer | Daftar user (pencarian `?search=`)  |
| POST   | `/api/v2/auth/register`| Bearer | Buat user baru (ADMIN)              |
| PUT    | `/api/v2/auth/adjust/:id` | Bearer | Update user                      |
| DELETE | `/api/v2/auth/takedown/:id` | Bearer | Hapus user                      |

**Login response** (flat user object + token):
```json
{
  "status": 200,
  "message": "success",
  "id": "...",
  "username": "...",
  "display_name": "...",
  "role": "ADMIN",
  "access_token": "<JWT>"
}
```

Semua modul selain `health`, `login`, `genesis` dilindungi middleware `islogin`.
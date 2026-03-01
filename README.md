# 🏗️ Tower of Dreams

> Construye la torre más alta del mundo — juntos.

Una app gamificada donde una comunidad global construye colectivamente una torre virtual de **1,000,000 pisos**. Cada piso = $1 USD. Torre visible en tiempo real para todos.

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Expo (React Native + Web) |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Pagos | Stripe |
| Estado | Zustand |
| Animaciones | Lottie + React Native Reanimated |
| Deploy | Vercel (web) + EAS (mobile) |

## 📁 Estructura del Proyecto

```
tower-of-dreams/
├── app/                    # Pantallas (Expo Router)
│   ├── (tabs)/            # Tab navigator principal
│   │   ├── tower.tsx      # Pantalla de la torre
│   │   ├── shop.tsx       # Tienda de monedas
│   │   ├── rankings.tsx   # Rankings globales
│   │   ├── chat.tsx       # Chat (Fase 2)
│   │   └── profile.tsx    # Perfil de usuario
│   ├── auth/              # Login + Registro
│   └── floor/             # Detalle y construcción de piso
├── components/
│   ├── ui/                # Design system (Button, Card, etc.)
│   ├── tower/             # Componentes de la torre
│   ├── animations/        # Animaciones Lottie
│   └── chat/              # Componentes de chat
├── lib/
│   ├── supabase.ts        # Cliente Supabase
│   └── store.ts           # Zustand stores (Auth, Tower, Wallet)
├── constants/
│   └── game.ts            # Biomas, tiers, paquetes, colores
├── types/
│   └── index.ts           # TypeScript types
├── supabase/
│   └── migrations/        # Schema SQL
└── assets/                # Imágenes, Lottie, sonidos
```

## 🛠️ Setup

```bash
# Clonar
git clone https://github.com/diplez/tower-of-dreams.git
cd tower-of-dreams

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus keys de Supabase

# Ejecutar schema en Supabase SQL Editor
# → supabase/migrations/001_initial_schema.sql

# Iniciar
npm run web      # Web
npm run ios      # iOS
npm run android  # Android
```

## 📋 Progreso del MVP

- [x] **Semana 1** — Setup: Expo + Supabase + Schema SQL
- [x] **Semana 2** — Auth + Layout + Tabs + Dark Mode + UI Components
- [ ] **Semana 3** — Torre visual + HUD + Scroll virtualizado
- [ ] **Semana 4** — Stripe + Tienda + Monedero
- [ ] **Semana 5** — Core Loop: Construir pisos + Realtime
- [ ] **Semana 6** — Rankings + Perfil + Detalle de piso
- [ ] **Semana 7** — Animaciones + Visual bioma
- [ ] **Semana 8** — Testing + Polish + Deploy 🚀

## 📄 Licencia

Private — © 2026 Tower of Dreams

# Setup — Supabase + Edge Functions

Pasos para configurar el backend de Tower of Dreams desde cero.

---

## 1. Variables de entorno

Copiar `.env.example` a `.env` y llenar las 3 variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

| Variable | Dónde obtenerla |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → `anon public` key |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys → Publishable key |

> La Stripe **secret key** (`sk_...`) NO va en `.env` — se configura como variable de entorno en las Edge Functions (ver paso 4).

---

## 2. Instalar Supabase CLI

```bash
npm install supabase --save-dev
```

Verificar instalación:

```bash
npx supabase --version
```

---

## 3. Login y vincular proyecto

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
```

El `project-ref` está en **Supabase Dashboard → Settings → General → Reference ID**.

---

## 4. Desplegar Edge Functions

```bash
npx supabase functions deploy confirm-payment create-payment-intent stripe-webhook
```

Las 3 functions del proyecto:

| Function | Descripción |
|---|---|
| `create-payment-intent` | Crea un PaymentIntent en Stripe al iniciar una compra |
| `confirm-payment` | Confirma el pago y acredita coins en la wallet |
| `stripe-webhook` | Recibe eventos de Stripe (pagos completados, etc.) |

Revisar el deploy en: `https://supabase.com/dashboard/project/<project-ref>/functions`

### Variables de entorno de las Functions

Configurar en **Supabase Dashboard → Edge Functions → Manage secrets**:

| Secret | Valor |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` o `sk_live_...` |

---

## 5. Aplicar schema de base de datos

Si es un proyecto Supabase nuevo, ejecutar el migration en el SQL Editor:

```
supabase/migrations/001_initial_schema.sql
```

O via CLI:

```bash
npx supabase db push
```

---

## Comandos útiles

```bash
npx supabase functions deploy <nombre>   # redesplegar una function
npx supabase functions list              # listar functions desplegadas
npx supabase db push                     # aplicar migraciones pendientes
npx supabase status                      # ver estado del proyecto vinculado
```

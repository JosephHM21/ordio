# Ordio — Setup Guide

## 1. Crear proyecto en Supabase

1. Ve a supabase.com → "New project"
2. Nombre: `ordio` → Guardar contraseña
3. En SQL Editor, ejecuta el archivo: `supabase/migrations/001_initial.sql`

## 2. Configurar Auth en Supabase

1. Authentication → Providers → Email: activado
2. Authentication → URL Configuration:
   - Site URL: `https://tu-app.vercel.app`

## 3. Crear usuario admin de Baggo's

1. Authentication → Users → Add user
2. Email: tu correo / Contraseña: la que quieras
3. Copia el UID que aparece
4. En SQL Editor ejecuta (reemplaza el UID y el email):

```sql
INSERT INTO public.usuarios (id, restaurante_id, nombre, email, role)
VALUES (
  'TU_UID_AQUI',
  (SELECT id FROM public.restaurantes WHERE slug = 'baggos'),
  'Joseph',
  'tu@email.com',
  'admin'
);
```

## 4. Agregar categorías de Baggo's

En SQL Editor:
```sql
WITH r AS (SELECT id FROM restaurantes WHERE slug = 'baggos')
INSERT INTO public.categorias (restaurante_id, nombre, orden)
SELECT r.id, nombre, orden FROM r, (VALUES
  ('Hamburguesas', 1), ('Hot Dogs', 2), ('Alitas', 3),
  ('Boneless', 4), ('Papas', 5), ('Bebidas', 6)
) AS c(nombre, orden);
```

## 5. Agregar productos de Baggo's

Puedes agregar los productos desde el Panel Admin (/admin/productos)
o directamente en SQL. Cada producto necesita:
- nombre, descripcion, precio, tiempo_prep
- categoria_id (de la tabla categorias)
- ingredientes (array de texto)
- tiene_sabores (true para alitas y boneless)

## 6. Variables de entorno

Crea un archivo `.env.local` con:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Los encuentras en: Supabase → Project Settings → API

## 7. Deploy en Vercel

1. Sube el proyecto a GitHub
2. Ve a vercel.com → "Add new project"
3. Importa el repositorio
4. En "Environment Variables" agrega las dos variables
5. Deploy

## 8. URLs del sistema

- Menú de Baggo's: `tu-app.vercel.app/baggos`
- Panel admin: `tu-app.vercel.app/admin`
- Login: `tu-app.vercel.app/login`
- Estatus de pedido: `tu-app.vercel.app/baggos/pedido/[id]`

## 9. Desarrollo local

```bash
npm install
npm run dev
```

Abre http://localhost:3000/baggos

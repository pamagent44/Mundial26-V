# Mundial 2026 - Dashboard de la Porra

Dashboard para gestionar la porra del Mundial 2026 con sistema de puntuación, ranking de usuarios y predicciones por fases.

## Stack Tecnológico
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Icons**: Lucide React

## Variables de Entorno
Crear archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_SUPABASE_URL=https://dxuyhlgawgowrwrusskr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Base de Datos (Supabase)

### Tablas necesarias:
1. **users** - Almacena usuarios y contraseñas
2. **matches** - Almacena partidos del Mundial
3. **predictions** - Almacena predicciones de usuarios
4. **rankings** - Almacena puntuaciones

### Estructura SQL (ya creadas en Supabase):
```sql
CREATE TABLE users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  must_change_password BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  points INTEGER DEFAULT 0
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  match_date TIMESTAMP NOT NULL,
  phase TEXT NOT NULL,
  group_name TEXT,
  status TEXT DEFAULT 'upcoming'
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  match_id UUID NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(username),
  FOREIGN KEY (match_id) REFERENCES matches(id)
);

CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  total_points INTEGER DEFAULT 0,
  predictions_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(username)
);
```

## Scripts Disponibles

```bash
# Instalación de dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview
```

## Funcionalidades

### Sistema de Puntuación
- **5 pts**: Resultado exacto (1X2)
- **2 pts**: Resultado cercano (1 posición)
- **3 pts**: Goles exactos de equipo
- **1 pt**: Goles cercanos (1 de diferencia)

### Multiplicadores por Fase
- Fase de Grupos: x1
- Octavos: x2
- Cuartos: x3
- Semifinal: x4
- Final: x5

### Roles
- **Admin**: Crea usuarios, ve ranking completo, gestiona predicciones
- **Usuario**: Hace predicciones, ve su ranking

## Despliegue

### GitHub + Vercel (Recomendado)
1. Subir código a GitHub
2. Conectar con Vercel
3. Configurar variables de entorno en Vercel
4. Deploy automático en cada push

### Credenciales Admin
- Usuario: `admin`
- Contraseña: `admin123`

## Autor
Desarrollado con Next.js 14 y Supabase
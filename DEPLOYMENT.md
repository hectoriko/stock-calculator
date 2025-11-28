# Netlify Deployment Guide

## Configuración Actual

Tu aplicación ahora está configurada para funcionar tanto en **desarrollo local** como en **producción (Netlify)**.

### Archivos Creados/Modificados

1. **`netlify.toml`**: Configuración de Netlify que redirige las llamadas `/api/*` a las funciones serverless
2. **`netlify/functions/notes.js`**: Función serverless que maneja todos los endpoints de la API
3. **`config.js`**: Actualizado para detectar automáticamente el entorno y usar la URL correcta

## Cómo Funciona

### En Desarrollo Local

- Ejecutas `node server.js`
- El frontend hace llamadas a `http://localhost:3000/api/notes`
- El servidor Express maneja las peticiones

### En Producción (Netlify)

- No ejecutas ningún servidor
- El frontend hace llamadas a `/api/notes` (URL relativa)
- Netlify redirige automáticamente a `/.netlify/functions/notes`
- La función serverless maneja las peticiones

## Pasos para Desplegar en Netlify

### 1. Preparar el Proyecto

Asegúrate de tener un archivo `.gitignore`:

```
node_modules/
.env
.DS_Store
```

### 2. Variables de Entorno en Netlify

En el dashboard de Netlify:

1. Ve a **Site settings** → **Environment variables**
2. Añade: `MONGODB_URI` con tu connection string de MongoDB

### 3. Desplegar

**Opción A: Desde Git (Recomendado)**

1. Sube tu código a GitHub/GitLab/Bitbucket
2. Conecta el repositorio en Netlify
3. Netlify desplegará automáticamente

**Opción B: Deploy Manual**

1. Instala Netlify CLI: `npm install -g netlify-cli`
2. En tu proyecto: `netlify deploy --prod`

## Comandos Útiles

```bash
# Desarrollo local
node server.js

# Probar funciones Netlify localmente
netlify dev

# Deploy a producción
netlify deploy --prod
```

## Notas Importantes

- **MongoDB**: Asegúrate de que tu MongoDB Atlas permita conexiones desde cualquier IP (0.0.0.0/0) o añade las IPs de Netlify
- **CORS**: Ya está configurado en la función serverless
- **Variables de entorno**: Nunca subas el archivo `.env` a Git

## Alternativa: Vercel o Railway

Si prefieres no usar Netlify Functions, puedes:

- **Vercel**: Similar a Netlify, también soporta funciones serverless
- **Railway/Render**: Permiten ejecutar el servidor Node.js completo sin modificaciones

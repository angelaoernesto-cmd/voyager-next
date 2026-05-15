# 📱 Voyager AI — Guía de instalación en Android
## Con Google Gemini (GRATIS, sin tarjeta de crédito)

---

## 🗺 Resumen del proceso (15 minutos)

```
1. Clave Gemini (gratis)  →  2. GitHub  →  3. Vercel  →  4. Instalar en Android
        2 min                    5 min         5 min            1 min
```

---

## ✅ PASO 1 — Consigue tu clave de Gemini (completamente gratis)

1. Abre **[aistudio.google.com](https://aistudio.google.com)** en tu ordenador
2. Pulsa **"Sign in"** → usa tu cuenta de Google (Gmail)
3. Acepta los términos si te los pide
4. Pulsa el botón azul **"Get API key"** (arriba a la izquierda)
5. Pulsa **"Create API key"**
6. Selecciona **"Create API key in new project"**
7. Aparece tu clave: empieza por **`AIzaSy...`**
8. Pulsa el icono de copiar 📋 y guárdala en el bloc de notas

> ✅ **Gratis para siempre:** Gemini 1.5 Flash permite 1.500 peticiones/día sin coste.
> No necesitas tarjeta de crédito.

---

## ✅ PASO 2 — Sube el código a GitHub

### 2a. Crea una cuenta en GitHub (si no tienes)

1. Ve a **[github.com](https://github.com)**
2. Pulsa **"Sign up"**
3. Introduce tu email, crea una contraseña y un nombre de usuario
4. Verifica tu email

### 2b. Crea el repositorio y sube los archivos

1. Inicia sesión en GitHub
2. Pulsa el **"+"** arriba a la derecha → **"New repository"**
3. Rellena así:
   - **Repository name:** `voyager-ai`
   - **Visibility:** Public (o Private, ambas funcionan)
   - Deja todo lo demás por defecto
4. Pulsa **"Create repository"**
5. En la página que aparece, pulsa **"uploading an existing file"**

   > Si no ves ese enlace, busca el texto que dice *"...or upload files"*

6. Descomprime el ZIP que descargaste de Claude
7. **Arrastra toda la carpeta `voyager-next`** al área punteada de GitHub
   - GitHub subirá todos los archivos automáticamente
8. Escribe en el campo de abajo: **`Primera versión de Voyager`**
9. Pulsa **"Commit changes"**

✅ Ya tienes el código en GitHub.

---

## ✅ PASO 3 — Despliega en Vercel

### 3a. Crea cuenta en Vercel

1. Ve a **[vercel.com](https://vercel.com)**
2. Pulsa **"Sign Up"**
3. Elige **"Continue with GitHub"** — autoriza el acceso
4. Vercel te mostrará tu panel de control

### 3b. Importa tu proyecto

1. Pulsa **"Add New..."** → **"Project"**
2. Verás tu repositorio `voyager-ai` en la lista
3. Pulsa **"Import"** a su derecha
4. En la pantalla de configuración:
   - **Framework Preset:** Vercel detectará **Next.js** automáticamente ✅
   - No cambies nada más
5. Pulsa **"Deploy"**
6. Espera 2-3 minutos ⏳ (verás logs en pantalla)
7. Cuando aparezca 🎉 **"Congratulations!"** → tu app está online

### 3c. Añade tu clave de Gemini (MUY IMPORTANTE)

Sin este paso, la IA no funcionará.

1. En tu proyecto de Vercel, ve a la pestaña **"Settings"**
2. En el menú izquierdo, pulsa **"Environment Variables"**
3. Rellena así:

   | Campo | Valor |
   |-------|-------|
   | **Key** | `GEMINI_API_KEY` |
   | **Value** | `AIzaSyXXXXXXXX` (tu clave de Gemini) |

4. Marca los tres entornos: ✅ Production  ✅ Preview  ✅ Development
5. Pulsa **"Save"**

### 3d. Vuelve a desplegar

1. Ve a la pestaña **"Deployments"**
2. Pulsa los **tres puntos** (⋮) del deployment más reciente
3. Pulsa **"Redeploy"** → confirma
4. Espera ~2 minutos

✅ Tu URL ya está activa. Aparece en el panel: algo como `https://voyager-ai-xxxxx.vercel.app`

**Prueba que funciona:** abre esa URL en el navegador → debería aparecer la pantalla de "voyager" con el botón "+ nuevo itinerario".

---

## ✅ PASO 4 — Instalar en tu móvil Android

Esto convierte la web en una app real con icono en tu pantalla de inicio.

### Método A — Chrome (recomendado)

1. Abre **Google Chrome** en tu Android
2. Escribe la URL de tu Vercel: `https://voyager-ai-xxxxx.vercel.app`
3. Espera a que cargue completamente la app (que aparezca la pantalla negra con "voyager")
4. Mira abajo — aparecerá un banner:
   **"Añadir Voyager a la pantalla de inicio"**  → pulsa **"Instalar"**

   **Si no aparece el banner:**
   - Pulsa los **tres puntos** ⋮ (arriba a la derecha)
   - Busca **"Instalar app"** o **"Añadir a pantalla de inicio"**
   - Si tampoco aparece: menú ⋮ → "Más herramientas" → "Crear acceso directo"

5. Confirma el nombre **"Voyager"** → pulsa **"Añadir"**

6. El icono aparece en tu pantalla de inicio 🎉

### Método B — Samsung Internet

1. Abre **Samsung Internet**
2. Ve a tu URL de Vercel
3. Pulsa el icono de menú (☰ abajo)
4. **"Añadir página a"** → **"Pantalla de inicio"**

---

## ✅ PASO 5 — Comprueba que todo funciona

1. Abre **Voyager** desde el icono de tu pantalla de inicio
2. Se abre en pantalla completa (sin barra de URL) ✅
3. Pulsa **"+ nuevo itinerario"**
4. Escribe **"Colombia"** y espera un momento
5. Aparecen sugerencias de ciudades generadas por Gemini ✅

---

## 📋 Checklist completo

- [ ] Clave Gemini copiada (`AIzaSy...`) y guardada
- [ ] Repositorio `voyager-ai` creado en GitHub con todos los archivos
- [ ] Proyecto desplegado en Vercel sin errores
- [ ] Variable `GEMINI_API_KEY` añadida en Vercel y Redeploy hecho
- [ ] URL de Vercel funciona en el navegador
- [ ] App instalada en Android (icono en pantalla de inicio)
- [ ] Prueba de creación de viaje con IA ✅

---

## ❓ Problemas frecuentes

### "Error 500" o "GEMINI_API_KEY not configured"
→ No has añadido la variable de entorno, o no has hecho Redeploy después.
→ Vercel → Settings → Environment Variables → verifica que el nombre sea exactamente `GEMINI_API_KEY`.

### "La IA no responde o da error"
→ Comprueba que tu clave de Gemini es correcta (empieza por `AIzaSy`).
→ Verifica en aistudio.google.com que la clave esté activa.

### "Vercel da error al desplegar"
→ Asegúrate de que has subido TODOS los archivos de la carpeta `voyager-next`, incluyendo `pages/`, `public/`, `styles/`, `package.json`, `next.config.js`.
→ En Vercel → tu proyecto → Deployments → pulsa en el deploy fallido → mira los logs de error.

### "No aparece la opción de instalar en Chrome"
→ La URL debe ser HTTPS (Vercel siempre lo es ✅).
→ Prueba a recargar la página y esperar 10 segundos.
→ Asegúrate de que Chrome está actualizado: Play Store → Chrome → Actualizar.

### "Se borra todo al limpiar caché"
→ Los viajes se guardan en localStorage. Para protegerlos, en Chrome → Configuración → Privacidad → Configuración del sitio → busca tu URL → activa "Guardar datos" como permanente.

---

## 🔄 Actualizar la app en el futuro

Cuando Claude te dé una nueva versión:

1. Sustituye el archivo `pages/index.js` en tu repositorio de GitHub:
   - Ve a GitHub → tu repositorio → `pages/index.js`
   - Pulsa el lápiz ✏️ → pega el nuevo código → **"Commit changes"**
2. Vercel detecta el cambio y despliega automáticamente en ~2 minutos
3. La app en tu móvil se actualiza sola la próxima vez que la abres

---

## 💰 Coste total

| Servicio | Plan | Coste |
|----------|------|-------|
| Google Gemini API | Free | 0 € (1.500 req/día) |
| GitHub | Free | 0 € |
| Vercel | Hobby | 0 € |
| **Total** | | **0 € / mes** |

---

## 📤 Compartir con amigos

Una vez instalada, comparte simplemente tu URL de Vercel:
`https://voyager-ai-tuusuario.vercel.app`

Cada persona la instala en su móvil siguiendo el Paso 4. Todos usan la misma IA (tu clave de Gemini).

---

*Voyager AI — Desarrollado con Claude ✦ Anthropic · IA por Google Gemini*

# CoxGym

App personal para ver mi rutina de gimnasio. Al abrirla muestra la sesión que
toca **hoy** según el día de la semana en hora de Lima (America/Lima).

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **Sitio estático** (`output: 'export'`): sin servidor, sin base de datos y sin login
- **PWA instalable**: se puede agregar a la pantalla de inicio del celular

## Correrlo en local

Requisitos: Node.js 20 o superior.

```bash
npm install
npm run dev
```

Abrir <http://localhost:3000>. Para verlo como en el celular: F12 → ícono de
móvil → un ancho de ~390 px.

Para probar la versión final (la misma que se sube):

```bash
npm run build     # genera la carpeta out/
npx serve out     # sirve out/ en http://localhost:3000
```

## Editar la rutina

Toda la rutina vive en **`src/data/rutina.json`**. Se edita ese archivo y se
vuelve a desplegar; no hay que tocar código.

Estructura de cada día dentro de `semana`:

```jsonc
{
  "dia": "lunes",                 // clave interna, en minúsculas y sin tildes
  "nombreDia": "Lunes",           // lo que se ve en pantalla
  "tipo": "entrenamiento",        // "entrenamiento" o "descanso"
  "titulo": "Pierna A · Glúteo",
  "gruposMusculares": ["Glúteo", "Isquiotibiales"],
  "cardio": "",                   // opcional; si está vacío no se muestra
  "notas": "",                    // aviso destacado arriba del día; opcional
  "ejercicios": [
    {
      "id": "hip-thrust-maquina", // único dentro del día
      "nombre": "Hip thrust en máquina",
      "series": 4,
      "repeticiones": "8-10",     // texto libre: "12", "8-10", "al fallo"
      "descansoSeg": 90,
      "pesoSugerido": "",         // vacío se muestra como "—"
      "alternativa": "",          // opcional
      "notas": ""                 // opcional
    }
  ]
}
```

Reglas mínimas:

- Los 7 días deben existir, con las claves `lunes`, `martes`, `miercoles`,
  `jueves`, `viernes`, `sabado` y `domingo`.
- Un día con `"tipo": "descanso"` muestra la tarjeta de descanso y no necesita
  ejercicios.
- Los campos en blanco (`""`) simplemente no se muestran.

Después de editar conviene correr `npm run build`: si el JSON quedó mal
formado, el build falla y avisa.

### Los íconos

Los íconos de la PWA están en `public/icons/` y se generan con un script sin
dependencias. Solo hay que volver a correrlo si se cambia el dibujo o el color:

```bash
node scripts/generar-iconos.mjs
```

## Desplegar en Vercel

1. Subir el repositorio a GitHub.
2. En <https://vercel.com> → **Add New → Project** → importar el repo.
3. Vercel detecta Next.js solo. No hay que configurar nada: ni variables de
   entorno ni comandos. Con `output: 'export'` publica la carpeta `out/`.
4. **Deploy**. Cada `git push` a `main` vuelve a desplegar.

Para instalarla en el celular: abrir la URL en Chrome (Android) o Safari (iOS)
y elegir *Agregar a pantalla de inicio*.

## Alternativa: Firebase Hosting

Sube la carpeta `out/` como sitio estático.

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

En el asistente:

- **Public directory**: `out`
- **Single-page app**: `No` (cada ruta ya tiene su propio HTML)
- **Sobrescribir index.html**: `No`

Luego, cada vez que haya cambios:

```bash
npm run build
firebase deploy --only hosting
```

## Cómo está organizado

```
src/
  app/
    layout.tsx          # estructura común, metadatos y nav inferior
    page.tsx            # "/"        → la sesión de hoy
    semana/page.tsx     # "/semana"  → los 7 días
    dia/[dia]/page.tsx  # "/dia/lunes", "/dia/martes", ...
    manifest.ts         # datos de la PWA
    globals.css         # paleta oscura y estilos base
  components/           # TarjetaEjercicio, EncabezadoDia, TarjetaDescanso, NavInferior...
  data/rutina.json      # LA RUTINA (lo único que se edita a diario)
  lib/rutina.ts         # único acceso a los datos
  types/rutina.ts       # tipos de la rutina
public/icons/           # íconos de la PWA
scripts/                # generador de íconos
```

Dos detalles que valen la pena recordar:

- **El día de hoy se calcula en el navegador.** El sitio es estático: si se
  calculara al compilar, quedaría clavado en la fecha del despliegue. Por eso
  `"/"` muestra un esqueleto un instante y luego la sesión correcta.
- **Los componentes nunca leen el JSON directamente**, siempre pasan por
  `src/lib/rutina.ts`. El día que los datos vengan de Supabase, solo cambia ese
  archivo.

## Qué falta (a futuro)

Registro de pesos por sesión, gráficos de progreso y backend. La estructura ya
está pensada para eso: los datos entran por un solo archivo.

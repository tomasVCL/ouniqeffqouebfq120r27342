# Despliegue y operación — Portal de Reportes VCL

Portal público de reportes de scouting. El cliente entra con un **passkey** y ve
su reporte (contexto, rankings y matriz de evaluación). Multi-tenant por
`clientSlug/problemId`.

- **Producción:** https://vclstudio-scouting-platform.vercel.app
- **Stack:** React 19 + Vite (SPA) · Express + tRPC 11 (función serverless) · MySQL/TiDB + Drizzle ORM
- **Hosting:** Vercel · **DB:** TiDB Cloud (serverless)

---

## Arquitectura de despliegue

- El frontend se compila con `vite build` → `dist/public` (estático).
- El backend (`server/vercel.ts`) se **pre-bundlea con esbuild** a `api/index.js`
  (función serverless de Vercel). Esto es obligatorio: sin el bundle, los imports
  ESM `../server/*` fallan en runtime (`ERR_MODULE_NOT_FOUND`).
- Todo esto lo hace el `buildCommand` de `vercel.json`. `api/index.js` es un
  artefacto de build (está en `.gitignore`).

## Variables de entorno (Vercel)

| Variable | Dónde | Valor |
|----------|-------|-------|
| `DATABASE_URL` | Production | `mysql://<user>:<pass>@<host>:4000/vcl_scouting` |

> La conexión activa TLS automáticamente para hosts no locales (requerido por TiDB).

---

## Agregar un nuevo reporte (para otro cliente)

El panel de analista no existe; los reportes se cargan desde el **Excel template
VCL Discover** con el importador.

1. Llena el Excel (`VCL_Template_Evaluacion_Vendors.xlsx`): hoja **Configuración**
   (datos del proyecto, criterios+pesos, clusters, startups+cluster+síntesis),
   hoja **Perfiles** y hoja **Matriz de Evaluación** (scores 0–4 + justificación).
2. Asegúrate de tener `DATABASE_URL` en un `.env` local (ya está en `.gitignore`).
3. Corre el importador:

   ```bash
   node scripts/import-report.mjs \
     --file "ruta/al/Template.xlsx" \
     --slug NOMBRE-CLIENTE --problem 001 \
     --passkey "CLAVE-DEL-CLIENTE" \
     --industry "Industria" --geo-allowed "LATAM" --geo-excluded "—"
   ```

   - Es **idempotente**: re-correrlo con el mismo `--slug --problem` reemplaza el reporte.
   - El ranking (WSM, tier, posición) se **calcula solo** desde los scores y pesos.
   - El passkey se guarda **hasheado** (bcrypt); nunca en texto plano.
4. El reporte queda disponible en `/<slug>/<problem>` y el cliente entra con su passkey.

No requiere redeploy: los datos viven en la DB.

---

## Re-desplegar (tras cambios de código)

```bash
# build local de verificación (obligatorio antes de desplegar)
pnpm install --frozen-lockfile
pnpm check        # tsc
pnpm build        # vite + esbuild

# desplegar a producción
vercel --prod     # requiere estar logueado (vercel login) o VERCEL_TOKEN
```

## Cambiar el schema de la DB

```bash
pnpm exec drizzle-kit push   # aplica drizzle/schema.ts a la DB de DATABASE_URL
```

# VCL Studio Innovation Startup Scouting Platform — TODO

## Database
- [x] Create projects table
- [x] Create requirements table
- [x] Create formulas + formula_variables tables
- [x] Create startups table
- [x] Create clusters table
- [x] Create capabilities table
- [x] Create wsm_scores, pugh_scores, capfit_scores tables
- [x] Create rankings table
- [x] Create recommendations table
- [x] Create publish_log table
- [x] Create analyst_credentials table

## Server
- [x] db.ts: all helpers for innovation scouting tables
- [x] routers.ts: analyst auth, projects, requirements, formulas, startups, clusters, capabilities, scores (WSM/Pugh/CapFit) + AI suggest, composite calc, rankings, recommendations AI draft + update, publish/unpublish, report.getByPasskey

## Frontend — Analyst Portal
- [x] Analyst login page (shared username + password, separate from Manus OAuth)
- [x] Projects list page (create, edit, delete, progress indicator per step)
- [x] Project workspace with step sidebar (A–L)
- [x] Step A: Project Setup form (all fields + passkey setter)
- [x] Step B: Requirements Builder (drag-reorder, weight % validation)
- [x] Step C: Formula Library (expression evaluator, variable table)
- [x] Step D: Startup Universe (add startups, eligibility auto-flag)
- [x] Step E: Strategic Clusters (create clusters, assign startups)
- [x] Step F: WSM Matrix (grid input, AI suggest, Human/AI toggle, divergence highlight)
- [x] Step G: Pugh Matrix (grid input, AI suggest, Human/AI toggle)
- [x] Step H: Capability Fit Matrix (grid input, AI suggest, Human/AI toggle)
- [x] Step I: Composite Final Matrix (auto-calculated, read-only display)
- [x] Step J: Rankings & Tiers (auto-calculated, tier badges)
- [x] Step K: Recommendations (AI draft per startup, inline edit, decision + reason)
- [x] Step L: Publish (publish/unpublish, publish history log)
- [ ] Auto-save on every field change (debounced)

## Frontend — Client Portal (PRIORITY SPRINT)
- [x] Client passkey entry page (main public URL)
- [x] report.getByPasskey returns project + rankings + startups + recommendations
- [x] Page 1: Problem/Context intro (project title, client, scope, analyst info, VCL branding)
- [x] Page 2: Section C ranking table (Rank, Company, Composite, WSM, Pugh, CapFit, Tier, Strategic Fit, Key Differentiator)
- [x] Hover card on startup name showing: founded year, location, brief, employees, clients/ref, phase, funding, investors
- [x] Tier badge color coding (Tier 1 green, Tier 2 blue, Tier 3 amber, Tier 4 red/monitor)
- [x] Navigation between Page 1 and Page 2

## Quality
- [x] VCL Studio brand assets applied throughout (logo-dark, logo-white, isotipo)
- [ ] Responsive: desktop + tablet + mobile (client report)
- [ ] Accessibility: tier color cells include text label (not color alone)
- [ ] Vitest tests for all routers
- [x] Zero TypeScript errors

## Client Portal V2 — Project 5 (VCL Discover Phase v2)
- [x] Add rationale column to wsm_scores table
- [x] Seed project 5: project row, 10 startups, 9 requirements (WSM criteria + weights)
- [x] Seed WSM scores (10 startups × 9 criteria) with rationale text
- [x] Seed rankings (10 rows with cluster, tier, differentiator)
- [x] Update report.getByPasskey to return rationale per score
- [x] ClientPortalV2.tsx — Page 1: context, scope, methodology, interactive business formulas (F1–F5)
- [x] ClientPortalV2.tsx — Page 2: final rankings table with cluster column + hover startup cards
- [x] ClientPortalV2.tsx — Page 3: deep-dive 10×9 scoring matrix with hover rationale tooltips
- [x] Wire /client/v2/5 route in App.tsx
- [x] Translate all UI labels to English (passkey gate, nav tabs, section headers, hover cards, legend)
- [x] Login page full viewport fix (h-screen, no grey gap)
- [x] Scroll to top on tab change
- [x] VCL brand color scheme (warm cream #FDF6EE, orange #E8521A, white sections)
- [x] Must Have / Should Have criteria split (Motor LCA + DPP marked mandatory)
- [x] Geographic scope excluded = Rest of the World
- [x] Matrix criterion name column header wraps (no truncation)
- [x] CTA button at end of Page 1 → Page 2
- [x] CTA button at end of Page 2 → Page 3
- [x] Analyst Recommendations section on Page 2 (10 recommendations seeded)
- [x] Todo el portal V2 traducido al español (UI chrome completo)
- [x] Nueva Página 4 "Anexos" con fórmulas de negocio interactivas y nota metodológica
- [x] Fórmulas movidas de Página 1 a Página 4 (Anexos)
- [x] Strategic Clusters movidos al tope de la Página 2 (Rankings)
- [x] Criterios renombrados: Must Have → Indispensable, Should Have → Deseable
- [x] TRL movido de Deseable a Indispensable
- [x] Porcentajes eliminados de la sección de criterios (solo en metodología)
- [x] Nav actualizada: Contexto, Rankings, Evaluación, Anexos

## Refactor de rutas y acceso unificado
- [x] Añadir columnas client_slug y problem_id a la tabla projects (DB migration)
- [x] Actualizar proyecto 5 (WTS Peru v2): client_slug=wts, problem_id=001
- [x] Actualizar router report.resolvePasskey (busca por passkey, devuelve slug+problemId)
- [x] Crear pantalla de acceso unificada en /acceso
- [x] Crear ruta dinámica /:clientSlug/:problemId que renderiza ClientPortalV2
- [x] Eliminar ClientPortal.tsx (V1) y ruta /client/:projectId de App.tsx
- [x] ClientPortalV2 lee passkey desde sessionStorage cuando viene de /acceso
- [x] Redirigir / a /acceso
- [x] Añadir helper getProjectBySlug(clientSlug, problemId) en db.ts
- [x] Añadir procedimiento report.getBySlug en routers.ts para cargar reporte sin sessionStorage
- [x] ClientPortalV2: si hay slug+problemId en URL, usar getBySlug en lugar de getByPasskey
- [x] Redirigir / a /acceso con Redirect en App.tsx

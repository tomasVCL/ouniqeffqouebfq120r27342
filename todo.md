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

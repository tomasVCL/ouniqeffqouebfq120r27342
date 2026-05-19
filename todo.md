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

## Frontend — Client Portal
- [x] Client passkey entry page (main public URL)
- [ ] Section 1: Header (VCL logo, report title, client, industry, date)
- [ ] Section 2: Project Overview
- [ ] Section 3: Search Constraints (requirements table)
- [ ] Section 4: Formula Library
- [ ] Section 5: Startup Universe roster
- [ ] Section 6: Strategic Clusters cards
- [ ] Section 7: Composite Evaluation Matrix (interactive cells, sortable columns, sticky startup column, horizontal scroll)
- [x] Section 8: Rankings & Tiers table
- [x] Section 9: Final Recommendations cards
- [ ] Section 10: Methodology Note

## Quality
- [ ] VCL Studio brand assets applied throughout (logo-dark, logo-white, isotipo)
- [ ] Responsive: desktop + tablet + mobile (client report)
- [ ] Accessibility: tier color cells include text label (not color alone)
- [ ] Vitest tests for all routers
- [x] Zero TypeScript errors

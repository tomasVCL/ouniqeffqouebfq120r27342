# VCL Studio Scouting Platform — TODO

## Foundation

- [x] Upload brand assets (logo-dark, logo-white, isotipo, logo-orange) to CDN
- [x] Database schema: talents, shortlists, shortlist_members, submissions, scout_notes, users
- [x] Apply all migrations via webdev_execute_sql
- [x] Brand theming: CSS variables (VCL Orange #FE4E03, Amber #FFCA2B, Dark #292432)
- [x] Google Fonts: Archivo Black + Inter
- [x] DashboardLayout: dark sidebar #292432, VCL logo-white in nav, brand tokens
- [x] Responsive mobile sidebar overlay

## Auth & Routing

- [x] Manus OAuth login screen with VCL branding (dark logo on white card)
- [x] Protected routes via DashboardLayout auth guard
- [x] Public routes: /submit, /shared/:token
- [x] Role-based access: Admin section only visible to admin users
- [x] Admin procedures protected with FORBIDDEN guard

## Pages

- [x] Dashboard: welcome banner, stats grid, recent talents list
- [x] Discover: search bar, filter panel (discipline, availability, experience, location), talent cards grid
- [x] TalentProfile: bio, portfolio media, skills, social links, availability badge, private notes with star ratings, shortlist add/remove
- [x] Shortlists: list view, create shortlist dialog, delete shortlist, generate share token, shortlist detail with talent cards
- [x] Submissions: list view with status badges, approve/reject actions, review notes
- [x] SubmitTalent (public): intake form — name, email, phone, discipline, bio, portfolio URL, Instagram, location
- [x] SharedShortlist (public): read-only shared shortlist view via token
- [x] AdminPanel: user management (promote/demote roles), talent management (approve/delete), submissions overview

## Server

- [x] tRPC routers: talents, shortlists, submissions, notes, admin, dashboard, auth
- [x] DB helpers aligned to actual table names (scout_notes, shortlist_members)
- [x] Shortlist share token generation
- [x] Submission approval auto-creates talent profile

## Tests (21 passing)

- [x] auth.logout clears cookie
- [x] auth.me returns null for unauthenticated
- [x] auth.me returns user for authenticated
- [x] admin.listUsers FORBIDDEN for non-admin
- [x] admin.promoteUser FORBIDDEN for non-admin
- [x] admin.deleteTalent FORBIDDEN for non-admin
- [x] shortlists.create rejects empty name
- [x] submissions.create rejects invalid email
- [x] submissions.create rejects empty name
- [x] notes.create rejects empty content
- [x] notes.create rejects rating 0 (out of range)
- [x] notes.create rejects rating 6 (out of range)
- [x] talents.upsert rejects empty name
- [x] talents.upsert rejects empty discipline
- [x] talents.upsert rejects invalid availability enum
- [x] shortlists.getByToken throws NOT_FOUND for non-existent token

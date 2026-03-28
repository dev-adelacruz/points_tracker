# Points Tracker — Product Requirements Document
**Version:** 1.0 | **Date:** 2026-03-28 | **Status:** Draft
**Repo:** `dev-adelacruz/points_tracker`

---

## 1. Executive Summary

**Points Tracker** is a web application that replaces manual Excel-based TikTok coin tracking workflows for a live streaming talent management company. The platform enables three distinct roles — Admins, Emcees, and individual Hosts — to log, monitor, and analyze TikTok coin earnings at the session, host, team, and company level.

The company currently manages 100+ live hosts organized into teams, each led by an Emcee. Coin earnings are recorded per host per live session (typically 1–2 sessions per day). Points Tracker centralizes this data, adds real-time leaderboards and monthly quota tracking, and delivers an energetic, visually dynamic experience that reflects the live streaming world. The application is designed as a single-company system for v1, but architected from the ground up to support future multi-tenancy for a potential SaaS pivot.

Built on a Ruby on Rails API backend with a React + Vite frontend, leveraging a pre-built template that already includes authentication, a dashboard shell, and a component library.

---

## 2. Problem Statement

**Current State:** The company's 100+ TikTok Live hosts earn TikTok coins across multiple live sessions each day. Emcees manually record these earnings in a shared Excel spreadsheet — a fragile, error-prone process with no access controls, no real-time visibility, and no performance analysis.

**Pain Points:**

| Who | Problem |
|---|---|
| Admin / Manager | No reliable, real-time view of company-wide performance; compiling reports requires manual aggregation across multiple Excel files |
| Emcee | Data entry is disconnected from team context; no way to quickly see team totals or compare session-by-session performance |
| Host | No visibility into their own earnings history, monthly quota progress, or ranking relative to peers |
| Everyone | No access control — any team's data is visible to anyone with spreadsheet access |

**Why now:** The host roster has scaled past the point where Excel is manageable. Data loss, version conflicts, and the absence of any performance intelligence are creating operational drag. A structured platform with proper roles, data integrity, and dashboards is the clear next step before the company grows further.

---

## 3. User Personas

### Persona 1 — Admin / Manager
**Name:** Marco, Operations Manager
**Role:** Full system access; oversees all teams, all hosts, all data
**Goals:**
- Monitor company-wide coin earnings in real time
- Ensure all hosts are on track against monthly quotas
- Manage the roster: add/deactivate hosts, assign emcees to teams
- Generate on-screen reports for period-over-period performance reviews

**Pain Points:**
- Currently assembles weekly performance reports manually from multiple spreadsheet tabs
- Has no way to quickly identify underperforming hosts or teams
- Onboarding new hosts requires updating multiple sheets manually

**Key Tasks in System:** View company leaderboard, manage teams/emcees/hosts, view all coin entries, run period-over-period comparisons, track quota progress across all hosts

---

### Persona 2 — Emcee (MC)
**Name:** Ria, Team Lead
**Role:** Leads 1–2 teams; responsible for daily coin entry; scoped view (assigned teams only)
**Goals:**
- Log coin earnings for each host quickly after each session
- Monitor her team's daily and cumulative performance
- Identify hosts who are behind on quota and need support

**Pain Points:**
- Currently enters data in a shared spreadsheet with no per-team data isolation — mistakes from other teams affect her view
- After entering data, has no immediate feedback on how the team is performing relative to previous sessions
- Managing hosts across two teams in one spreadsheet is confusing

**Key Tasks in System:** Log coins per host per session, view team dashboard, filter team stats by date range, see quota progress for each of her hosts

---

### Persona 3 — Individual Host
**Name:** Kaye, TikTok Live Host
**Role:** Logged-in user; read-only access to their own data only
**Goals:**
- Know how many coins she's earned this month and how far she is from her 300k quota
- See her session-by-session breakdown to understand her best and worst days
- Check her rank on the leaderboard for motivation

**Pain Points:**
- Currently has no self-service access to her own earnings — must ask her Emcee for updates
- Has no way to track her own progress toward the monthly quota until payday
- Leaderboard position is unknown until the Emcee shares a spreadsheet snapshot

**Key Tasks in System:** View personal dashboard, track monthly quota progress, view coin history by session, check leaderboard ranking

---

## 4. Goals & Success Metrics

| # | Goal | KPI | Target |
|---|---|---|---|
| 1 | Eliminate manual Excel tracking | % of daily coin entries logged in the app vs. spreadsheet | 100% within 30 days of launch |
| 2 | Hosts have self-service quota visibility | % of hosts logging in at least weekly | ≥ 80% active host adoption within 60 days |
| 3 | Emcees complete daily entry faster | Average time to log all coin entries per session per team | < 5 minutes per session |
| 4 | Admin can generate performance reports without manual work | Time to produce a weekly team performance summary | < 2 minutes (down from 30+ min) |
| 5 | No data integrity issues | Data entry error rate (corrections / total entries) | < 2% |

---

## 5. Scope

### In Scope — v1.0

- Role-based access control (Admin, Emcee, Host) with scoped data visibility
- Organization management: Teams, Hosts, Emcees (CRUD + deactivation)
- Live Session management with cross-team host participation support
- Coin entry logging per host per session (Emcee-driven)
- Host personal dashboard: coin history, session breakdown, quota progress
- Team dashboard: performance across sessions, per-host breakdown
- Company-wide leaderboard ranked by total coins (all roles)
- Monthly quota tracker (300,000 coin target per host)
- Flexible filtering: by date range, team, host, session; daily/weekly/monthly presets
- Basic on-screen reporting: team totals, period-over-period comparisons
- Admin panel for full entity management
- Energetic, dynamic UI design (bold typography, vibrant accents, motion-friendly)
- Multi-tenancy-ready architecture (tenant isolation at the data model layer)

### Out of Scope — v1.0

- Data export (CSV, Excel, PDF)
- TikTok API integration (coins entered manually)
- Push or email notifications
- Mobile native apps (iOS / Android)
- Multi-tenant onboarding / tenant management UI
- Payroll or financial calculations (coins only, no currency conversion)
- Historical data import from Excel
- Public-facing host profiles

---

## 6. Epics & Features

---

### Epic 1: Role-Based Access Control
**Priority:** Must Have
**Description:** Auth is pre-built in the template. This epic implements the role layer on top — assigning Admin, Emcee, or Host roles to users and enforcing data scoping throughout the application. Without this, no other feature can safely expose data to the correct users.

---

#### Feature 1.1: Role Assignment & Role-Aware Routing
As an **Admin**, I want to assign a role (Admin, Emcee, or Host) to each user so that each user sees only the data and actions appropriate to their role.

**Acceptance Criteria:**
- [ ] Users have exactly one of three roles: Admin, Emcee, Host
- [ ] Role is assignable and editable by Admins only
- [ ] After login, the user is routed to the correct default view based on their role (Admin → company dashboard; Emcee → team dashboard; Host → personal dashboard)
- [ ] Attempting to access a route outside one's role returns a 403 or redirects to the home view

**Jira Labels:** `rbac`, `must-have`
**Story Points:** 5

---

#### Feature 1.2: Emcee Data Scoping
As an **Emcee**, I want to see data only for the teams I am assigned to so that I cannot view or modify other teams' information.

**Acceptance Criteria:**
- [ ] All API queries issued by an Emcee are filtered server-side to their assigned team(s)
- [ ] Emcee cannot access host profiles, coin entries, or session data for teams not assigned to them — even by manipulating URL parameters
- [ ] Emcee's team list renders only their assigned teams
- [ ] An Emcee assigned to multiple teams sees all their teams' data, nothing else

**Jira Labels:** `rbac`, `must-have`
**Story Points:** 5

---

#### Feature 1.3: Host Data Scoping
As a **Host**, I want to see only my own data so that my earnings and ranking are private to me.

**Acceptance Criteria:**
- [ ] Host dashboard loads only data for the authenticated host
- [ ] API endpoints reject requests from a Host attempting to query another host's data
- [ ] Host can view the company leaderboard but sees only aggregate rank and anonymized or named entries (see Open Questions #1)
- [ ] Host has no access to team management or coin entry forms

**Jira Labels:** `rbac`, `must-have`
**Story Points:** 3

---

### Epic 2: Organization Management
**Priority:** Must Have
**Description:** Admins need to manage the company's roster — teams, emcees, and hosts — including creating records, editing assignments, and deactivating accounts. This is the foundation all other features depend on.

---

#### Feature 2.1: Team Management
As an **Admin**, I want to create, edit, and deactivate teams so that the organizational structure of the company is reflected in the app.

**Acceptance Criteria:**
- [ ] Admin can create a team with a name and optional description
- [ ] Admin can rename a team
- [ ] Admin can deactivate a team (soft delete; historical data is preserved)
- [ ] Deactivated teams are hidden from active views but accessible in historical reports
- [ ] Team list shows active teams with their assigned Emcee and host count

**Jira Labels:** `org-management`, `must-have`
**Story Points:** 5

---

#### Feature 2.2: Emcee Assignment
As an **Admin**, I want to assign an Emcee to one or more teams so that the correct person is responsible for each team's data entry.

**Acceptance Criteria:**
- [ ] Admin can assign any user with the Emcee role to a team
- [ ] An Emcee can be assigned to multiple teams simultaneously
- [ ] Each team has exactly one active Emcee assignment at a time
- [ ] Reassigning an Emcee preserves the audit history of previous assignments
- [ ] Emcee assignment is visible on the team detail view

**Jira Labels:** `org-management`, `must-have`
**Story Points:** 3

---

#### Feature 2.3: Host Management
As an **Admin**, I want to add, edit, and deactivate host accounts so that the host roster stays current.

**Acceptance Criteria:**
- [ ] Admin can create a host profile linked to a user account
- [ ] Admin can edit a host's name, assigned team, and associated user credentials
- [ ] Admin can deactivate a host (soft delete; all historical coin data is preserved)
- [ ] Admin can reassign a host to a different primary team
- [ ] Host list is filterable by team and active/inactive status
- [ ] Deactivated hosts are excluded from leaderboards and quota views unless a historical date range includes their active period

**Jira Labels:** `org-management`, `must-have`
**Story Points:** 8

---

#### Feature 2.4: Admin Panel UI
As an **Admin**, I want a dedicated admin panel with tabbed navigation across Teams, Emcees, and Hosts so that I can manage all organizational entities from one place.

**Acceptance Criteria:**
- [ ] Admin panel is accessible from the main navigation and gated to Admin role
- [ ] Panel has tabs (or top-level sections) for: Teams, Hosts, Emcees, Sessions
- [ ] Each section shows a searchable, sortable list of entities
- [ ] Inline or modal-based edit flows (no full-page navigations required for simple edits)
- [ ] All destructive actions (deactivate, delete) require a confirmation step

**Jira Labels:** `org-management`, `must-have`
**Story Points:** 8

---

### Epic 3: Live Session & Coin Entry Logging
**Priority:** Must Have
**Description:** The core operational workflow of the app. Emcees create live sessions and log coin earnings per host per session, replacing the Excel sheet. Sessions can include hosts from multiple teams.

---

#### Feature 3.1: Live Session Creation
As an **Emcee**, I want to create a live session record so that coin entries can be attributed to a specific session on a specific date.

**Acceptance Criteria:**
- [ ] Emcee can create a session with: date, session number (1st or 2nd of the day), and a list of participating hosts
- [ ] Participating hosts can be drawn from any team (cross-team sessions supported)
- [ ] Session is associated with a primary team (the Emcee's team) but host list can include guests from other teams
- [ ] Admin can also create and edit sessions
- [ ] A session cannot be created for a future date
- [ ] Duplicate session guard: warn if a session for the same date/slot already exists for the same primary team

**Jira Labels:** `session-logging`, `must-have`
**Story Points:** 8

---

#### Feature 3.2: Coin Entry per Host per Session
As an **Emcee**, I want to log the coins earned by each host in a session so that earnings are recorded accurately at the session level.

**Acceptance Criteria:**
- [ ] Emcee sees a data entry form listing all participating hosts for the selected session
- [ ] Each host row accepts a coin count (positive integer)
- [ ] Emcee can submit all entries for the session in one action
- [ ] Submitted entries are immediately reflected in dashboards and leaderboards
- [ ] Zero-coin entries are valid (host participated but earned nothing)
- [ ] Emcee can only enter coins for hosts on their assigned teams (or cross-team guests they added to the session)

**Jira Labels:** `session-logging`, `must-have`
**Story Points:** 8

---

#### Feature 3.3: Coin Entry Editing & Correction
As an **Emcee** or **Admin**, I want to edit a previously submitted coin entry so that data errors can be corrected.

**Acceptance Criteria:**
- [ ] Emcee can edit any coin entry for sessions they created, as long as the session date is within the current month (configurable guard)
- [ ] Admin can edit any coin entry with no date restriction
- [ ] Edited entries display a visual "edited" indicator with the last-modified timestamp
- [ ] Original value is preserved in an audit log (not surfaced in UI for v1, but stored in DB)
- [ ] Leaderboards and dashboards reflect updated values immediately after an edit

**Jira Labels:** `session-logging`, `must-have`
**Story Points:** 5

---

#### Feature 3.4: Session Management by Admin
As an **Admin**, I want to view, edit, and delete any session record so that the data stays clean even when Emcees make mistakes.

**Acceptance Criteria:**
- [ ] Admin can view all sessions across all teams in a list view
- [ ] Admin can edit session metadata (date, participating hosts)
- [ ] Admin can delete a session (hard delete with confirmation; all associated coin entries are also removed)
- [ ] Session list is filterable by team, date range, and Emcee
- [ ] Deleting a session shows a summary of how many coin entries will be removed

**Jira Labels:** `session-logging`, `must-have`
**Story Points:** 5

---

### Epic 4: Host Personal Dashboard
**Priority:** Must Have
**Description:** Every host has a personal view showing their own performance — coin history by session, running totals, and quota progress. This replaces the host's reliance on asking their Emcee for updates.

---

#### Feature 4.1: Coin History & Session Breakdown
As a **Host**, I want to view my coin earnings broken down by session so that I can see which days and sessions I performed best.

**Acceptance Criteria:**
- [ ] Dashboard shows a chronological list of sessions the host participated in, with coins earned per session
- [ ] Sessions are grouped by day, showing daily total
- [ ] Host can filter their history by date range (with daily/weekly/monthly presets)
- [ ] Empty states are handled gracefully (no sessions logged yet)
- [ ] Coins are displayed with thousands separator formatting (e.g., 125,000)

**Jira Labels:** `host-dashboard`, `must-have`
**Story Points:** 5

---

#### Feature 4.2: Personal Earnings Summary
As a **Host**, I want to see my total coins earned for the current month, current week, and all-time so that I have a quick performance overview at a glance.

**Acceptance Criteria:**
- [ ] Summary cards show: Today, This Week, This Month, All-Time totals
- [ ] Current month card is visually prominent (it's the most relevant figure for quota tracking)
- [ ] All totals update in real time as new coin entries are logged by the Emcee
- [ ] Tapping/clicking a summary card filters the session history to the corresponding period

**Jira Labels:** `host-dashboard`, `must-have`
**Story Points:** 3

---

#### Feature 4.3: Personal Leaderboard Ranking
As a **Host**, I want to see my current rank on the company leaderboard so that I stay motivated by knowing where I stand.

**Acceptance Criteria:**
- [ ] Personal dashboard shows the host's current leaderboard position (e.g., "Ranked #12 of 104 hosts")
- [ ] Rank is based on total coins for the current month (configurable period)
- [ ] Rank updates in real time as new entries are added
- [ ] Rank badge is visually distinctive (see UI Epic)

**Jira Labels:** `host-dashboard`, `must-have`
**Story Points:** 2

---

### Epic 5: Team Performance Dashboard
**Priority:** Must Have
**Description:** Emcees need a team-scoped view of performance across sessions, hosts, and time — enabling them to spot underperformance and prepare for data entry. Admins can access any team's dashboard.

---

#### Feature 5.1: Team Session Performance View
As an **Emcee**, I want to see a session-by-session breakdown of my team's coin earnings so that I can identify trends and outliers quickly.

**Acceptance Criteria:**
- [ ] Team dashboard shows a table/list of sessions with: date, session slot, total coins, top earner
- [ ] Each session row is expandable to show per-host breakdown
- [ ] Sessions are sorted chronologically, most recent first
- [ ] Emcee can filter by date range (with daily/weekly/monthly presets)
- [ ] Cross-team guest hosts who participated in a team session are included in that session's data with a visual distinction

**Jira Labels:** `team-dashboard`, `must-have`
**Story Points:** 8

---

#### Feature 5.2: Team Host Performance Summary
As an **Emcee**, I want to see each host's coin totals for the current period so that I can quickly identify who is ahead or behind on their quota.

**Acceptance Criteria:**
- [ ] Team dashboard includes a host leaderboard scoped to the team, ranked by total coins in the selected period
- [ ] Each host row shows: name, total coins this month, quota progress (%), number of sessions attended
- [ ] Hosts below 50% of monthly quota are visually flagged (color or icon)
- [ ] Emcee managing multiple teams can switch between their teams via a team selector

**Jira Labels:** `team-dashboard`, `must-have`
**Story Points:** 5

---

#### Feature 5.3: Session Entry Status Indicator
As an **Emcee**, I want to see which of today's sessions have had coin entries logged and which are still pending so that I don't miss any entries.

**Acceptance Criteria:**
- [ ] Team dashboard shows today's sessions with a status badge: Logged / Pending
- [ ] A session is Pending until at least one coin entry exists for it
- [ ] Clicking a Pending session opens the coin entry form directly
- [ ] If no session has been created for today yet, a prompt to create one is displayed

**Jira Labels:** `team-dashboard`, `must-have`
**Story Points:** 3

---

### Epic 6: Company-Wide Leaderboard
**Priority:** Must Have
**Description:** A company-wide rankings view visible to all roles, ranked by total coins earned. The leaderboard is one of the most motivational surfaces in the app and should feel exciting and dynamic.

---

#### Feature 6.1: Company Leaderboard — All Hosts
As a **user of any role**, I want to see a company-wide leaderboard ranked by total coins so that I can see how all hosts compare to each other.

**Acceptance Criteria:**
- [ ] Leaderboard shows all active hosts ranked by total coins for the selected period
- [ ] Default period is current month; filterable by date range
- [ ] Each row shows: rank, host name, team name, total coins, sessions count, quota progress %
- [ ] Current user's entry (if a Host) is always visible, even if outside the top N, and highlighted distinctly
- [ ] Leaderboard updates in real time (or near-real-time) as coin entries are logged
- [ ] Supports pagination or infinite scroll for 100+ hosts

**Jira Labels:** `leaderboard`, `must-have`
**Story Points:** 8

---

#### Feature 6.2: Team-Filtered Leaderboard
As an **Admin** or **Emcee**, I want to filter the leaderboard by team so that I can see intra-team rankings.

**Acceptance Criteria:**
- [ ] Leaderboard includes a team filter dropdown (Admin sees all teams; Emcee sees only their assigned teams)
- [ ] Selecting a team re-ranks hosts within that team only
- [ ] "All Teams" is the default and shows company-wide ranking
- [ ] Filter state persists for the session (doesn't reset on page navigation)

**Jira Labels:** `leaderboard`, `must-have`
**Story Points:** 3

---

#### Feature 6.3: Leaderboard Visual Design
As a **user of any role**, I want the leaderboard to feel exciting and dynamic so that checking rankings is motivating, not boring.

**Acceptance Criteria:**
- [ ] Top 3 positions have distinct visual treatment (e.g., gold/silver/bronze accents, larger rank badges)
- [ ] Row animations on load (staggered entrance) and on rank changes
- [ ] Bold typography and vibrant accent colors consistent with the app's energetic design language
- [ ] Coin counts use large, readable formatting with thousands separators
- [ ] Mobile-responsive layout (horizontal scroll or adaptive column layout)

**Jira Labels:** `leaderboard`, `ui-design`, `must-have`
**Story Points:** 5

---

### Epic 7: Monthly Quota Tracker
**Priority:** Must Have
**Description:** Each host has a hard target of 300,000 coins per calendar month. Progress toward this target must be visible at the host, team, and admin level. This is one of the primary KPIs the company monitors.

---

#### Feature 7.1: Host-Level Quota Progress
As a **Host**, I want to see a visual progress indicator showing how many coins I've earned vs. my 300,000-coin monthly target so that I know exactly how far I am from my goal.

**Acceptance Criteria:**
- [ ] Quota progress bar or ring displayed prominently on the host personal dashboard
- [ ] Shows: coins earned, coins remaining, percentage complete, days remaining in month
- [ ] Color shifts as progress milestones are hit (e.g., red → yellow → green at thresholds)
- [ ] If quota is met, the indicator shows a completion state
- [ ] Quota resets automatically at the start of each calendar month

**Jira Labels:** `quota-tracker`, `must-have`
**Story Points:** 5

---

#### Feature 7.2: Team Quota Overview
As an **Emcee**, I want to see a quota progress summary for all hosts on my team so that I can identify who needs extra sessions to hit their target.

**Acceptance Criteria:**
- [ ] Team dashboard includes a quota summary table: host name, coins earned, % to quota, on-track status
- [ ] "On-track" is calculated as: coins_earned / total_days_elapsed × total_days_in_month ≥ 300,000
- [ ] Hosts off-track are sorted to the top or visually flagged
- [ ] Summary is filterable by the same date controls as the rest of the team dashboard

**Jira Labels:** `quota-tracker`, `must-have`
**Story Points:** 5

---

#### Feature 7.3: Company Quota Status (Admin View)
As an **Admin**, I want to see a company-wide quota completion overview so that I can assess overall team performance at a glance.

**Acceptance Criteria:**
- [ ] Admin dashboard includes a quota status summary: total hosts, number on-track, number off-track, number who met quota
- [ ] Hosts can be sorted by quota completion % in the admin panel
- [ ] Historical quota completion (past months) is accessible via date filter
- [ ] The 300,000-coin target is configurable by Admins (stored as a system-level setting, not hardcoded)

**Jira Labels:** `quota-tracker`, `must-have`
**Story Points:** 5

---

### Epic 8: Flexible Filtering & Date Queries
**Priority:** Should Have
**Description:** All data-heavy views (leaderboard, dashboards, reports) need flexible date and entity filters. Without this, the leaderboard and reports are only useful for the current period — significantly limiting the app's analytical value.

---

#### Feature 8.1: Date Range Presets & Custom Picker
As a **user of any role**, I want to filter any data view by a date range using presets or a custom picker so that I can query daily, weekly, monthly, or arbitrary periods.

**Acceptance Criteria:**
- [ ] A reusable filter bar component is available on all data-heavy views
- [ ] Presets: Today, This Week, This Month, Last Month, Last 7 Days, Last 30 Days, Custom Range
- [ ] Custom range opens a date picker (calendar UI) accepting start and end dates
- [ ] Filter state is reflected in the URL (query params) for shareability
- [ ] Default view for all pages is "This Month" unless overridden

**Jira Labels:** `filtering`, `should-have`
**Story Points:** 5

---

#### Feature 8.2: Entity Filters (Team, Host, Session)
As an **Admin**, I want to filter views by team, host, and session so that I can drill into specific slices of data without building a report manually.

**Acceptance Criteria:**
- [ ] Admin-level views support: Team filter (multi-select), Host filter (searchable dropdown), Session filter (by date/slot)
- [ ] Filters combine additively (AND logic)
- [ ] Active filters are shown as dismissible chips above the data view
- [ ] "Clear all filters" resets to default view
- [ ] Emcee-level filters are scoped to their assigned teams only

**Jira Labels:** `filtering`, `should-have`
**Story Points:** 5

---

### Epic 9: Analytics & Period Reporting
**Priority:** Should Have
**Description:** On-screen reporting for Admins and Emcees — period-over-period comparisons, team totals, and host performance summaries. No export required in v1.

---

#### Feature 9.1: Period-over-Period Comparison
As an **Admin**, I want to compare total coins earned by team or host across two time periods so that I can see whether performance is improving or declining.

**Acceptance Criteria:**
- [ ] Admin can select two date ranges (Period A and Period B) for comparison
- [ ] Comparison table shows: entity name, Period A total, Period B total, delta (absolute + %)
- [ ] Delta is color-coded (green for improvement, red for decline)
- [ ] Comparison can be scoped to: all hosts, specific team, or specific host
- [ ] Display is on-screen only; no export in v1

**Jira Labels:** `reporting`, `should-have`
**Story Points:** 8

---

#### Feature 9.2: Team Totals Report
As an **Admin** or **Emcee**, I want to see a summary of total coins earned per team for a selected period so that I can evaluate team-level performance.

**Acceptance Criteria:**
- [ ] Report shows: team name, Emcee name, total coins, host count, average coins per host, % of hosts who met quota
- [ ] Sortable by any column
- [ ] Filterable by date range using the standard filter bar
- [ ] Admin sees all teams; Emcee sees only their assigned teams

**Jira Labels:** `reporting`, `should-have`
**Story Points:** 5

---

#### Feature 9.3: Individual Host Performance Report
As an **Admin**, I want to view a detailed performance breakdown for any individual host over a selected period so that I can conduct performance reviews with accurate data.

**Acceptance Criteria:**
- [ ] Report includes: session-by-session history, daily totals, weekly totals, monthly total, quota attainment
- [ ] Sessions the host was absent from (not in any session that day) are visually indicated
- [ ] Date range is filterable with presets
- [ ] Report is accessible from the Host list in the admin panel

**Jira Labels:** `reporting`, `should-have`
**Story Points:** 5

---

### Epic 10: Energetic UI & Motion Design
**Priority:** Should Have
**Description:** The app's visual design should reflect the energy of the live streaming world — bold typography, vibrant accent colors, and motion-friendly layouts. This is especially important on the leaderboard and stats screens. The pre-built component library is the foundation; this epic extends it with the app-specific design language.

---

#### Feature 10.1: Design Token System & Theming
As a **developer**, I want a consistent design token system (colors, typography, spacing) so that the energetic visual style is applied uniformly across all screens.

**Acceptance Criteria:**
- [ ] Color palette defined: primary vibrant accent (e.g., electric violet, hot pink, or similar — see Open Questions #2), neutral dark background, white/light text
- [ ] Typography scale: large, bold headings for key metrics; clean sans-serif for body
- [ ] Tokens are implemented as CSS custom properties or Tailwind config extensions
- [ ] Dark mode is the default (live streaming tools typically use dark UIs); light mode is deferred

**Jira Labels:** `ui-design`, `should-have`
**Story Points:** 5

---

#### Feature 10.2: Leaderboard Animations & Motion
As a **user of any role**, I want the leaderboard to have staggered load animations and smooth rank transitions so that checking rankings feels exciting.

**Acceptance Criteria:**
- [ ] Leaderboard rows animate in with a staggered entrance on page load (top rank first)
- [ ] Top 3 rows have a distinct entrance (e.g., scale + fade)
- [ ] Rank change animations (if real-time updates are enabled) smoothly reorder rows
- [ ] Animations respect the user's `prefers-reduced-motion` media query (disable/simplify if set)
- [ ] Page-level transitions between dashboard views are smooth (fade or slide)

**Jira Labels:** `ui-design`, `should-have`
**Story Points:** 5

---

#### Feature 10.3: Stats & Quota Visualization
As a **Host** or **Emcee**, I want key metrics displayed as visually striking stat cards with progress visualizations so that performance data is immediately impactful at a glance.

**Acceptance Criteria:**
- [ ] Stat cards use large numerical display with vibrant accent color on the key figure
- [ ] Quota progress uses an animated circular progress ring or gradient progress bar
- [ ] Progress ring animates on load (fills from 0 to current value)
- [ ] Cards have subtle glow or elevation effects consistent with the dark-mode design
- [ ] All visualizations are accessible (sufficient color contrast, not color-only encoding)

**Jira Labels:** `ui-design`, `should-have`
**Story Points:** 5

---

### Epic 11: Multi-Tenancy Architecture Foundation
**Priority:** Could Have
**Description:** The app serves a single company in v1, but the data model should be designed to support multiple tenants (companies) without a full rewrite. This epic covers schema-level isolation only — no tenant management UI is included in v1.

---

#### Feature 11.1: Tenant-Scoped Data Model
As a **developer**, I want all core entities to be scoped to a `company` (tenant) record so that adding multi-tenancy in v2 requires configuration changes, not schema redesign.

**Acceptance Criteria:**
- [ ] A `Company` model exists in the database with a single seed record for the current client
- [ ] All entities (Teams, Hosts, Sessions, CoinEntries) have a `company_id` foreign key
- [ ] All API queries include a `company_id` scope by default (enforced at the controller or policy layer)
- [ ] No tenant-switching UI is built in v1
- [ ] Seeds and test factories use the single-company setup

**Jira Labels:** `architecture`, `multi-tenancy`, `could-have`
**Story Points:** 5

---

### Epic 12: Data Export
**Priority:** Won't Have
**Description:** Exporting data to CSV or Excel is a commonly requested feature but is explicitly out of scope for v1. The on-screen reporting in Epic 9 covers the immediate analytical needs. Export will be considered for v2 based on user demand.

⛔ Out of scope for v1.0. Do not begin without explicit PM approval.

---

#### Feature 12.1: CSV / Excel Export
As an **Admin**, I want to export any report or leaderboard view to a CSV or Excel file so that I can share data with stakeholders outside the app.

**Why deferred:** The on-screen reporting in v1 replaces the prior Excel-based workflow. Export adds implementation complexity (background jobs, file generation, security review) that is not justified until the app's reporting views are validated as sufficient by users.

**Jira Labels:** `export`, `wont-have`
**Story Points:** 13

---

### Epic 13: TikTok API Integration
**Priority:** Won't Have
**Description:** Automatically pulling coin data from the TikTok API would eliminate manual entry entirely. However, TikTok's Live API access is restricted and requires business verification. Manual entry is the pragmatic v1 approach.

⛔ Out of scope for v1.0. Do not begin without explicit PM approval.

---

#### Feature 13.1: Automated Coin Sync via TikTok API
As an **Emcee**, I want coin earnings to sync automatically from TikTok so that I don't need to enter data manually.

**Why deferred:** TikTok API access for Live earnings data requires enterprise-level API credentials that the company does not currently hold. Manual entry is the baseline; API sync is a future enhancement contingent on TikTok access approval.

**Jira Labels:** `integrations`, `wont-have`
**Story Points:** —

---

### Epic 14: Mobile Native Applications
**Priority:** Won't Have
**Description:** The web application will be responsive and mobile-browser accessible. Native iOS/Android apps are out of scope for v1.

⛔ Out of scope for v1.0. Do not begin without explicit PM approval.

---

## 7. Technical Constraints & Assumptions

| # | Constraint / Assumption | Source |
|---|---|---|
| 1 | **Backend:** Ruby on Rails in API mode. JSON responses only; no server-rendered HTML | User-specified |
| 2 | **Frontend:** React + Vite. No SSR framework (Next.js, Remix) unless added later | User-specified |
| 3 | **Auth:** Already implemented in the template. Assumed to use a standard session/token mechanism (e.g., Devise + JWT or similar). RBAC built on top of existing auth | User-specified (auth pre-built) |
| 4 | **Dashboard shell & component library:** Already implemented. New features use the existing component system; no new component library selection needed | User-specified |
| 5 | **Deployment:** TBD. No infrastructure or environment assumptions made | User-specified |
| 6 | **Database:** Not specified in the prompt. Assumed PostgreSQL (standard for Rails apps on most platforms) — flagged as Open Question | Assumption |
| 7 | **Real-time updates:** Not explicitly required, but leaderboard and dashboards "updating in real time" implies some mechanism (polling, WebSockets, or SSE). Implementation approach TBD — flagged as Open Question | Assumption |
| 8 | **Scale:** 100+ hosts, 2 sessions/day = ~200 coin entry rows/day, ~6,000/month. This is small by most standards; no special performance architecture required for v1 | Derived from user context |
| 9 | **Multi-tenancy:** Architecture must accommodate future SaaS model. Schema-level tenant scoping (`company_id`) must be in place from day one, even though no tenant management UI is built | User-specified |
| 10 | **Quota target:** 300,000 coins/month is the current target. Stored as a configurable system setting, not hardcoded | Assumption (flagged as Open Question) |

---

## 8. Open Questions

| # | Question | Why It Matters | Owner |
|---|---|---|---|
| 1 | **Host leaderboard visibility:** On the company leaderboard, are all host names visible to individual Hosts, or only their own name with others anonymized? | Privacy policy between hosts; affects leaderboard feature design | PM / Company Stakeholder |
| 2 | **Brand / accent color:** No brand colors specified. What is the primary accent color for the energetic design language (e.g., electric violet, coral, cyan)? | Blocks design token system implementation | Design / Stakeholder |
| 3 | **Database:** Is PostgreSQL the intended database? Or is another DB in use in the existing template? | Affects migration strategy and query design | Developer |
| 4 | **Real-time update mechanism:** Should dashboards and the leaderboard update live as Emcees log entries, or is a manual refresh acceptable for v1? If live, is WebSockets (Action Cable) or polling preferred? | Significant implementation complexity difference | Developer / PM |
| 5 | **Quota target configurability:** Should the 300,000-coin target be configurable per host (different targets for different tier hosts), or is it a single company-wide setting? | Affects quota model design | PM / Company Stakeholder |
| 6 | **Cross-team guest host coins:** When a host from Team A participates in a session led by Team B's Emcee, whose team dashboard reflects those coins? Both? Only the session's primary team? | Affects team totals and dashboard scoping logic | PM / Company Stakeholder |
| 7 | **Historical data migration:** Is there a requirement to import historical Excel data into the app at launch, or do we start fresh from go-live date? | Could add significant pre-launch effort | PM / Company Stakeholder |
| 8 | **Emcee coin entries for cross-team hosts:** Can Team A's Emcee log coins for a Team B host who joined their session, or must that entry be made by Team B's Emcee? | Affects permission model for coin entry | PM / Company Stakeholder |
| 9 | **Auth mechanism details:** What exact mechanism is used in the pre-built template (JWT, session cookies, OAuth)? | Needed before building RBAC on top | Developer |
| 10 | **"On-track" definition for quota:** Is the on-track calculation based on a linear daily rate, or on a custom pacing curve (e.g., weekends excluded)? | Affects quota tracker calculation logic | PM / Company Stakeholder |

---

## 9. Appendix

### Glossary

| Term | Definition |
|---|---|
| **TikTok Coins** | Virtual currency earned by TikTok Live hosts when viewers send them gifts during a live stream |
| **Live Session** | A single live streaming broadcast. Hosts typically perform 1–2 sessions per day |
| **Emcee (MC)** | Team lead responsible for managing a group of hosts and logging their daily coin earnings |
| **Host** | An individual TikTok Live content creator managed by the company |
| **Team** | An organizational unit comprising one Emcee and multiple Hosts |
| **Quota** | The monthly coin target per host — 300,000 coins as of v1.0 |
| **Cross-team Session** | A live session that includes hosts from multiple teams, typically when one team lacks sufficient hosts |
| **Tenant** | In the multi-tenancy context, a single company using the platform. v1 serves one tenant only |
| **MoSCoW** | Prioritization framework: Must Have, Should Have, Could Have, Won't Have |

### Reference Links
- Repo: `dev-adelacruz/points_tracker`
- Jira Project: `PTRA`
- Slack: `#dev-notifications`

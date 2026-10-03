---
name: VocaDash Playful Gamified System
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3d4a3d'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6d7b6c'
  outline-variant: '#bccbb9'
  surface-tint: '#006e2f'
  primary: '#006e2f'
  on-primary: '#ffffff'
  primary-container: '#22c55e'
  on-primary-container: '#004b1e'
  inverse-primary: '#4ae176'
  secondary: '#006591'
  on-secondary: '#ffffff'
  secondary-container: '#39b8fd'
  on-secondary-container: '#004666'
  tertiary: '#9d4300'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff8e4d'
  on-tertiary-container: '#6d2d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6bff8f'
  primary-fixed-dim: '#4ae176'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005321'
  secondary-fixed: '#c9e6ff'
  secondary-fixed-dim: '#89ceff'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#004c6e'
  tertiary-fixed: '#ffdbca'
  tertiary-fixed-dim: '#ffb690'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783200'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Outfit
    fontSize: 2.25rem
    fontWeight: '800'
    lineHeight: 2.75rem
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Outfit
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 1.375rem
    fontWeight: '700'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Outfit
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: 1.75rem
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.9375rem
    fontWeight: '700'
    lineHeight: 1.25rem
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '700'
    lineHeight: 1rem
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.6875rem
    fontWeight: '800'
    lineHeight: 0.875rem
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style
The design system combines the motivational drive of gamified micro-learning with the crisp precision of a contemporary high-end mobile interface. It delivers high-energy reward loops without descending into visual chaos. The emotional goal is immediate agency, delight, and clear momentum: every interaction feels tactile, clicky, and rewarding.

Drawing from modern tactile and soft-gamified paradigms, the aesthetic pairs clean structural framing with chunky, interactive physical metaphors. Interactive components utilize defined bottom borders to simulate physical depth and satisfying press-states, grounded by a clean slate-white foundation that lets vibrant mastery colors pop with maximum contrast and legibility.

## Colors
The color architecture establishes an achievement-first visual language. Apple Green (`#22C55E`) anchors the primary identity, serving as the definitive signal for success, correct responses, active streaks, and primary progression buttons. Sky Blue (`#0EA5E9`) operates as the secondary interactive color, driving navigational affordances, informational highlights, and lesson modules.

Bright Orange (`#F97316`) is the tertiary accent, reserved for critical micro-engagements: streak fires, multiplier badges, and urgency alerts. Golden Yellow (`#FBBF24`) indicates currency, XP gains, and star achievements.

The foundation rests on a clean Slate White canvas (`#F8FAFC`), structured by deep Slate Dark (`#0F172A`) typography for unmatched readability and contrast. Muted Gray (`#94A3B8`) supports uncompleted tracks, disabled states, and auxiliary technical copy. Each chromatic action color requires an intentional shadow partner (e.g., `#16A34A` for primary green; `#0284C7` for sky blue) to render tactile 3D bottom bevels.

## Typography
Typography bridges geometric dynamism with welcoming ergonomics. **Outfit** acts as the headline engine, boasting clean structural geometry and bold roundness that elevates lesson milestones, banner rewards, and score counters.

**Plus Jakarta Sans** delivers clarity across body text, translations, and multi-option selection prompts. It provides open counters and sturdy terminals, maintaining absolute legibility under quick time constraints.

Labels and interactive touch-targets employ elevated font weights (700 and 800) with slight positive tracking to ensure fast readability across chunky, tap-heavy components.

## Layout & Spacing
The layout model prioritizes mobile ergonomics through an adaptive fluid grid centered on a strict 4px/8px modular base. 

- **Mobile Viewports (<640px):** Single-column focus container (maximum 440px width centered) with 16px screen margins (`margin: 1rem`) and 16px vertical gutters. Navigation and bottom-sheet controls lock directly into the mobile thumb-zone.
- **Tablet / Large Handhelds (640px–1024px):** 24px–32px outer canvas margins (`margin-tablet`). Learning pathways remain constrained to a centered 540px flow track, while supplementary dashboards (streak stats, leaderboard previews) move into adjacent peripheral rails.
- **Desktop (>1024px):** 12-column structured view with a fixed max-width container (1120px) and 48px margins (`margin-desktop`), anchoring lesson exercises at center-stage while preserving sidebars for user profiles, inventory, and league standings.

## Elevation & Depth
Depth in this design system rejects hazy diffuse realism in favor of physical, tangible extrusion. Visual hierarchy uses "chunky" 3D bevels paired with crisp ambient support:

- **Level 0 (Flat):** Canvas background (`#F8FAFC`) and passive inline tracks.
- **Level 1 (Card & Bubble Elevation):** Cards utilize a 2px stroke (`#E2E8F0`) reinforced by a 4px solid bottom border (`#CBD5E1`). When raised on clean surfaces, they cast a soft ambient shadow: `0 4px 0 0 rgba(15, 23, 42, 0.05)`.
- **Level 2 (Interactive Gamified Buttons):** Chunky actionable elements employ a solid color surface flanked by a darker 4px solid lower edge (e.g., a green button has a base `#22C55E` and a bottom extrusion of `#16A34A`). When pressed, the element translates down by 3px (`transform: translateY(3px)`), flattening the extrusion to 1px for instant tactile feedback.
- **Level 3 (Modals & Overlays):** Full-screen lesson dialogues and celebration drawers sit atop a semi-transparent slate wash (`rgba(15, 23, 42, 0.4)`), lifted with a playful multi-stage shadow: `0 12px 32px -4px rgba(15, 23, 42, 0.12), 0 4px 12px 0 rgba(15, 23, 42, 0.06)`.

## Shapes
Roundedness level `2` anchors the structural geometry. Default interactive surfaces, containers, and answer tiles apply a standard 0.5rem (`rounded-md`, 8px) to 1rem (`rounded-lg`, 16px) perimeter. 

Pill rounding (`rounded-full`, 9999px) is strictly designated for micro-badges, counters (streaks, gem totals), progress bar indicators, and floating reward chips. Exercise assessment tiles and flashcard blocks rely on `1rem` (16px) rounding to maintain structural rigidity while retaining a friendly, inviting feel.

## Components

### Buttons
Buttons feature an unmistakable 3D tactile extrusion:
- **Primary:** Background `#22C55E`, bottom border 4px solid `#16A34A`, text `#FFFFFF`, font `label-lg`. Hover creates a slight brightness shift; active press executes `translateY(3px)` with the border shrinking to 1px.
- **Secondary:** Background `#0EA5E9`, bottom border 4px solid `#0284C7`, text `#FFFFFF`.
- **Ghost / Neutral Option:** Background `#FFFFFF`, 2px lateral border `#E2E8F0`, bottom border 4px solid `#CBD5E1`, text `#0F172A`.

### Chips & Stat Badges
Pill-shaped containers (`border-radius: 9999px`) designed for gamification metrics. Height is standardized at 32px with 12px horizontal padding.
- **Streak Pill:** Pale orange background (`#FFF7ED`), text `#F97316`, carrying a flame icon.
- **Gem / Currency Pill:** Pale yellow background (`#FEFCE8`), text `#B45309`, carrying a gem icon.

### Selection Lists & Choice Tiles
Used for multiple-choice quiz prompts. Each option tile is built as an elevated card:
- Default state: White surface, 2px solid `#E2E8F0` rim, 4px solid `#CBD5E1` bottom shadow, `rounded-lg` (16px), 16px inner padding.
- Selected state: Light Sky Blue tint (`#F0F9FF`), 2px solid `#0EA5E9` perimeter, bottom border 4px solid `#0284C7`, text `#0369A1`.
- Correct state: Soft green wash (`#F0FDF4`), border `#22C55E`, bottom border `#16A34A`, text `#15803D`.
- Error state: Soft red wash (`#FEF2F2`), border `#EF4444`, bottom border `#B91C1C`, text `#991B1B`.

### Checkboxes & Radios
Custom circular and rounded-square hit targets (28px × 28px). In unselected states, they display an off-white background with a 2px inner border `#CBD5E1`. On selection, they spring into solid `#22C55E` featuring an inward punch animation displaying a bold white check or dot.

### Input Fields
Vocabulary translation inputs feature an off-white fill (`#F8FAFC`), a 2px inset stroke (`#E2E8F0`), and a 3px bottom accent shelf (`#CBD5E1`). On focus, the stroke turns to `#0EA5E9` with a subtle halo (`0 0 0 3px rgba(14, 165, 233, 0.15)`).

### Cards & Lesson Nodes
- **Lesson Stepping Stones:** Circular nodes (64px × 64px) arranged in a winding vertical path. Completed nodes are colored `#22C55E` with `#16A34A` bases; active nodes pulse with a subtle animated halo ring; locked nodes remain muted (`#E2E8F0` surface, `#CBD5E1` base).
- **Streak / Level Cards:** Clean white cards with 16px border-radius, bordered with 2px solid `#F1F5F9`, sporting subtle floating character illustrations and bold Outfit headers.
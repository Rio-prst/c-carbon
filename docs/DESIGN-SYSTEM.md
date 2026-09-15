# Design System

## Status

The PRD defines product UX requirements but does not prescribe an exact font family, color token set, spacing scale, or component token system.

Therefore the visual tokens below are **Recommended Design Direction**, created to make implementation consistent while preserving the PRD's product character.

If a future approved visual reference conflicts with this file, update this file first and then implement.

---

# 1. Product personality

The UI should feel:

- trustworthy
- grounded
- professional
- calm
- agricultural
- data-informed
- human
- optimistic without being playful

It should NOT feel:

- like a crypto app
- like a generic SaaS admin template
- like a fintech trading terminal
- like an AI landing page
- overly futuristic
- overly gamified
- visually noisy

The visual metaphor is:

**a trusted farm record + modern field operations product**, not a speculative carbon marketplace.

# 2. Typography

## Recommended primary font

**Plus Jakarta Sans**

Reason:
- highly legible on mobile
- professional but warmer than many enterprise UI fonts
- good Indonesian-language readability
- works well for both headings and body copy
- contemporary without requiring a futuristic aesthetic

Fallback:
`System` / platform default.

Use a single primary family throughout the mobile app.

## Optional data/identifier font

Use the platform/system monospace only for:
- Digital Farm ID
- policy/reference IDs
- technical codes

Do not use monospace for ordinary UI.

## Type scale

Use a restrained hierarchy. Do not create arbitrary font sizes per screen.

| Token | Size | Line Height | Weight | Typical use |
|---|---:|---:|---:|---|
| Display | 32 | 40 | 700 | rare hero/score emphasis |
| H1 | 28 | 36 | 700 | major screen title |
| H2 | 22 | 30 | 700 | section/page subheading |
| H3 | 18 | 26 | 600 | card title / subsection |
| Body Large | 16 | 24 | 400 | important body |
| Body | 14 | 21 | 400 | default body |
| Body Medium | 14 | 21 | 600 | emphasized body |
| Caption | 12 | 18 | 400 | helper/meta text |
| Label | 12 | 16 | 600 | field labels / metadata |
| Numeric XL | 36 | 42 | 700 | FSS/CRS primary value |
| Numeric L | 28 | 34 | 700 | important metric |
| Button | 14 | 20 | 600 | button labels |

### Typography rules

- Do not use more than 3 text weights on one screen unless necessary.
- Prefer weight changes over arbitrary font-size changes.
- Body text should normally be 14–16 px.
- Avoid text smaller than 12 px.
- Long paragraphs should use 14–16 px with generous line height.
- Numeric scores can be visually prominent, but always include context.
- Never make a number visually important without explaining what it means.

# 3. Spacing system

Use a **4 px base unit**.

Allowed core spacing tokens:

`4, 8, 12, 16, 20, 24, 32, 40, 48`

## Default screen geometry

- Horizontal screen padding: **20 px**
- Compact screen padding: **16 px** only when content density requires it
- Standard vertical section gap: **24 px**
- Small section gap: **16 px**
- Card internal padding: **16 px**
- Large feature card padding: **20 px**
- List item vertical padding: **14–16 px**
- Gap between label and value: **4–8 px**
- Gap between title and supporting text: **6–8 px**

Avoid arbitrary values such as 13, 17, 19, 23, 27 unless required by platform rendering.

# 4. Layout rhythm

Recommended screen rhythm:

```text
Screen edge
20
Page title
8
Supporting text / context
24
Section
16
Content
24
Section
16
Content
32
Bottom safe area
```

A screen should have visible hierarchy. Do not stack multiple dense cards with identical visual weight.

# 5. Color system

## Recommended palette

The palette is intentionally natural and restrained.

### Brand

- `Forest 900` — #173A2B
- `Forest 700` — #24543E
- `Forest 600` — #2F6B4F
- `Forest 500` — #3F7D5B

### Warm agricultural accent

- `Earth 700` — #8A5A32
- `Earth 500` — #B47A45
- `Harvest 500` — #C99A3D

Use warm accents sparingly. They should support agriculture, not turn the app yellow/orange.

### Neutral

- `Ink 900` — #17201C
- `Ink 700` — #37413C
- `Ink 500` — #68736D
- `Ink 300` — #AEB7B2
- `Line` — #DCE2DE
- `Surface` — #F7F9F7
- `White` — #FFFFFF

### Semantic

- Success: `#2F6B4F`
- Warning: `#A66A1F`
- Error: `#B74747`
- Info: `#3C6E91`

Semantic colors should not become decorative colors.

## Color rules

- Most screens should be predominantly neutral/white with restrained forest accents.
- Do not use gradients as a default visual treatment.
- Do not use green for every piece of data.
- Status colors must communicate state, not decoration.
- Avoid neon green for carbon.
- Avoid purple/blue AI-style gradients.
- Avoid using 5+ accent colors on one screen.

# 6. Surfaces and elevation

Use flat surfaces first.

### Border

Default:
- 1 px
- `Line`

### Radius

Use a restrained radius vocabulary:

- 8 px — small controls, inputs
- 12 px — cards, list containers
- 16 px — major feature cards
- 999 px — status badges / compact pills only

Do NOT make every container fully pill-shaped.

### Shadow

Use subtle elevation only for:
- floating action button
- bottom sheet
- important floating surface

Most cards should use border + surface color instead of strong shadow.

# 7. Buttons

## Primary button

Use for the main action on a screen.

- Height: 48 px
- Horizontal padding: 16–20 px
- Radius: 10–12 px
- Weight: 600
- One primary button per visual action group

## Secondary button

- Height: 44–48 px
- Border: 1 px
- Same radius vocabulary
- Lower visual emphasis

## Destructive

Use only for genuinely destructive actions such as rejection/cancellation where appropriate.

Do not use red merely to make an action noticeable.

# 8. Inputs

Standard:
- Height: 48–52 px
- Radius: 8–10 px
- Border: 1 px
- Horizontal padding: 14–16 px
- Label above input
- Helper/error text below

Validation error:
- preserve layout
- explain what needs fixing
- avoid generic "Invalid input"

Do not rely only on red borders to communicate errors.

# 9. Cards

A card is a grouping mechanism, not the default wrapper for everything.

Use cards for:
- Farm identity
- Insurance status
- FSS
- CRS
- meaningful project summaries
- reward summary

Do not:
- put a card inside a card without strong reason
- wrap every section in a card
- create a 3-column dashboard grid on mobile
- create decorative metric cards with no decision value

# 10. Status badges

Use compact pills only for statuses.

Examples:
- ACTIVE
- PENDING
- EXPIRED
- VERIFIED
- REJECTED
- CANDIDATE
- ASSESSMENT
- AGGREGATING

Badge text should be short.

Use icon + text when color alone is insufficient.

# 11. Scores

FSS and CRS are important but must remain understandable.

## Score hierarchy

```text
Score label
Short interpretation
82
Good / Ready for ...
Small supporting context
Breakdown
Next action
```

Never display:

`82` alone.

## Visualization

Preferred:
- circular/radial progress for a single score
- horizontal progress for individual breakdown items

Do not use:
- gauges resembling car dashboards
- decorative charts
- 3D charts
- chart-heavy screens

## FSS

Emphasize:
- current score
- provisional/verified status
- breakdown
- actionable interpretation

## CRS

Emphasize:
- readiness level
- completeness/eligibility
- what is still needed
- pathway toward candidate project

# 12. Navigation

Use Expo Router.

Farmer mobile should prioritize the main product areas and preserve the golden path.

Bottom navigation should remain limited to the most important destinations. Secondary screens should be reached through contextual navigation.

Do not create a tab for every domain.

# 13. Icons

Use one icon family consistently.

Recommended: Lucide-style outline icons.

Rules:
- 20–24 px for standard actions
- 16–20 px for compact metadata
- never use icons as decoration without meaning
- do not mix multiple icon styles

# 14. Imagery

Use agricultural imagery only when it supports trust or context.

Avoid:
- stock-photo-heavy dashboards
- generic "happy farmer" hero images on every screen
- decorative farm illustrations everywhere

The product is primarily a data/record application.

# 15. Loading states

PRD requirement:
- prefer skeleton/placeholder shapes that resemble the final content
- avoid full-screen spinners as the default

Skeletons should preserve the final layout dimensions.

# 16. Empty states

Every meaningful empty state should explain:

1. what is empty
2. why it matters
3. what the user can do next

Example for no farms:
- concise explanation
- clear CTA: "Daftarkan Farm Pertama Anda"

Do not use empty states as decorative illustrations with no action.

# 17. Error states

Use:
- short human explanation
- Retry when appropriate
- preserve user-entered form data when possible

Never show raw backend errors.

# 18. Motion

Motion should be subtle and functional.

Use animation for:
- state transition
- button feedback
- score reveal
- bottom sheet
- navigation transition

Avoid:
- excessive bouncing
- long intro animations
- decorative floating animations
- animation on every card

# 19. Copy style

Use Indonesian UI copy unless a specific requirement says otherwise.

Tone:
- direct
- respectful
- practical
- clear

Avoid:
- "Welcome back!"
- marketing-heavy language
- exaggerated financial promises
- technical jargon without explanation

# 20. Anti-AI-slop rules

Do not generate:
- gradient hero sections by default
- giant "Welcome" headings
- excessive rounded rectangles
- every section as a card
- random metric cards
- meaningless progress bars
- fake activity feeds
- fake testimonials
- unnecessary badges
- excessive emojis
- crypto coin imagery
- neon carbon visuals
- purple AI gradients
- glassmorphism
- excessive shadows
- decorative charts
- repeated identical card compositions
- generic SaaS dashboard layouts

A design decision must have a product reason.

# 21. Implementation token source

Create one central theme/token layer in the mobile app.

Suggested:

```text
mobile/lib/theme/
├── colors.ts
├── typography.ts
├── spacing.ts
├── radii.ts
├── shadows.ts
└── index.ts
```

Components must consume tokens instead of hardcoding arbitrary values.

Do not scatter hex colors or random spacing values across screen files.

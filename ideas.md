# JOBLENS Design Direction

## Approach Options

### Theme Name: Editorial Lens
Very brief intro: A warm, intelligent career workspace that treats resume review like an editorial craft: focused, calm, and evidence-led.
Probability: 0.07

### Theme Name: Signal Desk
Very brief intro: A crisp information-design system with paper white, graphite, and measured signal colors for a highly legible analyst experience.
Probability: 0.04

### Theme Name: Orbit Career Lab
Very brief intro: A more expressive, dark-first direction where role fit, skills, and readiness orbit around a central career signal.
Probability: 0.02

## Selected Approach: Editorial Lens

### Design Movement
Contemporary editorial product design, blending Swiss information design with tactile magazine layouts and subtle risograph texture.

### Core Principles
1. Make complex analysis feel calm and understandable.
2. Use asymmetry and whitespace to create focus rather than filling every surface.
3. Let evidence, score explanations, and user-controlled next steps lead the experience.
4. Pair premium visual craft with direct, humane language.

### Color Philosophy
Parchment cream is the canvas: approachable, warm, and less clinical than pure white. Ink navy carries trust and high-contrast reading. Coral is the signature action color, used sparingly to signal movement and confidence. Saffron and sage distinguish insight states without turning the UI into a traffic light.

### Layout Paradigm
Use a split editorial frame: a persistent left rail for identity and workflow, with an asymmetric main canvas that alternates between wide analysis narratives and compact evidence cards. On the landing page, the hero is offset: copy occupies the left third while the lens illustration anchors the right.

### Signature Elements
1. A circular lens/target motif used for brand mark, score rings, and section markers.
2. Thin editorial rules and small uppercase labels that make the interface feel considered.
3. Soft paper grain and offset coral accents that add tactile depth without visual noise.

### Interaction Philosophy
Interactions should reduce uncertainty. Every primary action shows what happens next; every score has a visible rationale; every not-identified skill is phrased neutrally. Use instant feedback for selection and upload, with restrained motion for transitions and staged analysis.

### Animation
Use 180–280ms ease-out transitions for buttons, cards, and tabs. Stagger section reveals by 40ms. Animate score rings from zero only when results enter view, and pair them with a count-up label. Use a subtle shimmer during analysis. Respect prefers-reduced-motion and never animate layout dimensions.

### Typography System
Use Fraunces for display headlines and section numerals, with DM Sans for body copy, labels, and controls. Headlines should be compact and editorial; labels are uppercase with generous tracking; body text stays at 15–17px with 1.55 line height. Avoid all-caps for long copy.

### Brand Essence
JOBLENS is the career clarity workspace for candidates who want an honest read on their resume and a practical path to improve it. Personality: focused, candid, encouraging.

### Brand Voice
Headlines sound clear and quietly confident. CTAs are specific and active. Microcopy explains consequences without fear or false certainty.

Example lines:
- “See the signal in your resume.”
- “A gap is not a verdict. It is your next edit.”

### Wordmark & Logo
Use a custom lens mark: a navy circular aperture with a coral forward arrow cut through its center. The wordmark is set in a high-contrast editorial serif with a slightly tightened tracking treatment; it should never look like default UI text.

### Signature Brand Color
Lens Coral — #E7684A. Use for primary actions, active state markers, and the forward arrow in the mark.

## Style Decisions
- Keep the first delivery light-first, with an ink-navy rail and parchment analysis canvas.
- Use generated imagery only for the hero and supporting editorial feature moments; keep the analytical dashboard mostly typographic and data-led.
- Do not imply guaranteed hiring outcomes. Present fit and readiness as estimates with clear disclaimers.
- Use neutral phrasing such as “not identified in the uploaded resume” for gaps.

## File-Specific Reminders
- `client/src/index.css`: preserve the Editorial Lens tokens, paper texture, contrast, and reduced-motion rules.
- `client/src/pages/Home.tsx`: keep the asymmetric hero, lens motif, and calm evidence-led copy.
- `client/src/App.tsx`: preserve the single-page app shell and route future workflow states without dead ends.

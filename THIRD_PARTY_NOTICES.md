# Third-party notices

## Runtime code shipped to visitors

**GSAP 3.15.0 and ScrollTrigger** — © GreenSock (Webflow). Distributed under the GSAP Standard "No Charge" License, https://gsap.com/standard-license. GSAP is **not** MIT-licensed: it is free to use, but its own licence terms apply to anyone reusing this repository — read them at the link above before reusing the code elsewhere. The package is pinned to an exact version in `package.json` and loaded on demand only by `src/scripts/timeline.ts` (Journey section).

**Mona Sans** — © GitHub. SIL Open Font License 1.1, https://openfontlicense.org. Self-hosted through `@fontsource-variable/mona-sans`.

No other runtime library is shipped. React, Motion (Framer Motion), dnd-kit and Lenis are **not** used — see "Implementation choices" in the README.

## Build-time tools (not shipped)

Astro, `@astrojs/check`, TypeScript and their dependencies, under their respective open-source licences (MIT and compatible), as listed in `package-lock.json`.

## Images

Photographs are credited individually in [CREDITS.md](CREDITS.md) and `src/data/credits.json`: CC0 1.0, CC BY 2.0 and 4.0, CC BY-SA 2.0, 3.0 and 4.0. Files taken from Ubuntu artwork packages (archive.ubuntu.com: `ubuntu-wallpapers`, `budgie-wallpapers`, `xubuntu-community-artwork`, `ubuntu-mate-artwork`) keep the licences stated in each package's `debian/copyright`; the packages' own GPL licences cover their code, not the photographs. Images whose package licence was contradicted by the photographer's own page were not used.

## Interaction references (behaviour reimplemented, no code copied)

- **Dock navigation** — the Dock component by ibelick (motion-primitives, MIT, https://github.com/ibelick/motion-primitives), shown on 21st.dev. Its interaction model — one pointer tracker over the whole dock, distance-based magnification of each item with neighbours responding, spring settling (mass 0.1, stiffness 150, damping 12), labels above the items — was reimplemented from scratch in `src/scripts/nav.ts` without Motion or React. The MIT licence is noted here as a courtesy; no source was copied.
- **Navigation drop** — original to this project (surface tension → drop → Dock), built with `clip-path` and `transform` only.
- **Stack Spread (“What moves me”)** — the Stack Spread component of Hyperiux Vault (MIT, https://21st.dev/@hyperiux/components/stack-spread): a pinned stage where a clustered stack of cards scatters into a composition as the section scrolls (hold → scatter → settle, per-card stack pose and resting pose, pointer parallax once spread). The mechanics were studied and reimplemented in `src/scripts/passions.ts` without React or Motion, and extended with native CSS 3D depth (perspective, per-card Z planes and rotations) and seeded, constraint-based placement; no source was copied. The previous perspective image stream, inspired by Ruixen UI's Image Stream Hero, has been removed.
- **Draggable Bento** — sortable bento grid studies by Carolina Raulino. Re-implemented as a dependency-free module (`src/scripts/bento.ts`).
- **Scroll-driven timeline** — scroll storytelling work by Hyperiux. Re-implemented with GSAP ScrollTrigger (`src/scripts/timeline.ts`).

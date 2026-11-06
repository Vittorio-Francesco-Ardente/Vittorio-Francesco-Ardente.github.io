# Dalmine expand-map component

The public VFA portfolio is static GitHub Pages (HTML/CSS/JS). It intentionally
has no React runtime, npm lockfile, Tailwind compiler, or shadcn CLI project.
For the **live** website, `/_assets/vfa-location-expand-20261106.js` implements
the requested map behavior using a native button and CSS transitions, while
`/_assets/vfa-dalmine-profile-20261106.svg` preserves the actual municipal
boundary instead of inventing roads or buildings.

For a **future React + TypeScript + Tailwind + shadcn** site, use
`/components/ui/expand-map.tsx` (demo: `/components/ui/expand-map-demo.tsx`).
Its animation relies on the actual `framer-motion` APIs.

```bash
npx create-next-app@latest vfa-react --typescript --tailwind --eslint --app --import-alias "@/*"
cd vfa-react
npx shadcn@latest init
npm install framer-motion
```

The `components/ui` folder is shadcn's conventional UI-component location.
Its `@/components/ui` imports work when the `@/*` alias is configured
in `tsconfig.json`. Copy the ISTAT SVG to the new project's
`public/_assets/vfa-dalmine-profile-20261106.svg`.

Reference implementation: supplied Framer Motion Expand Map component.
Location geometry: ISTAT 2026 non-generalized administrative boundaries,
municipal code 016091, CC BY 4.0. Coordinates printed are approximate
municipal reference coordinates, not the author's private address.

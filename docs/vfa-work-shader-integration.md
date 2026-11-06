# VFA GradFlow stripe component and native site

The published VFA portfolio is **static HTML, CSS and JavaScript** served by
GitHub Pages. It deliberately has no React, Next.js, npm dependencies,
TypeScript compiler, Tailwind build, or shadcn CLI project.

The supplied React component is preserved at
`/components/ui/stripe-like-gradient-shader.tsx`, with its exact color values
(white, turquoise, purple), speed 0.4, scale 1, type 'stripe', and noise 0.08.
`/components/ui/demo.tsx` is the demonstration.

To use the React component in a future *separate* shadcn + Tailwind +
TypeScript application:

```bash
npx create-next-app@latest vfa-react --typescript --tailwind --eslint --app --import-alias "@/*"
cd vfa-react
npx shadcn@latest init
npm install gradflow
```

The expected shadcn location for reusable UI primitives is `/components/ui`.
The `@/components/ui/...` import in demo.tsx relies on the `@/*`
TypeScript alias in tsconfig.json.

The live contact page instead has a native business-card animation, a bespoke
blue/white textured SVG banner and a map of Dalmine's real streets. OSM tiles
are requested only after a user expands the visiting card. A real road route
is fetched from OSRM when available; no fictitious roads are drawn if routing
fails. The administrative outline is ISTAT 2026, license CC BY 4.0.
OSM street maps require visible attribution and comply with OSM's
tile usage policy.

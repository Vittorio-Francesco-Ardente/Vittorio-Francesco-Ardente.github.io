# Stripe-like gradient shader: integration notes

The current VFA portfolio is a static GitHub Pages site: prebuilt HTML, CSS and JavaScript.
It does **not** have a React/TypeScript/Tailwind build pipeline or a shadcn component registry.
The live /lavori route uses `/_assets/vfa-work-stripe-20261106.js` to render an on-brand WebGL counterpart,
without changing the existing markup, layout or deployment process.

The requested React component is preserved in `/components/ui/stripe-like-gradient-shader.tsx`,
with an example in `/components/ui/demo.tsx`.

To use the React version in a **separate or migrated** project:

```bash
npx create-next-app@latest vfa-react --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd vfa-react
npx shadcn@latest init
npm install gradflow
```

Copy `components/ui/stripe-like-gradient-shader.tsx` into the React project's
`components/ui/` directory. In shadcn, this is the conventional location for
reusable UI primitives; the `@/components/ui` import in `demo.tsx` depends on
the configured `@/*` path alias. Tailwind styles are generated through the
Next.js build and are not included in the static site's CSS.

The live static version is intentionally separate. Do not add React scripts or
npm dependencies to GitHub Pages without a separate build step.

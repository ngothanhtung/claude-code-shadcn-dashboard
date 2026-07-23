---
kind: build_system
name: Next.js App Build & Dev Toolchain
category: build_system
scope:
  - "**"
source_files:
  - package.json
  - next.config.ts
  - tsconfig.json
  - postcss.config.mjs
  - components.json
---

This repository is a single Next.js application and relies on the standard Next.js build pipeline. There are no custom Makefiles, Dockerfiles, CI pipelines, or release scripts — all build, lint, dev, and start commands are defined in package.json and delegated to Next.js itself.

Build system used

- Framework: Next.js 16 (App Router) with Turbopack enabled via turbopack: {} in next.config.ts.
- Compiler: TypeScript 5 with strict mode, moduleResolution bundler, isolatedModules, and the Next.js TS plugin.
- Styling pipeline: Tailwind CSS v4 + PostCSS driven by @tailwindcss/postcss.
- Linting: ESLint 9 via eslint-config-next.
- Formatting: Prettier (.prettierrc, .prettierignore).

Key configuration files

- package.json — defines the four npm scripts (dev, build, start, lint) and pins all runtime/dev dependencies.
- next.config.ts — experimental package-import optimization for lucide-react and @radix-ui/react-icons, image remote patterns, security headers, and a /home to /dashboard redirect.
- tsconfig.json — strict TS config with Next.js plugin, path aliases, incremental builds, and noEmit.
- postcss.config.mjs — Tailwind v4 integration.
- components.json — shadcn/ui project configuration.

Artifacts and output

- Development: next dev runs the Turbopack-powered dev server.
- Production build: next build produces an optimized production bundle under .next/.
- Runtime: next start serves the built app from .next/.

Conventions and constraints

- No custom build scripts, Docker images, or CI definitions exist in this repo; everything is handled through the Next.js CLI.
- All imports should use the @/ path alias rather than relative ../../ chains into src/.
- The app is marked private in package.json — it is not published as an NPM package.
- Image optimization is restricted to whitelisted remote hosts (ui.shadcn.com, images.unsplash.com) via remotePatterns; other domains will be rejected at build time.

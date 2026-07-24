---
kind: frontend_style
name: Shadcn/ui + Tailwind CSS Theme System with Runtime Customizer
category: frontend_style
scope:
    - '**'
source_files:
    - components.json
    - postcss.config.mjs
    - src/app/globals.css
    - src/types/theme.ts
    - src/utils/shadcn-ui-theme-presets.ts
    - src/utils/tweakcn-theme-presets.ts
    - src/config/theme-data.ts
    - src/hooks/use-theme-manager.ts
    - src/components/theme-provider.tsx
    - src/contexts/theme-context.ts
---

This project uses a shadcn/ui component library built on top of Tailwind CSS v4, with a comprehensive runtime theme customization system that rewrites CSS custom properties at runtime. The styling approach combines static design tokens with dynamic theme switching and an in-app visual theme editor.

**Core Styling Stack:**
- **Tailwind CSS v4** via `@tailwindcss/postcss` plugin (no traditional `tailwind.config.js`) — styles are declared directly in `src/app/globals.css` using the new `@theme inline` directive
- **shadcn/ui** configured with "new-york" style preset, CSS variables enabled, and Lucide icons
- **CSS custom properties** as the single source of truth for all design tokens (colors, radius, fonts, spacing)
- **Dark mode** implemented through `.dark` class toggling on `documentElement`

**Design Token Architecture:**
The token system is organized in layers:
1. **Base tokens** defined in `src/app/globals.css` under `:root` and `.dark` selectors using OKLCH color space
2. **Token mapping** via `@theme inline { --color-*: var(--*) }` declarations that expose CSS variables to Tailwind's utility classes
3. **Theme presets** stored as TypeScript objects in `src/utils/shadcn-ui-theme-presets.ts` (built-in) and `src/utils/tweakcn-theme-presets.ts` (community/community-contributed themes like Catppuccin, Twitter, Doom 64)
4. **Runtime application** through `useThemeManager` hook which writes CSS variables directly to `document.documentElement.style`

**Theme Switching Flow:**
- `ThemeProvider` (client component) manages light/dark/system mode by toggling CSS classes
- `useThemeManager` provides methods to apply full theme presets (`applyTheme`, `applyTweakcnTheme`), import custom themes (`applyImportedTheme`), or modify individual tokens (`handleColorChange`, `applyRadius`)
- Theme state persists in localStorage via the provider's storage key mechanism
- The theme customizer UI (`src/components/theme-customizer/`) exposes these capabilities through tabs for layout, colors, and typography

**Component Library Conventions:**
- All UI primitives live in `src/components/ui/` following shadcn/ui conventions
- Components use `cn()` utility from `@/lib/utils` for conditional className merging
- Components consume design tokens exclusively through Tailwind utilities (`bg-background`, `text-primary`, etc.) rather than direct CSS variable references
- No SCSS/Sass — pure CSS with Tailwind's new engine

**Responsive Strategy:**
- Mobile-first responsive design using Tailwind's breakpoint prefixes
- Sidebar variants support multiple layouts (default, inset, side, bottom) with responsive behavior
- Custom media queries handle edge cases like right-side sidebar positioning

**Key Files:**
- `components.json` — shadcn/ui configuration and aliases
- `postcss.config.mjs` — Tailwind v4 PostCSS setup
- `src/app/globals.css` — base styles, theme variables, and global animations
- `src/types/theme.ts` — TypeScript definitions for theme structure
- `src/hooks/use-theme-manager.ts` — core theme manipulation logic
- `src/config/theme-data.ts` — bridges preset data to the customizer UI
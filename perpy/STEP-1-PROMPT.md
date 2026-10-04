Paste this into Claude Code to start step 1:

---

I'm building "perpy", a social trading app where traders' perpetual futures
trades on Hyperliquid are public, verified, and shared as posts. I'm new to
coding, so explain what you're doing in plain language and tell me exactly
what to run and what I should see.

This first step is ONLY the project setup and static pages. No database,
no wallet login, no live data yet.

1. Create a Next.js app (App Router, TypeScript) in this folder.
2. design/perpy-designs.html is the approved design. Recreate its look as real
   components: the layout (left nav, center column, right column on desktop;
   top bar and bottom tabs on mobile), colors, fonts, light and dark mode.
   Keep its CSS approach rather than switching frameworks.
3. Build these pages with the same mock data the design file uses:
   - / (home feed with the story rings and trade cards)
   - /u/[handle] (profile)
   - /post/[id] (trade post)
4. Set up Git, make a first commit, and walk me through pushing to GitHub
   and deploying to Vercel so the site is live at a URL.

Work one step at a time and stop after each to let me check it in the
browser before continuing. Never put API keys or secrets in the code.

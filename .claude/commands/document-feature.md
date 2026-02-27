# document-feature

Generate developer + user documentation for a newly added feature.

## Input
- Feature name: {{feature_name}}

## Goals
1) Analyze the codebase to understand the feature’s behavior and touchpoints.
2) Produce TWO markdown documents:
   - Developer documentation (technical): specs, APIs, data model changes, implementation notes, tests, config, rollout
   - User documentation (friendly): what it does, prerequisites, step-by-step instructions, screenshot placeholders, FAQs/troubleshooting
3) Follow existing documentation conventions in this repo (structure, headings, tone, linking).
4) Cross-link the two docs.
5) Detect whether the feature is frontend / backend / full-stack and adapt accordingly.

## Steps
1) Discover documentation conventions:
   - Scan: docs/README.md, docs/dev/, docs/user/ (or equivalent)
   - Identify common template patterns: frontmatter, heading structure, linking style
   - Reuse the dominant style

2) Locate relevant code:
   - Search for the feature name and close variants (kebab, snake, camel, title-case).
   - Identify touched areas:
     - Backend: routes, controllers, handlers, services, DB migrations, env/config, auth/permissions, background jobs
     - Frontend: pages/routes, components, hooks, state management, API clients, i18n strings
     - Full-stack: contract alignment, DTOs/types, shared validation schemas
   - List the “source of truth” files used to infer behavior.

3) Determine feature type:
   - Frontend-only if no backend endpoints / DB changes are involved.
   - Backend-only if no UI/UX surfaces exist.
   - Full-stack if both UI + server/contract changes exist.
   - State the reasoning briefly in dev doc.

4) Generate Developer Documentation
   - Output file path: docs/dev/{{feature_slug}}-implementation.md
   - Include sections (adapt to repo style):
     - Overview
     - Scope and non-goals
     - Architecture / flow (sequence style narrative)
     - API endpoints (method, path, request/response examples)
     - Data model / migrations (if any)
     - Key modules/files and why they matter
     - Edge cases and failure modes
     - Security/permissions considerations
     - Observability (logs/metrics/traces)
     - Tests added / how to run
     - Rollout plan (feature flags, backward compat, migrations order)
     - Links to related docs

5) Generate User Documentation
   - Output file path: docs/user/how-to-{{feature_slug}}.md
   - Use simple language and concise steps.
   - Include:
     - What this feature is
     - Who it’s for
     - Before you start (requirements)
     - Step-by-step instructions (numbered)
     - Screenshot placeholders for key steps:
       - Use either Markdown image placeholders or HTML comments:
         - <!-- TODO screenshot: describe what should be captured -->
       - Include at least 3 placeholders at the most important steps
     - Troubleshooting / FAQ
     - Link to the dev doc for technical details

6) Cross-links
   - In dev doc: add “User guide: ../user/how-to-{{feature_slug}}.md”
   - In user doc: add “Technical details: ../dev/{{feature_slug}}-implementation.md”
   - Also auto-link any existing related docs discovered (auth, settings, API reference, UI patterns).

## Output
- Create or overwrite the two files above.
- At the end, print:
  - paths created
  - key code files referenced
  - detected feature type (frontend/backend/full-stack)
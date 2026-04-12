# nestbot

Next.js app: train an AI assistant on site content, dashboard, Stripe billing, embeddable `widget.js` for visitor chat.

## Setup

```bash
npm install
cp .env.example .env   # fill DATABASE_URL, Clerk, OpenAI, Stripe, etc.
npm run db:push
npm run db:seed        # optional — demo assistant
npm run dev
```

If **`Another next dev server is already running`** (Next.js 16 single-dev lock):

```bash
npm run dev:fresh      # frees ports 3000–3002, then starts dev
```

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run build` | Production build |
| `npm run verify:embed` | CORS + `/widget.js` smoke (app must be running) |

See `.env.example` for environment variables.

## Layout

- `src/app` — App Router pages and API routes  
- `public/widget.js` — customer embed script  

Agent / editor rules: `AGENTS.md` (and `CLAUDE.md` → `AGENTS.md`).

# Momentum

Feature tracking dashboard for product work, styled after the attached Figma board and ready to deploy on Vercel.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Vercel-ready server routes

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env template:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in your Meego MCP values:

- `MEEGO_MCP_URL`: MCP endpoint, typically `https://meego.larkoffice.com/mcp_server/v1`
- `MEEGO_MCP_TOKEN`: Meego MCP token
- `MEEGO_PROJECT_KEY`: the Meego space key the app should query

4. Start the app:

   ```bash
   npm run dev
   ```

## Meego wiring

- The card layout and product metadata live in `src/lib/feature-registry.ts`
- Live status sync is handled in `src/lib/meego.ts`
- `GET /api/features` returns the same normalized dashboard payload used by the page

The current implementation connects to the Meego MCP server and uses `get_workitem_brief` to read `work_item_status`. It maps that status into four dashboard states:

- `planned`
- `in_progress`
- `launched`
- `at_risk`

If your Meego workspace uses different state keys, update the state mapping sets in `src/lib/meego.ts`.

## Deploying to Vercel

1. Import the GitHub repo into Vercel.
2. Add the Meego MCP environment variables in the Vercel project settings.
3. Deploy.

If the Meego MCP credentials are missing, the app falls back to preview data so the UI still renders.

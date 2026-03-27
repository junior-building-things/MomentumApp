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

4. Optional: fill in Legal Compliance API values if you want the `Compliance` column to auto-resolve and create tickets:

- `LEGAL_BASE_URL`: typically `https://legal.bytedance.net`
- `LEGAL_APP_ID`: your Legal API app id
- `LEGAL_APP_SECRET`: your Legal API app secret
- `LEGAL_DEFAULT_EMPLOYEE_ID`: the default employee number used as applicant / business owner for created tickets
- `LEGAL_DEPARTMENT_ID`: optional responsible department id
- `LEGAL_PRODUCT_ID`: optional Legal product id
- `LEGAL_REVIEW_CATEGORY_CODE`: optional review category code
- `LEGAL_AUTO_SUBMIT_ON_CREATE`: set to `true` if created tickets should be initiated immediately; default `false`

5. Start the app:

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

## Legal compliance wiring

- Legal integration is handled server-side in `src/lib/legal.ts`
- The dashboard enriches Meego stories with compliance links by calling Legal `getByMeegoWorkItemId`
- If Legal is configured, rows without a compliance ticket show a `Create` action in the `Compliance` column
- Creating a compliance ticket currently uses the Meego story URL as `sourceLink`, the Meego work item id as `sourceBusinessId`, and the PRD URL as `requirementDocLink`
- By default, created compliance tickets are saved as drafts unless `LEGAL_AUTO_SUBMIT_ON_CREATE=true`

## Deploying to Vercel

1. Import the GitHub repo into Vercel.
2. Add the Meego MCP environment variables in the Vercel project settings.
3. Add the Legal Compliance environment variables too if you want compliance sync and ticket creation.
3. Deploy.

If the Meego MCP credentials are missing or the story lookup fails, the app shows an empty live-data state instead of mock cards.

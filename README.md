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

3. Fill in your Meego values:

- `MEEGO_PROJECT_KEY`: your Meego department/project key
- `MEEGO_OPEN_API_TOKEN`: Meego open API token
- `MEEGO_AUTH_HEADER`: auth header name if Meego expects something other than `Authorization`
- `MEEGO_AUTH_SCHEME`: auth prefix such as `Bearer`; leave blank if the token should be sent raw

4. Start the app:

   ```bash
   npm run dev
   ```

## Meego wiring

- The card layout and product metadata live in `src/lib/feature-registry.ts`
- Live status sync is handled in `src/lib/meego.ts`
- `GET /api/features` returns the same normalized dashboard payload used by the page

The current implementation maps Meego `work_item_status` values into four dashboard states:

- `planned`
- `in_progress`
- `launched`
- `at_risk`

If your Meego workspace uses different state keys, update the state mapping sets in `src/lib/meego.ts`.

## Deploying to Vercel

1. Import the GitHub repo into Vercel.
2. Add the Meego environment variables in the Vercel project settings.
3. Deploy.

If the Meego credentials are missing, the app falls back to preview data so the UI still renders.

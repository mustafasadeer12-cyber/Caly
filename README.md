# Caly

A minimal, cross-platform macro-nutrient tracker. Log meals, track calories and macros against daily goals, keep streaks, manage a food database and recipes, and check off supplements.

## Stack

- **Frontend:** React + Vite + Tailwind CSS, Radix primitives, lucide-react, Recharts, date-fns
- **Backend:** Vercel Serverless Functions (`/api`) + MongoDB Atlas (Mongoose)
- **Auth:** JWT (`Authorization: Bearer`), ownership enforced per user in every function

## Local development

The API routes only run under the Vercel runtime, so use `vercel dev` (not `npm run dev`):

```bash
npm install
npm i -g vercel
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET
vercel dev
```

## Deployment

1. Push the repo to GitHub and import it in Vercel.
2. Set `MONGODB_URI` and `JWT_SECRET` in Project Settings → Environment Variables.
3. Deploy — the Vite build and `/api` functions are detected automatically. `vercel.json` rewrites deep links (e.g. `/History`) to `index.html`.

## CSV / Excel import format

Headers (first row): `name, brand, calories, protein, carbs, fat, unit_name, unit_weight_grams` — macro values are per 100g; `brand` and the unit columns are optional.

## Notes

- Ruined days and theme are stored in `localStorage`, not the database.
- MealLog macros are denormalized at log time, so editing a food never rewrites history. Editing a food that recipes use prompts a recipe recalculation.

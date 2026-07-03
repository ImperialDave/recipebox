# The Family Recipe Box

A warm, trustworthy digital heirloom cookbook designed for families. Store rich recipes with photos and stories, share safely with role-based family groups, and print beautifully formatted recipes.

## Features

- **Passwordless magic link + password authentication** via Firebase Auth
- **Family groups** with Admin / Editor / Viewer role-based permissions
- **Rich recipe management** — ingredients, instructions with timers, tags, categories, photos
- **Powerful search & filters** — category pills, tag filters, time ranges, sort options
- **Cooking Mode** — full-screen step-by-step with timers and check-off
- **Print-optimized layouts** — high contrast, large type, clean margins
- **Favorites, meal planner, and shopping list**
- **10 seeded family recipes** when you create a new group
- **Dark mode & large text** accessibility options

## Tech Stack

- **Next.js 15+** (App Router) with TypeScript
- **Tailwind CSS v4** with custom warm design system
- **Firebase** — Auth, Firestore, Storage, Security Rules
- **Railway** — Production deployment

## Quick Start (Local)

### 1. Install dependencies

```bash
cd projects/family-recipe-box
npm install
```

### 2. Set up Firebase

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Email/Password and **Email link (passwordless sign-in)**
3. Create a **Firestore Database** (production mode)
4. Create a **Storage** bucket
5. Register a **Web app** and copy the config values
6. Go to **Project Settings → Service Accounts** → Generate new private key

### 3. Deploy Firebase rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### 4. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase client config and paste the service account JSON as a single-line string for `FIREBASE_SERVICE_ACCOUNT_KEY`.

In Firebase Console → Authentication → Settings → Authorized domains, add `localhost`.

For magic links, add your callback URL under **Authentication → Templates** if needed.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Railway

1. Push this project to GitHub
2. Create a new project on [railway.app](https://railway.app)
3. Connect your GitHub repo
4. Add all environment variables from `.env.local.example`:
   - All `NEXT_PUBLIC_FIREBASE_*` variables
   - `FIREBASE_SERVICE_ACCOUNT_KEY` (paste JSON as single line)
   - `NEXT_PUBLIC_APP_URL` (your Railway domain, e.g. `https://family-recipe-box.up.railway.app`)
5. Railway will auto-detect `railway.toml` and deploy

After deploy, add your Railway domain to Firebase **Authorized domains**.

## Project Structure

```
src/
├── app/
│   ├── (main)/          # Authenticated app pages
│   ├── api/auth/        # Session cookie management
│   ├── login/           # Auth pages
│   └── auth/callback/   # Magic link handler
├── components/          # UI and feature components
├── lib/
│   ├── firebase/        # Firebase client, admin, auth, permissions
│   ├── actions/         # Server actions
│   └── queries.ts       # Data fetching
firebase/
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
└── firestore.indexes.json
```

## Firestore Collections

| Collection | Description |
|---|---|
| `users/{uid}` | User profiles |
| `groups/{id}` | Family groups |
| `groups/{id}/members/{uid}` | Group membership & roles |
| `recipes/{id}` | Recipes with embedded ingredients/instructions |
| `comments/{id}` | Recipe family notes |
| `favorites/{uid}_{recipeId}` | User favorites |
| `mealPlans/{id}` | Weekly meal plan entries |
| `shoppingLists/{uid}/items/{id}` | Shopping list items |

## Role Permissions

| Permission | Admin | Editor | Viewer |
|---|---|---|---|
| View & print recipes | ✅ | ✅ | ✅ |
| Add comments | ✅ | ✅ | ✅ |
| Create & edit recipes | ✅ | ✅ | ❌ |
| Delete recipes | ✅ | ✅* | ❌ |
| Manage members | ✅ | ❌ | ❌ |

*Editors can delete recipes they have access to; admins can delete any group recipe.

## License

MIT
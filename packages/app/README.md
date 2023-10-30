# app

A client running on Next.js using the experimental app router.

## Setup

Make sure to edit `src/config/config.ts` after you've deployed your api resources so the client knows where to connect to.

You can make sure the S3 bucket commands run via `bash` (and not `sh`) by setting the following npm config:
```sh
npm config set script-shell /bin/bash
```

## Running

```sh
npm i
npm run dev
```

## Deployment

First, deploy the backend resources in api and take note of the S3 hosting bucket that's created.

Build the client using:
```sh
npm run clean
npm run build
```

Verify that `dist/` folder has built static assets (html/css/js), and copy to the S3 bucket.

Finally, check the Cloudfront deployment url to check that everything worked and test out the app.

## Development

### Project structure

#### Routing

All routes are under `app/`; page router is not used. As a quick routing example, the item history page for an `item1` at `http://localhost:3000/items/[item1]` corresponds to the page at `app/items/[id]/page.tsx`. The main page switches between the auth form in `app/(auth)` and the rest of the app pages in `app/(app)` depending on whether a user session is present. The folders `(auth)` and `(app)` are for grouping purposes only and do not impact routing.

`src/app/` is for layouts and pages, i.e. views. Components should be in `src/components`.

#### Components

Contains reusable and some larger single use React components. Some one off hooks only for a particular component are collocated in the same folder as the component, for example `src/components/grid/DataGrid.tsx`.

#### Styling

The (daisyUI)[https://daisyui.com/] component library is used to cut down on the amount of (Tailwind CSS)[https://tailwindcss.com/] classes, and to add a (proper colour theming system)[https://daisyui.com/docs/colors/]. Some MUI components and styling are used only for the customised MUI data grid components in `src/components/grid/`.

#### Libraries

`src/data` contains data queries and hooks wrapping (SWR)[https://swr.vercel.app/], a fetching and caching library. The hook naming (useQuery, useMutation) is superficially inspired by (Apollo Client)[https://www.apollographql.com/docs/react/data/queries] but `src/data/queries.ts` are REST-like queries.

`src/lib` contains small, client specific utility functions, and other code to interface with and wrap third party libraries (like Amplify for authentication).


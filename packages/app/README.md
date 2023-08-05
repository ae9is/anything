# app

A client running on Next.js using the experimental app router.

## Setup

Make sure to edit `src/config/config.ts` after you've deployed your api resources so the client knows where to connect to.

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
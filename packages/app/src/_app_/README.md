# Old app router version of pages

While in experimental, app router used to be able to handle dynamic routing with static exports 
and so the client was originally built using it on Next.js versions <= 13.4.19.

At some point app router should catch up to pages router's features, 
and this code could then be used to ease migration (back) to app router.

See:
https://github.com/vercel/next.js/issues/54393
https://github.com/vercel/next.js/discussions/55393

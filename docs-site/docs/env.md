Environment variables for docs-site

This page documents the environment variables used when building and serving the docs.

- DOCS_BASE_URL (default: /docs)
  - Controls the Docusaurus baseUrl used at build time.
  - For production (docs served under /docs): set DOCS_BASE_URL=/docs
  - To mirror production locally, copy `.env.example` to `.env` and leave DOCS_BASE_URL=/docs

How to use

1. Copy the example:

   cp .env.example .env

2. Edit `.env` if you want to change values (e.g., PORT).

3. Install and run (example):

   npm ci
   npm run build:local   # reads DOCS_BASE_URL from env and builds accordingly
   npm run serve:build

Notes

- `.env` is ignored by git and should never be committed.
- The Dockerfile accepts a build-arg `DOCS_BASE_URL` so CI or docker builds can pass the appropriate value: `docker build --build-arg DOCS_BASE_URL=/docs .`

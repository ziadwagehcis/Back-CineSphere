# CineSphere Backend

The production API is available at **https://back-cinesphere.vercel.app**. The separately deployed CineSphere frontend calls this service server-to-server.

This repository contains the Express JSON API, MongoDB access layer, and movie seeder. The frontend source is maintained separately in the [Front-CineSphere repository](https://github.com/ziadwagehcis/Front-CineSphere).

## Run the backend API

Install dependencies and run:

```powershell
npm install
npm start
```

The API runs at **http://localhost:3001**. Opening its root URL returns a JSON success message; movie endpoints are available under `/api` for browser or Postman testing.

Configure MongoDB in `.env` in the repository root with `MONGODB_CONNECTION` (or `MONGODB_URI`) and `DB_NAME`. Defaults are `mongodb://127.0.0.1:27017/movies` and `movies`.

Seed curated movies without deleting existing data:

```powershell
npm run seed
```

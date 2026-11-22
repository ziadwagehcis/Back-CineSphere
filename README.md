# CineSphere backend

This folder contains the Express JSON API, MongoDB access layer, and movie seeder. The classic EJS movie site runs separately from `front/`.

## Run the backend API

Start MongoDB, then run:

```powershell
cd .\back
npm install
npm start
```

The API runs at **http://localhost:3001**. Opening its root URL returns a JSON success message; movie endpoints are available under `/api` for browser or Postman testing.

Configure MongoDB in `.env` in this folder with `MONGODB_CONNECTION` (or `MONGODB_URI`) and `DB_NAME`. Defaults are `mongodb://127.0.0.1:27017/movies` and `movies`.

Seed curated movies without deleting existing data:

```powershell
npm run seed
```

See [front/README.md](../front/README.md) to start the classic frontend.

# KariGo local setup

The frontend is in `karigo` and the FastAPI backend is in `KariGo-backend`.

## Start the backend

1. Ensure PostgreSQL is running and create a database named `karigo`.
2. Copy `KariGo-backend/.env.example` to `KariGo-backend/.env`, then set the real database and service credentials. An existing `.env` is already present locally; keep it private.
3. In PowerShell, start the API:

```powershell
cd C:\Users\chand\OneDrive\Desktop\SIH\KariGo-backend
.\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` to inspect and test the API. The first start creates missing tables and adds the `orders.requirement_id` column when upgrading an existing database.

## Start the frontend

Open `karigo/index.html` using VS Code Live Server on port 5500 (or serve the folder with any static server). Its default backend is `http://127.0.0.1:8000`.

For a different API host, set this before loading `script.js`:

```html
<script>window.KARIGO_API_BASE_URL = "https://your-api.example.com";</script>
```

## Connected flow

1. Register/login as an artisan, upload an image, and create a product.
2. Login as a buyer, add the product to cart, and checkout to create a requirement and quotation.
3. Login as that artisan and accept the quotation.
4. Login as the buyer again and checkout to create the order.

Product stock updates and deletions now persist through the API; seller galleries only display the logged-in artisan's products.

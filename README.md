# SPM Sugars Website

This project now includes a simple backend using only built-in Node.js modules.

## Run the website with backend

```powershell
node server.js
```

Open:

```text
http://localhost:3000
```

## Backend APIs

- `GET /api/config` - website settings and product prices
- `POST /api/orders` - saves a customer order
- `POST /api/payments` - saves customer payment confirmation
- `GET /api/orders` - view saved orders
- `GET /api/payments` - view saved payment confirmations

Saved data is stored in:

```text
data/db.json
```

## Important

This backend records orders and payment confirmations locally. Automatic WhatsApp sending after payment requires WhatsApp Business API plus a real payment gateway webhook.

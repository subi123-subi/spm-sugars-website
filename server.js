const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const siteConfig = {
  businessName: "SPM Sugars",
  whatsappNumber: "916374671116",
  gpayNumber: "6374671116",
  upiId: "subiksha1403@okhdfcbank",
  instagramUrl: "https://www.instagram.com/",
  locationText: "Erode, Tamil Nadu, India",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Erode%2C%20Tamil%20Nadu%2C%20India"
};

const productCatalog = [
  { id: "jaggery-1kg", name: "Jaggery (Vellam)", size: "1 kg", price: 60 },
  { id: "jaggery-5kg", name: "Jaggery (Vellam)", size: "5 kg", price: 300 },
  { id: "juice-250ml", name: "Sugarcane Juice", size: "250 ml", price: 50 },
  { id: "juice-1l", name: "Sugarcane Juice", size: "1 Litre", price: 130 },
  { id: "powder-500g", name: "Sugarcane Powder", size: "500 g", price: 60 },
  { id: "powder-1kg", name: "Sugarcane Powder", size: "1 kg", price: 300 }
];

const initialDatabase = {
  business: {
    name: siteConfig.businessName,
    whatsappNumber: siteConfig.whatsappNumber,
    gpayNumber: siteConfig.gpayNumber,
    upiId: siteConfig.upiId,
    instagramUrl: siteConfig.instagramUrl,
    locationText: siteConfig.locationText
  },
  products: productCatalog.map((product) => ({ ...product, active: true })),
  customers: [],
  orders: [],
  payments: []
};

function ensureDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDatabase, null, 2));
  }
}

function readDatabase() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDatabase(database) {
  ensureDatabase();
  fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  response.end(JSON.stringify(data));
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { ok: false, error: message });
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });

    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });

    request.on("error", reject);
  });
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must include at least one item.");
  }

  return items.map((item) => {
    const catalogItem = productCatalog.find((product) => product.id === item.id);

    if (!catalogItem) {
      throw new Error("Invalid product selected.");
    }

    const quantity = Math.max(1, Number(item.quantity) || 1);

    return {
      id: catalogItem.id,
      name: catalogItem.name,
      size: catalogItem.size,
      price: catalogItem.price,
      quantity,
      subtotal: catalogItem.price * quantity
    };
  });
}

async function handleApi(request, response, pathname) {
  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && pathname === "/api/config") {
    sendJson(response, 200, { ok: true, config: siteConfig, products: productCatalog });
    return;
  }

  if (request.method === "GET" && pathname === "/api/orders") {
    const database = readDatabase();
    sendJson(response, 200, { ok: true, orders: database.orders });
    return;
  }

  if (request.method === "GET" && pathname === "/api/payments") {
    const database = readDatabase();
    sendJson(response, 200, { ok: true, payments: database.payments });
    return;
  }

  if (request.method === "POST" && pathname === "/api/orders") {
    const body = await readBody(request);
    const items = normalizeOrderItems(body.items);
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const database = readDatabase();
    const customer = {
      id: createId("customer"),
      name: String(body.customerName || "").trim(),
      phone: String(body.customerPhone || "").trim(),
      deliveryArea: String(body.deliveryArea || "").trim(),
      createdAt: new Date().toISOString()
    };
    const order = {
      id: createId("order"),
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      deliveryArea: customer.deliveryArea,
      items,
      total,
      status: "new",
      createdAt: new Date().toISOString()
    };

    database.customers = database.customers || [];
    database.customers.unshift(customer);
    database.orders.unshift(order);
    writeDatabase(database);
    sendJson(response, 201, { ok: true, order });
    return;
  }

  if (request.method === "POST" && pathname === "/api/payments") {
    const body = await readBody(request);
    const database = readDatabase();
    const payment = {
      id: createId("payment"),
      orderId: String(body.orderId || "").trim(),
      customerName: String(body.customerName || "").trim(),
      customerPhone: String(body.customerPhone || "").trim(),
      deliveryArea: String(body.deliveryArea || "").trim(),
      amount: Number(body.amount || 0),
      status: "customer_reported_paid",
      createdAt: new Date().toISOString()
    };

    database.payments.unshift(payment);
    writeDatabase(database);
    sendJson(response, 201, { ok: true, payment });
    return;
  }

  sendError(response, 404, "API route not found.");
}

function serveStatic(request, response, pathname) {
  const safePath = pathname === "/" ? "/index.html" : decodeURIComponent(pathname);
  const filePath = path.normalize(path.join(ROOT, safePath));

  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      ".html": "text/html; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".json": "application/json; charset=utf-8",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg"
    };

    response.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApi(request, response, requestUrl.pathname);
      return;
    }

    serveStatic(request, response, requestUrl.pathname);
  } catch (error) {
    sendError(response, 400, error.message || "Request failed.");
  }
});

ensureDatabase();
server.listen(PORT, () => {
  console.log(`SPM Sugars website running at http://localhost:${PORT}`);
  console.log(`Orders database: ${DB_FILE}`);
});

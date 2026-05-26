const defaultConfig = {
  whatsappNumber: "916374671116",
  gpayNumber: "6374671116",
  upiId: "subiksha1403@okhdfcbank",
  instagramUrl: "https://www.instagram.com/",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Erode%2C%20Tamil%20Nadu%2C%20India"
};

let siteConfig = { ...defaultConfig };
let productCatalog = [
  { id: "jaggery-1kg", name: "Jaggery (Vellam)", size: "1 kg", price: 60 },
  { id: "jaggery-5kg", name: "Jaggery (Vellam)", size: "5 kg", price: 300 },
  { id: "juice-250ml", name: "Sugarcane Juice", size: "250 ml", price: 50 },
  { id: "juice-1l", name: "Sugarcane Juice", size: "1 Litre", price: 130 },
  { id: "powder-500g", name: "Sugarcane Powder", size: "500 g", price: 60 },
  { id: "powder-1kg", name: "Sugarcane Powder", size: "1 kg", price: 300 }
];

const customerNameInput = document.querySelector("#customerNameInput");
const customerPhoneInput = document.querySelector("#customerPhoneInput");
const productSelect = document.querySelector("#productSelect");
const quantityInput = document.querySelector("#quantityInput");
const areaInput = document.querySelector("#areaInput");
const addItemButton = document.querySelector("#addItem");
const clearOrderButton = document.querySelector("#clearOrder");
const orderItems = document.querySelector("#orderItems");
const orderTotal = document.querySelector("#orderTotal");
const orderWhatsapp = document.querySelector("#orderWhatsapp");
const paymentConfirm = document.querySelector("#paymentConfirm");
const backendStatus = document.querySelector("#backendStatus");
const gpayNumber = document.querySelector("#gpayNumber");
const upiId = document.querySelector("#upiId");

const cart = [];
let latestOrderId = "";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function getTotal() {
  return cart.reduce((sum, item) => sum + item.subtotal, 0);
}

function getCustomerDetails() {
  return {
    customerName: customerNameInput.value.trim(),
    customerPhone: customerPhoneInput.value.trim(),
    deliveryArea: areaInput.value.trim()
  };
}

function getSelectedProduct() {
  return productCatalog.find((product) => product.id === productSelect.value) || productCatalog[0];
}

function buildWhatsAppMessage(total, orderId = "") {
  const customer = getCustomerDetails();
  const lines = [
    "Hello SPM Sugars, I want to place an order:",
    ...cart.map((item) => `- ${item.quantity} x ${item.name} (${item.size}) = ${formatPrice(item.subtotal)}`),
    `Estimated total: ${formatPrice(total)}`
  ];

  if (orderId) {
    lines.push(`Order ID: ${orderId}`);
  }

  if (customer.customerName) {
    lines.push(`Name: ${customer.customerName}`);
  }

  if (customer.customerPhone) {
    lines.push(`Mobile: ${customer.customerPhone}`);
  }

  if (customer.deliveryArea) {
    lines.push(`Delivery area: ${customer.deliveryArea}`);
  }

  lines.push("Please confirm availability and delivery charges.");
  return lines.join("\n");
}

function buildPaymentMessage(total, paymentId = "") {
  const customer = getCustomerDetails();
  const lines = ["Hello SPM Sugars, I have completed the payment."];

  if (latestOrderId) {
    lines.push(`Order ID: ${latestOrderId}`);
  }

  if (paymentId) {
    lines.push(`Payment confirmation ID: ${paymentId}`);
  }

  if (cart.length > 0) {
    lines.push("Order details:");
    lines.push(...cart.map((item) => `- ${item.quantity} x ${item.name} (${item.size}) = ${formatPrice(item.subtotal)}`));
    lines.push(`Paid amount: ${formatPrice(total)}`);
  } else {
    lines.push("Paid amount: Please verify from my payment screenshot/details.");
  }

  if (customer.customerName) {
    lines.push(`Name: ${customer.customerName}`);
  }

  if (customer.customerPhone) {
    lines.push(`Mobile: ${customer.customerPhone}`);
  }

  if (customer.deliveryArea) {
    lines.push(`Delivery area: ${customer.deliveryArea}`);
  }

  lines.push("Please confirm my order.");
  return lines.join("\n");
}

function updateStatus(message, isError = false) {
  if (!backendStatus) {
    return;
  }

  backendStatus.textContent = message;
  backendStatus.classList.toggle("is-error", isError);
}

function updateProductSelect() {
  productSelect.innerHTML = productCatalog
    .map((product) => `<option value="${product.id}">${product.name} - ${product.size} - ${formatPrice(product.price)}</option>`)
    .join("");
}

function updateBusinessDetails() {
  gpayNumber.textContent = siteConfig.gpayNumber;
  upiId.textContent = siteConfig.upiId;

  document.querySelectorAll(".whatsapp").forEach((link) => {
    if (!link.id) {
      link.href = `https://wa.me/${siteConfig.whatsappNumber}`;
    }
  });
}

function renderCart() {
  const total = getTotal();
  orderItems.innerHTML = "";

  if (cart.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-order";
    emptyItem.textContent = "No items added yet.";
    orderItems.append(emptyItem);
    orderWhatsapp.href = `https://wa.me/${siteConfig.whatsappNumber}`;
  } else {
    cart.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<span>${item.quantity} x ${item.name} <small>(${item.size})</small></span><strong>${formatPrice(item.subtotal)}</strong>`;
      orderItems.append(listItem);
    });

    const message = encodeURIComponent(buildWhatsAppMessage(total, latestOrderId));
    orderWhatsapp.href = `https://wa.me/${siteConfig.whatsappNumber}?text=${message}`;
  }

  const paymentMessage = encodeURIComponent(buildPaymentMessage(total));
  paymentConfirm.href = `https://wa.me/${siteConfig.whatsappNumber}?text=${paymentMessage}`;
  orderTotal.textContent = formatPrice(total);
}

async function saveOrder() {
  if (cart.length === 0) {
    updateStatus("Please add at least one product before sending.", true);
    return null;
  }

  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getCustomerDetails(),
      items: cart.map((item) => ({ id: item.id, quantity: item.quantity }))
    })
  });

  if (!response.ok) {
    throw new Error("Backend could not save the order.");
  }

  const data = await response.json();
  latestOrderId = data.order.id;
  updateStatus(`Order saved in backend: ${latestOrderId}`);
  renderCart();
  return data.order;
}

async function savePaymentConfirmation() {
  const response = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...getCustomerDetails(),
      orderId: latestOrderId,
      amount: getTotal()
    })
  });

  if (!response.ok) {
    throw new Error("Backend could not save the payment confirmation.");
  }

  const data = await response.json();
  updateStatus(`Payment confirmation saved: ${data.payment.id}`);
  return data.payment;
}

function addSelectedItem() {
  const product = getSelectedProduct();
  const quantity = Math.max(1, Number(quantityInput.value) || 1);

  cart.push({
    ...product,
    quantity,
    subtotal: product.price * quantity
  });

  quantityInput.value = "1";
  latestOrderId = "";
  updateStatus("Item added. Send the order to save it in backend.");
  renderCart();
}

async function loadBackendConfig() {
  try {
    const response = await fetch("/api/config");

    if (!response.ok) {
      throw new Error("Config API unavailable.");
    }

    const data = await response.json();
    siteConfig = { ...siteConfig, ...data.config };
    productCatalog = data.products;
    updateProductSelect();
    updateBusinessDetails();
    updateStatus("Backend connected. Orders will be saved locally.");
  } catch {
    updateStatus("WhatsApp ordering is ready.", true);
  }

  renderCart();
}

addItemButton.addEventListener("click", addSelectedItem);
areaInput.addEventListener("input", renderCart);
customerNameInput.addEventListener("input", renderCart);
customerPhoneInput.addEventListener("input", renderCart);
clearOrderButton.addEventListener("click", () => {
  cart.length = 0;
  latestOrderId = "";
  updateStatus("Order cleared.");
  renderCart();
});

orderWhatsapp.addEventListener("click", async (event) => {
  if (cart.length === 0) {
    return;
  }

  event.preventDefault();

  try {
    const order = await saveOrder();
    const message = encodeURIComponent(buildWhatsAppMessage(order.total, order.id));
    window.open(`https://wa.me/${siteConfig.whatsappNumber}?text=${message}`, "_blank", "noopener");
  } catch {
    updateStatus("Backend not available. Opening WhatsApp without saving.", true);
    window.open(orderWhatsapp.href, "_blank", "noopener");
  }
});

paymentConfirm.addEventListener("click", async (event) => {
  event.preventDefault();

  try {
    const payment = await savePaymentConfirmation();
    const message = encodeURIComponent(buildPaymentMessage(getTotal(), payment.id));
    window.open(`https://wa.me/${siteConfig.whatsappNumber}?text=${message}`, "_blank", "noopener");
  } catch {
    updateStatus("Backend not available. Opening payment WhatsApp message only.", true);
    window.open(paymentConfirm.href, "_blank", "noopener");
  }
});

loadBackendConfig();

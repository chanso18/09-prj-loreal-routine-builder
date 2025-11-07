/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

/* keep track of which products the user has selected */
let selectedProducts = [];

/* Cache all products after loading once so Info buttons can look up details. */
let allProducts = [];

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Immediately load and cache all products for quick lookups later */
(async function initProductsCache() {
  allProducts = await loadProducts();
})();

/* Render the selectedProducts array inside the Selected Products section.
   Double-clicking a card in this section removes it. Each card has an Info button. */
function renderSelectedProducts() {
  if (!selectedProducts || selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <div class="placeholder-message">No products selected</div>
    `;
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product, i) => `
    <div class="product-card selected-list-card" data-selected-index="${i}" data-product-name="${escapeHtml(
        product.name
      )}" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <button class="info-btn" data-product-id="${
        product.id
      }" title="Product info">i</button>
    </div>
  `
    )
    .join("");

  const selectedCards = selectedProductsList.querySelectorAll(
    ".selected-list-card"
  );
  selectedCards.forEach((card) => {
    const productName = card.dataset.productName;

    // Double-click to remove
    card.ondblclick = null;
    card.addEventListener("dblclick", () => {
      const idx = selectedProducts.findIndex((p) => p.name === productName);
      if (idx > -1) selectedProducts.splice(idx, 1);

      renderSelectedProducts();

      // Clear highlight in grid if present
      const gridCards = productsContainer.querySelectorAll(".product-card");
      gridCards.forEach((gcard) => {
        const titleEl = gcard.querySelector(".product-info h3");
        if (titleEl && titleEl.textContent === productName) {
          gcard.style.border = "";
        }
      });
    });

    // Info button - show modal with product details
    const infoBtn = card.querySelector(".info-btn");
    if (infoBtn) {
      infoBtn.onclick = null;
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(infoBtn.dataset.productId);
        const product = allProducts.find((p) => p.id === id);
        if (product) showProductModal(product);
      });
    }
  });
}

/* Utility: escape HTML for safe insertion of product names in attributes */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* Create HTML for displaying product cards in the main grid */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, i) => `
    <div class="product-card" data-product-index="${i}">
      <img src="${product.image}" alt="${product.name}" data-product-index="${i}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
      <button class="info-btn" data-product-id="${product.id}" title="Product info">i</button>
    </div>
  `
    )
    .join("");

  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const idx = Number(card.dataset.productIndex);
    const product = products[idx];

    const alreadySelected = selectedProducts.some(
      (p) => p.name === product.name
    );
    card.style.border = alreadySelected ? "3px solid #000" : "";

    // Toggle selection when the card is clicked
    card.addEventListener("click", () => {
      const foundIndex = selectedProducts.findIndex(
        (p) => p.name === product.name
      );

      if (foundIndex > -1) {
        selectedProducts.splice(foundIndex, 1);
        card.style.border = "";
      } else {
        selectedProducts.push(product);
        card.style.border = "3px solid #000";
      }

      renderSelectedProducts();
    });

    // Info button - open modal without toggling selection
    const infoBtn = card.querySelector(".info-btn");
    if (infoBtn) {
      infoBtn.onclick = null;
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(infoBtn.dataset.productId);
        const productData = allProducts.find((p) => p.id === id) || product;
        showProductModal(productData);
      });
    }
  });

  renderSelectedProducts();
}

/* Modal helper: fill and show modal (ID omitted) */
function showProductModal(product) {
  const modal = document.getElementById("productModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <img src="${product.image}" alt="${escapeHtml(product.name)}">
    <div class="modal-info">
      <h3>${escapeHtml(product.name)}</h3>
      <p><strong>Brand:</strong> ${escapeHtml(product.brand)}</p>
      <p><strong>Category:</strong> ${escapeHtml(product.category)}</p>
      <p>${escapeHtml(product.description)}</p>
    </div>
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

/* Modal close wiring */
(function wireUpModalClose() {
  const modal = document.getElementById("productModal");
  if (!modal) return;

  const closeBtn = modal.querySelector(".modal-close");
  closeBtn.addEventListener("click", () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }
  });
})();

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Helper: append a chat message to the chat window (role = "user"|"assistant") */
function appendChatMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role}`;
  wrapper.innerText = text;
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Helper: map personality selection to a system prompt */
function personalityToSystemMessage(key) {
  const map = {
    friendly:
      "You are a friendly and helpful skincare/product advisor. Be warm, clear, and practical.",
    concise:
      "You are a concise assistant. Give short, direct answers focused on the user's question.",
    expert:
      "You are a clinical skincare expert. Explain clearly, cite best-practice reasoning, and be precise.",
    creative:
      "You are playful and creative while staying helpful about products and routines.",
  };
  return map[key] || map.friendly;
}

/* ---- OpenAI (Cloudflare Worker proxy) integration ---- */
const WORKER_URL = "https://young-field-f1f7.chanso18.workers.dev/";

/* Send request to the Cloudflare worker and return parsed JSON. */
async function postToWorker(payload) {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Worker error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data;
}

/* Build messages and query the worker for a response */
async function queryAI(
  userText,
  temperature = 0.7,
  maxTokens = 200,
  personalityKey = "friendly"
) {
  const systemMessage = {
    role: "system",
    content: personalityToSystemMessage(personalityKey),
  };

  const userMessage = { role: "user", content: userText };

  const payload = {
    model: "gpt-4o",
    messages: [systemMessage, userMessage],
    temperature: Number(temperature),
    max_tokens: Number(maxTokens),
  };

  const data = await postToWorker(payload);
  const assistantText = data?.choices?.[0]?.message?.content;
  return assistantText || null;
}

/* Chat form submission handler - user input is sent to the worker and response shown */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  // simple defaults (no UI controls exist in the page)
  const temperature = 0.7;
  const maxTokens = 200;
  const personality = "friendly";

  appendChatMessage("user", text);

  userInput.value = "";
  sendBtn.disabled = true;
  sendBtn.setAttribute("aria-busy", "true");

  const thinkingEl = document.createElement("div");
  thinkingEl.className = "chat-message assistant thinking";
  thinkingEl.innerText = "Thinking…";
  chatWindow.appendChild(thinkingEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    const reply = await queryAI(text, temperature, maxTokens, personality);

    thinkingEl.remove();
    if (reply) {
      appendChatMessage("assistant", reply);
    } else {
      appendChatMessage(
        "assistant",
        "Sorry — I couldn't get a response. Try again."
      );
    }
  } catch (err) {
    thinkingEl.remove();
    appendChatMessage("assistant", `Error: ${err.message}`);
    console.error(err);
  } finally {
    sendBtn.disabled = false;
    sendBtn.removeAttribute("aria-busy");
  }
});

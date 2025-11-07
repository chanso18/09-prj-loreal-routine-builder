/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const generateBtn = document.getElementById("generateRoutine");
const clearSelectionsBtn = document.getElementById("clearSelectionsBtn");

/* Local storage keys */
const CONVERSATION_KEY = "loreal_chat_history";
const SELECTED_KEY = "loreal_selected_products";

/* keep track of which products the user has selected */
let selectedProducts = [];

/* Cache all products after loading once so Info buttons can look up details. */
let allProducts = [];

/* ---------- Data loading (products.json) ---------- */
/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products || [];
}

/* Immediately load and cache all products for quick lookups later,
   then restore selected products and conversation from localStorage. */
(async function initProductsCache() {
  allProducts = await loadProducts();

  // Restore selected products from storage (if any)
  const storedSelected = localStorage.getItem(SELECTED_KEY);
  if (storedSelected) {
    try {
      selectedProducts = JSON.parse(storedSelected);
    } catch {
      selectedProducts = [];
    }
  }

  // Render selected products area on load (may be empty)
  renderSelectedProducts();

  // Restore conversation and render it
  renderConversationFromStorage();
})();

/* ---------- Selected products handling ---------- */
/* Save selectedProducts to localStorage */
function saveSelectedProducts() {
  localStorage.setItem(SELECTED_KEY, JSON.stringify(selectedProducts));
}

/* Clear all selected products and update UI + storage */
function clearSelections() {
  // empty the array
  selectedProducts = [];
  // persist change
  saveSelectedProducts();
  // update UI
  renderSelectedProducts();
  // clear highlights in the products grid
  const gridCards = productsContainer.querySelectorAll(".product-card");
  gridCards.forEach((c) => (c.style.border = ""));
}

// wire up the clear button if present
if (clearSelectionsBtn) {
  clearSelectionsBtn.addEventListener("click", clearSelections);
}

/* Render the selectedProducts array inside the Selected Products section.
   Double-clicking a card in this section removes it. Each card has an Info button. */
function renderSelectedProducts() {
  if (!selectedProducts || selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <div class="placeholder-message">No products selected</div>
    `;
    return;
  }

  // Render selected cards (reuse product-card markup)
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product, i) => `
    <div class="product-card selected-list-card" data-selected-index="${i}" data-product-name="${escapeHtml(
        product.name
      )}" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand || ""}</p>
      </div>
      <button class="info-btn" data-product-id="${
        product.id
      }" title="Product info">i</button>
    </div>
  `
    )
    .join("");

  // Wire up dblclick removal and Info button in selected list
  const selectedCards = selectedProductsList.querySelectorAll(
    ".selected-list-card"
  );
  selectedCards.forEach((card) => {
    const productName = card.dataset.productName;

    // Double-click to remove from selectedProducts
    card.ondblclick = null;
    card.addEventListener("dblclick", () => {
      const idx = selectedProducts.findIndex((p) => p.name === productName);
      if (idx > -1) selectedProducts.splice(idx, 1);

      saveSelectedProducts();
      renderSelectedProducts();
      clearGridHighlight(productName);
    });

    // Info button - show modal with product details
    const infoBtn = card.querySelector(".info-btn");
    if (infoBtn) {
      infoBtn.onclick = null;
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(infoBtn.dataset.productId);
        const product =
          allProducts.find((p) => p.id === id) ||
          selectedProducts.find((p) => p.id === id);
        if (product) showProductModal(product);
      });
    }
  });
}

/* Helper to clear border highlight in the main products grid for a product name */
function clearGridHighlight(productName) {
  const gridCards = productsContainer.querySelectorAll(".product-card");
  gridCards.forEach((gcard) => {
    const titleEl = gcard.querySelector(".product-info h3");
    if (titleEl && titleEl.textContent === productName) {
      gcard.style.border = "";
    }
  });
}

/* ---------- Utilities ---------- */
/* Utility: escape HTML for safe insertion of product names in attributes */
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* ---------- Products grid rendering ---------- */
/* Create HTML for displaying product cards in the main grid */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product, i) => `
    <div class="product-card" data-product-index="${i}">
      <img src="${product.image}" alt="${
        product.name
      }" data-product-index="${i}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand || ""}</p>
      </div>
      <button class="info-btn" data-product-id="${
        product.id
      }" title="Product info">i</button>
    </div>
  `
    )
    .join("");

  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const idx = Number(card.dataset.productIndex);
    const product = products[idx];

    // Show border if already selected
    const alreadySelected = selectedProducts.some(
      (p) => p.name === product.name
    );
    card.style.border = alreadySelected ? "3px solid #000" : "";

    // Toggle selection when the card is clicked (highlight whole card)
    card.addEventListener("click", () => {
      const foundIndex = selectedProducts.findIndex(
        (p) => p.name === product.name
      );

      if (foundIndex > -1) {
        selectedProducts.splice(foundIndex, 1);
        card.style.border = "";
      } else {
        // store a simple serializable product object
        const serializable = {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category: product.category,
          description: product.description,
          image: product.image,
        };
        selectedProducts.push(serializable);
        card.style.border = "3px solid #000";
      }

      saveSelectedProducts();
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

/* ---------- Product modal ---------- */
/* Modal helper: fill and show modal */
function showProductModal(product) {
  const modal = document.getElementById("productModal");
  const modalBody = document.getElementById("modalBody");

  modalBody.innerHTML = `
    <img src="${product.image}" alt="${escapeHtml(product.name)}">
    <div class="modal-info">
      <h3>${escapeHtml(product.name)}</h3>
      <p><strong>Brand:</strong> ${escapeHtml(product.brand || "")}</p>
      <p><strong>Category:</strong> ${escapeHtml(product.category || "")}</p>
      <p>${escapeHtml(product.description || "")}</p>
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

/* ---------- Chat conversation storage and rendering ---------- */
/* Render conversation from localStorage without mutating it */
function renderConversationFromStorage() {
  const raw = localStorage.getItem(CONVERSATION_KEY);
  let conv = [];
  try {
    conv = raw ? JSON.parse(raw) : [];
  } catch {
    conv = [];
  }
  chatWindow.innerHTML = "";
  conv.forEach((m) => {
    renderMessageDOM(m.role, m.content);
  });
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Append a chat message to the chat window and persist it.
   role is "user" or "assistant". This function saves to localStorage. */
function appendChatMessage(role, text) {
  // Save to storage
  const raw = localStorage.getItem(CONVERSATION_KEY);
  let conv = [];
  try {
    conv = raw ? JSON.parse(raw) : [];
  } catch {
    conv = [];
  }
  conv.push({ role, content: text });
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(conv));

  // Render in DOM
  renderMessageDOM(role, text);
}

/* New: save a message to conversation storage WITHOUT rendering it.
   Used to keep hidden instructions/prompts out of the visible chat. */
function saveMessageToStorage(role, text) {
  const raw = localStorage.getItem(CONVERSATION_KEY);
  let conv = [];
  try {
    conv = raw ? JSON.parse(raw) : [];
  } catch {
    conv = [];
  }
  conv.push({ role, content: text });
  localStorage.setItem(CONVERSATION_KEY, JSON.stringify(conv));
}

/* Render a single message into the DOM (does not touch storage) */
function renderMessageDOM(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role}`;
  wrapper.textContent = text;
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* ---------- OpenAI (Cloudflare Worker proxy) integration ---------- */
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

/* Personality/system messages map */
function personalityToSystemMessage(key) {
  const map = {
    bubbly:
      "You are a bubbly assistant for L'Oréal who is an expert in skin care routines and products. Use your love for helping others and beauty to bring positive insight to those seeking your advice. Be upbeat, professional, and clear. Focus on L'Oréal products and skincare.",
    friendly:
      "You are a friendly and helpful skincare/product advisor. Be warm, clear, and practical.",
    concise:
      "You are a concise assistant. Give short, direct answers focused on the user's question.",
    expert:
      "You are a clinical skincare expert. Explain clearly, cite best-practice reasoning, and be precise.",
  };
  return map[key] || map["bubbly"];
}

/* Query the worker with an array of messages (no system message included yet).
   We prepend the chosen system message here. */
async function queryAI(
  messagesArray,
  temperature = 0.7,
  maxTokens = 200,
  personalityKey = "bubbly"
) {
  // Ensure messagesArray is an array of {role, content}
  const userMessages = Array.isArray(messagesArray)
    ? messagesArray.slice()
    : [];

  const systemMessage = {
    role: "system",
    content: personalityToSystemMessage(personalityKey),
  };
  const payload = {
    model: "gpt-4o",
    messages: [systemMessage, ...userMessages],
    temperature: Number(temperature),
    max_tokens: Number(maxTokens),
  };

  const data = await postToWorker(payload);
  const assistantText = data?.choices?.[0]?.message?.content;
  return assistantText || null;
}

/* ---------- Chat form submission (user -> AI) ---------- */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;

  // Append user's message (this also saves it to localStorage)
  appendChatMessage("user", text);
  userInput.value = "";
  sendBtn.disabled = true;
  sendBtn.setAttribute("aria-busy", "true");

  // show assistant thinking placeholder
  const thinkingEl = document.createElement("div");
  thinkingEl.className = "chat-message assistant thinking";
  thinkingEl.innerText = "Thinking…";
  chatWindow.appendChild(thinkingEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // load conversation (so AI sees prior turn-by-turn messages)
    const raw = localStorage.getItem(CONVERSATION_KEY);
    let conv = [];
    try {
      conv = raw ? JSON.parse(raw) : [];
    } catch {
      conv = [];
    }

    const reply = await queryAI(conv, 0.7, 200, "bubbly");
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

/* ---------- Generate routine using selectedProducts and keep conversation context ---------- */
/* Build a plain-text summary of the selected products for the AI */
function buildSelectedProductsSummary() {
  if (!selectedProducts || selectedProducts.length === 0) return "";
  return selectedProducts
    .map((p, i) => {
      const name = p.name || "Unnamed product";
      const brand = p.brand || "Unknown brand";
      const category = p.category || "Unspecified category";
      const desc = p.description || "No description available.";
      return `${i + 1}. ${name} — ${brand} (${category}): ${desc}`;
    })
    .join("\n");
}

async function handleGenerateRoutineClick(e) {
  e.preventDefault();

  if (!selectedProducts || selectedProducts.length === 0) {
    appendChatMessage(
      "assistant",
      "No products selected. Please select one or more products before generating a routine."
    );
    return;
  }

  // Build a detailed prompt including selected products so AI can reference them
  const productsSummary = buildSelectedProductsSummary();
  const fullPrompt = `Please create a clear, step-by-step skincare routine using ONLY the products listed below. For each step include:
- Step order (1, 2, 3...)
- When to use (AM / PM / Both)
- Which product to use (by name)
- A short reason why this step/product is appropriate

Products:
${productsSummary}

Keep the routine practical and concise. If a product does not fit into a routine step, explain why.`;

  // Display only the short user message in the chat window per requirement
  appendChatMessage("user", "Generate a routine for me!");

  // Save the detailed instructions to conversation storage but do NOT display them
  saveMessageToStorage("user", fullPrompt);

  // Disable button while AI generates
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.setAttribute("aria-busy", "true");
  }

  const thinkingEl = document.createElement("div");
  thinkingEl.className = "chat-message assistant thinking";
  thinkingEl.innerText = "Generating routine…";
  chatWindow.appendChild(thinkingEl);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  try {
    // read full conversation (includes the hidden detailed prompt) so AI has context
    const raw = localStorage.getItem(CONVERSATION_KEY);
    let conv = [];
    try {
      conv = raw ? JSON.parse(raw) : [];
    } catch {
      conv = [];
    }

    // Ask AI with more tokens allowed
    const reply = await queryAI(conv, 0.7, 600, "bubbly");
    thinkingEl.remove();

    if (reply) {
      appendChatMessage("assistant", reply);
    } else {
      appendChatMessage(
        "assistant",
        "Sorry — I couldn't get a routine. Please try again."
      );
    }
  } catch (err) {
    thinkingEl.remove();
    appendChatMessage("assistant", `Error generating routine: ${err.message}`);
    console.error(err);
  } finally {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.removeAttribute("aria-busy");
    }
  }
}

/* Wire up generate routine button if present */
if (generateBtn) {
  generateBtn.addEventListener("click", handleGenerateRoutineClick);
}

/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* keep track of which products the user has selected */
let selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Render the selectedProducts array inside the Selected Products section.
   Items shown here use the same card markup as the grid. Double-clicking
   a card in this section removes it from selectedProducts and updates the grid. */
function renderSelectedProducts() {
  // If nothing selected, show placeholder
  if (!selectedProducts || selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `
      <div class="placeholder-message">No products selected</div>
    `;
    return;
  }

  // Render selected cards (same layout as grid cards)
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product, i) => `
    <div class="product-card selected-list-card" data-selected-index="${i}" data-product-name="${escapeHtml(
        product.name
      )}">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Attach dblclick handlers to each selected-list card to remove it when double-clicked
  // We use "dblclick" so users must double click to remove items from the Selected Products section.
  const selectedCards = selectedProductsList.querySelectorAll(
    ".selected-list-card"
  );
  selectedCards.forEach((card) => {
    const productName = card.dataset.productName;

    // Remove any previous listeners (defensive) then add dblclick handler
    card.ondblclick = null;
    card.addEventListener("dblclick", () => {
      // Remove from selectedProducts by matching the product name
      const idx = selectedProducts.findIndex((p) => p.name === productName);
      if (idx > -1) {
        selectedProducts.splice(idx, 1);
      }

      // Re-render selected products section
      renderSelectedProducts();

      // Clear selection highlight in the main products grid (if visible)
      const gridCards = productsContainer.querySelectorAll(".product-card");
      gridCards.forEach((gcard) => {
        const titleEl = gcard.querySelector(".product-info h3");
        if (titleEl && titleEl.textContent === productName) {
          gcard.style.border = "";
        }
      });

      // Helpful debug output for learners
      console.log("Selected products:", selectedProducts);
    });
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
  // Render product cards; include a data attribute with the product index
  productsContainer.innerHTML = products
    .map(
      (product, i) => `
    <div class="product-card" data-product-index="${i}">
      <img src="${product.image}" alt="${product.name}" data-product-index="${i}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </div>
  `
    )
    .join("");

  // Attach click handlers to each grid card
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    const idx = Number(card.dataset.productIndex);
    const product = products[idx];

    // If this product was previously selected, show the border on render
    const alreadySelected = selectedProducts.some(
      (p) => p.name === product.name
    );
    if (alreadySelected) {
      card.style.border = "3px solid #000";
    } else {
      card.style.border = "";
    }

    // Toggle selection when the card is clicked
    card.addEventListener("click", () => {
      const foundIndex = selectedProducts.findIndex(
        (p) => p.name === product.name
      );

      if (foundIndex > -1) {
        // Remove selection
        selectedProducts.splice(foundIndex, 1);
        card.style.border = "";
      } else {
        // Add selection
        selectedProducts.push(product);
        card.style.border = "3px solid #000";
      }

      // Update the Selected Products area whenever the selection changes
      renderSelectedProducts();
      console.log("Selected products:", selectedProducts);
    });
  });

  // Ensure the Selected Products area reflects any existing selections
  renderSelectedProducts();
}

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

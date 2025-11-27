document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const buyPriceInput = document.getElementById("buyPrice");
  const sellPriceInput = document.getElementById("sellPrice");
  const sharesInput = document.getElementById("shares");
  const taxRateInput = document.getElementById("taxRate");

  const totalBuyPriceDisplay = document.getElementById("totalBuyPrice");
  const totalSellPriceDisplay = document.getElementById("totalSellPrice");

  const grossProfitDisplay = document.getElementById("grossProfit");
  const taxAmountDisplay = document.getElementById("taxAmount");
  const netProfitDisplay = document.getElementById("netProfit");

  const saveBtn = document.getElementById("saveBtn");
  const savedList = document.getElementById("savedList");

  const inputs = [buyPriceInput, sellPriceInput, sharesInput, taxRateInput];

  // --- Helper Functions ---
  function formatCurrency(amount) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
  }

  function calculate() {
    const buyPrice = parseFloat(buyPriceInput.value) || 0;
    const sellPrice = parseFloat(sellPriceInput.value) || 0;
    const shares = parseFloat(sharesInput.value) || 0;
    const taxRate = parseFloat(taxRateInput.value) || 0;

    const grossProfit = (sellPrice - buyPrice) * shares;

    let taxAmount = 0;
    if (grossProfit > 0) {
      taxAmount = grossProfit * (taxRate / 100);
    }

    const netProfit = grossProfit - taxAmount;

    // Update display
    totalBuyPriceDisplay.textContent = formatCurrency(buyPrice * shares);
    totalSellPriceDisplay.textContent = formatCurrency(sellPrice * shares);
    grossProfitDisplay.textContent = formatCurrency(grossProfit);
    taxAmountDisplay.textContent = formatCurrency(taxAmount);
    netProfitDisplay.textContent = formatCurrency(netProfit);

    // Color coding
    if (grossProfit < 0) {
      grossProfitDisplay.classList.add("negative");
      netProfitDisplay.classList.add("negative");
      netProfitDisplay.style.color = "var(--danger-color)";
    } else {
      grossProfitDisplay.classList.remove("negative");
      netProfitDisplay.classList.remove("negative");
      netProfitDisplay.style.color = "var(--success-color)";
    }

    return {
      buyPrice,
      sellPrice,
      shares,
      taxRate,
      netProfit,
    };
  }

  // --- API & Persistence Logic ---
  async function getSavedCalculations() {
    try {
      const response = await fetch("/api/calculations");
      if (!response.ok) throw new Error("Failed to fetch");
      return await response.json();
    } catch (error) {
      console.error("Error loading calculations:", error);
      return [];
    }
  }

  async function saveCalculation() {
    const currentData = calculate();

    // Don't save empty calculations
    if (currentData.buyPrice === 0 && currentData.sellPrice === 0 && currentData.shares === 0) {
      alert("Introduce datos antes de guardar");
      return;
    }

    const name = prompt("Nombre para este cálculo:");
    if (!name) return;

    const newCalculation = {
      name: name,
      date: new Date().toLocaleDateString(),
      data: currentData,
    };

    try {
      const response = await fetch("/api/calculations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCalculation),
      });

      if (response.ok) {
        renderSavedList();
      } else {
        alert("Error al guardar el cálculo");
      }
    } catch (error) {
      console.error("Error saving calculation:", error);
      alert("Error de conexión");
    }
  }

  async function loadCalculation(id) {
    const saved = await getSavedCalculations();
    // MongoDB uses _id
    const calculation = saved.find((item) => item._id === id);

    if (calculation) {
      buyPriceInput.value = calculation.data.buyPrice;
      sellPriceInput.value = calculation.data.sellPrice;
      sharesInput.value = calculation.data.shares;
      taxRateInput.value = calculation.data.taxRate;
      calculate();
    }
  }

  async function renderSavedList() {
    const saved = await getSavedCalculations();
    savedList.innerHTML = "";

    if (saved.length === 0) {
      savedList.innerHTML = '<div class="empty-state">No hay cálculos guardados</div>';
      return;
    }

    saved.forEach((item) => {
      const card = document.createElement("div");
      card.className = "saved-card";
      card.innerHTML = `
            <h4>${item.name}</h4>
            <div class="date">${item.date}</div>
            <div class="profit" style="color: ${item.data.netProfit >= 0 ? "var(--success-color)" : "var(--danger-color)"}">
                ${formatCurrency(item.data.netProfit)}
            </div>
        `;

      // MongoDB uses _id
      card.addEventListener("click", () => loadCalculation(item._id));
      savedList.appendChild(card);
    });
  }

  // --- Navigation Logic ---
  const navItems = document.querySelectorAll(".nav-item");
  const sectionsContainer = document.querySelector(".sections-container");
  const sections = document.querySelectorAll(".section");

  function switchSection(targetId) {
    // Update Nav Items
    navItems.forEach((item) => {
      if (item.dataset.target === targetId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update Sections and Container Transform
    const targetSectionIndex = Array.from(sections).findIndex((section) => section.id === targetId);

    if (targetSectionIndex !== -1) {
      sectionsContainer.style.transform = `translateX(-${targetSectionIndex * 100}%)`;

      sections.forEach((section) => {
        if (section.id === targetId) {
          section.classList.add("active");
        } else {
          section.classList.remove("active");
        }
      });
    }
  }

  // --- Event Listeners ---
  inputs.forEach((input) => {
    input.addEventListener("input", calculate);
  });

  saveBtn.addEventListener("click", saveCalculation);

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.dataset.target;
      switchSection(targetId);
    });
  });

  // --- Initial Render ---
  renderSavedList();
});

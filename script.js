import { API_ENDPOINTS } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const calculationNameInput = document.getElementById("calculationName");
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
      const response = await fetch(API_ENDPOINTS.NOTES);
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

    const name = calculationNameInput.value.trim();
    if (!name) {
      alert("Por favor, introduce un nombre para el cálculo");
      return;
    }

    const newCalculation = {
      name: name,
      date: new Date().toLocaleDateString(),
      data: currentData,
    };

    try {
      const response = await fetch(API_ENDPOINTS.NOTES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCalculation),
      });

      if (response.ok) {
        renderSavedList();
        // Optional: Clear name after save? Or keep it? keeping it for now.
      } else {
        alert("Error al guardar el cálculo");
      }
    } catch (error) {
      console.error("Error saving calculation:", error);
      alert("Error de conexión");
    }
  }

  async function deleteCalculation(id, event) {
    event.stopPropagation(); // Prevent card click event

    try {
      const response = await fetch(API_ENDPOINTS.NOTE_BY_ID(id), {
        method: "DELETE",
      });

      console.log("Delete response status:", response.status);
      console.log("Delete response ok:", response.ok);

      if (response.ok) {
        renderSavedList();
      } else {
        const errorData = await response.json();
        console.error("Delete error:", errorData);
        alert("Error al borrar el cálculo");
      }
    } catch (error) {
      console.error("Error deleting calculation:", error);
      alert("Error de conexión");
    }
  }

  async function loadCalculation(id) {
    const saved = await getSavedCalculations();
    // MongoDB uses _id
    const calculation = saved.find((item) => item._id === id);

    if (calculation) {
      calculationNameInput.value = calculation.name;
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
            <button class="delete-btn" title="Eliminar cálculo">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        `;

      // MongoDB uses _id
      card.addEventListener("click", () => loadCalculation(item._id));

      const deleteBtn = card.querySelector(".delete-btn");
      console.log("Attaching delete listener for:", item.name, "ID:", item._id);
      deleteBtn.addEventListener("click", (e) => {
        console.log("Delete button clicked for:", item._id);
        deleteCalculation(item._id, e);
      });

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

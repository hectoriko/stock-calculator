document.addEventListener("DOMContentLoaded", () => {
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
      // Remove success color from net profit if negative
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

  // Saved Calculations Logic
  function getSavedCalculations() {
    const saved = localStorage.getItem("stockCalculations");
    return saved ? JSON.parse(saved) : [];
  }

  function saveCalculation() {
    const currentData = calculate();

    // Don't save empty calculations
    if (currentData.buyPrice === 0 && currentData.sellPrice === 0 && currentData.shares === 0) {
      alert("Introduce datos antes de guardar");
      return;
    }

    const name = prompt("Nombre para este cálculo:");
    if (!name) return;

    const newCalculation = {
      id: Date.now(),
      name: name,
      date: new Date().toLocaleDateString(),
      data: currentData,
    };

    const saved = getSavedCalculations();
    saved.unshift(newCalculation); // Add to top
    localStorage.setItem("stockCalculations", JSON.stringify(saved));

    renderSavedList();
  }

  function loadCalculation(id) {
    const saved = getSavedCalculations();
    const calculation = saved.find((item) => item.id === id);

    if (calculation) {
      buyPriceInput.value = calculation.data.buyPrice;
      sellPriceInput.value = calculation.data.sellPrice;
      sharesInput.value = calculation.data.shares;
      taxRateInput.value = calculation.data.taxRate;
      calculate();
    }
  }

  function renderSavedList() {
    const saved = getSavedCalculations();
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

      card.addEventListener("click", () => loadCalculation(item.id));
      savedList.appendChild(card);
    });
  }

  // Event Listeners
  inputs.forEach((input) => {
    input.addEventListener("input", calculate);
  });

  saveBtn.addEventListener("click", saveCalculation);

  // Initial render
  renderSavedList();
});

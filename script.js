const appData = window.FLIPKART_APP_DATA;

const state = {
  search: "",
  category: "All",
  brand: "All",
  sort: "discount-desc",
  maxRetail: 10000,
  minDiscount: 0,
};

const elements = {
  heroProducts: document.getElementById("heroProducts"),
  heroDiscount: document.getElementById("heroDiscount"),
  heroR2: document.getElementById("heroR2"),
  searchInput: document.getElementById("searchInput"),
  categorySelect: document.getElementById("categorySelect"),
  brandSelect: document.getElementById("brandSelect"),
  sortSelect: document.getElementById("sortSelect"),
  priceRange: document.getElementById("priceRange"),
  discountRange: document.getElementById("discountRange"),
  priceRangeValue: document.getElementById("priceRangeValue"),
  discountRangeValue: document.getElementById("discountRangeValue"),
  summaryCards: document.getElementById("summaryCards"),
  brandChart: document.getElementById("brandChart"),
  categoryChart: document.getElementById("categoryChart"),
  histogramChart: document.getElementById("histogramChart"),
  pieChart: document.getElementById("pieChart"),
  brandSalesChart: document.getElementById("brandSalesChart"),
  predictionChart: document.getElementById("predictionChart"),
  retailInput: document.getElementById("retailInput"),
  predictButton: document.getElementById("predictButton"),
  predictedPrice: document.getElementById("predictedPrice"),
  predictedDiscount: document.getElementById("predictedDiscount"),
  modelMetrics: document.getElementById("modelMetrics"),
  spotlightCard: document.getElementById("spotlightCard"),
  resultsCount: document.getElementById("resultsCount"),
  resultsCaption: document.getElementById("resultsCaption"),
  productRows: document.getElementById("productRows"),
};

const PIE_COLORS = ["#b45309", "#d97706", "#f59e0b", "#92400e", "#7c2d12", "#c2410c"];

const formatCurrency = (value) => `Rs. ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const formatPercent = (value) => `${Number(value).toFixed(2)}%`;

function populateFilters() {
  const categories = ["All", ...appData.filters.categories];
  const brands = ["All", ...appData.filters.brands];

  elements.categorySelect.innerHTML = categories
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  elements.brandSelect.innerHTML = brands
    .map((brand) => `<option value="${escapeHtml(brand)}">${escapeHtml(brand)}</option>`)
    .join("");

  const maxRetail = Math.ceil(appData.summary.maxRetailPrice / 1000) * 1000;
  elements.priceRange.max = String(maxRetail);
  elements.priceRange.value = String(maxRetail);
  state.maxRetail = Number(elements.priceRange.value);
  updateRangeLabels();
}

function renderSummaryCards(products) {
  const totals = summarizeProducts(products);
  const cards = [
    { label: "Filtered Products", value: products.length.toLocaleString("en-IN") },
    { label: "Total Discounted Sales", value: formatCurrency(totals.discountedSum) },
    { label: "Average Retail Price", value: formatCurrency(totals.averageRetail) },
    { label: "Average Discount %", value: formatPercent(totals.averageDiscount) },
  ];

  elements.summaryCards.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
        </article>
      `
    )
    .join("");
}

function summarizeProducts(products) {
  const totals = products.reduce(
    (acc, product) => {
      acc.retailSum += product.retail;
      acc.discountedSum += product.discounted;
      acc.discountSum += product.discountPercent;
      return acc;
    },
    { retailSum: 0, discountedSum: 0, discountSum: 0 }
  );

  const count = products.length || 1;
  return {
    retailSum: totals.retailSum,
    discountedSum: totals.discountedSum,
    averageRetail: totals.retailSum / count,
    averageDiscounted: totals.discountedSum / count,
    averageDiscount: totals.discountSum / count,
  };
}

function renderBarChart(container, items) {
  const max = Math.max(...items.map((item) => item.count), 1);
  container.innerHTML = items
    .map(
      (item) => `
        <div class="bar-row" title="${escapeHtml(`${item.name}: ${item.count.toLocaleString("en-IN")} products`)}">
          <div class="bar-label">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${item.count.toLocaleString("en-IN")}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(item.count / max) * 100}%"></div>
          </div>
        </div>
      `
    )
    .join("");
}

function getFilteredProducts() {
  const search = state.search.toLowerCase();
  const filtered = appData.products.filter((product) => {
    const matchesSearch = !search || product.name.toLowerCase().includes(search) || product.brand.toLowerCase().includes(search);
    const matchesCategory = state.category === "All" || product.category === state.category;
    const matchesBrand = state.brand === "All" || product.brand === state.brand;
    const matchesRetail = product.retail <= state.maxRetail;
    const matchesDiscount = product.discountPercent >= state.minDiscount;

    return matchesSearch && matchesCategory && matchesBrand && matchesRetail && matchesDiscount;
  });

  return filtered.sort(sortProducts);
}

function sortProducts(a, b) {
  switch (state.sort) {
    case "retail-desc":
      return b.retail - a.retail;
    case "retail-asc":
      return a.retail - b.retail;
    case "discounted-asc":
      return a.discounted - b.discounted;
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "discount-desc":
    default:
      return b.discountPercent - a.discountPercent;
  }
}

function renderProducts(products) {
  const visible = products.slice(0, 120);
  elements.resultsCount.textContent = `${products.length.toLocaleString("en-IN")} products`;
  elements.resultsCaption.textContent =
    products.length > visible.length
      ? `Showing the top ${visible.length} products after applying your selected conditions.`
      : "Showing products that match the selected conditions.";

  if (!visible.length) {
    elements.productRows.innerHTML = `<tr><td class="empty-state" colspan="6">No products match these filter conditions. Try widening the price or discount range.</td></tr>`;
    return;
  }

  elements.productRows.innerHTML = visible
    .map(
      (product) => `
        <tr>
          <td><div class="product-name">${escapeHtml(product.name)}</div></td>
          <td>${escapeHtml(product.category)}</td>
          <td>${escapeHtml(product.brand)}</td>
          <td>${formatCurrency(product.retail)}</td>
          <td>${formatCurrency(product.discounted)}</td>
          <td>${formatPercent(product.discountPercent)}</td>
        </tr>
      `
    )
    .join("");
}

function renderSpotlight(products) {
  const best = products[0];
  if (!best) {
    elements.spotlightCard.innerHTML = `<p class="empty-state">No spotlight product is available for the selected filters.</p>`;
    return;
  }

  elements.spotlightCard.innerHTML = `
    <h3>${escapeHtml(best.name)}</h3>
    <div class="spotlight-meta">
      <span>${escapeHtml(best.category)}</span>
      <span>${escapeHtml(best.brand)}</span>
      <span>${escapeHtml(best.rating)}</span>
    </div>
    <div class="price-pair">
      <div class="price-block">
        <small>Retail price</small>
        <strong>${formatCurrency(best.retail)}</strong>
      </div>
      <div class="price-block">
        <small>Discounted price</small>
        <strong>${formatCurrency(best.discounted)}</strong>
      </div>
    </div>
    <div class="discount-badge">Discount ${formatPercent(best.discountPercent)}</div>
  `;
}

function runPrediction() {
  const retail = Math.max(0, Number(elements.retailInput.value) || 0);
  const predicted = Math.max(0, appData.model.intercept + appData.model.slope * retail);
  const discountPercent = retail > 0 ? ((retail - predicted) / retail) * 100 : 0;

  elements.predictedPrice.textContent = formatCurrency(predicted);
  elements.predictedDiscount.textContent = formatPercent(Math.max(0, discountPercent));
}

function renderModelMetrics() {
  const metrics = [
    `Slope: ${appData.model.slope.toFixed(4)}`,
    `Intercept: ${appData.model.intercept.toFixed(2)}`,
    `MSE: ${appData.model.mse.toLocaleString("en-IN")}`,
    `R2 Score: ${appData.model.r2.toFixed(4)}`,
  ];

  elements.modelMetrics.innerHTML = metrics.map((metric) => `<div class="metric-pill">${metric}</div>`).join("");
}

function renderAnalytics(products) {
  renderHistogram(products);
  renderPieChart(products);
  renderBrandSalesChart(products);
  renderPredictionChart(products);
}

function renderHistogram(products) {
  if (!products.length) {
    elements.histogramChart.innerHTML = emptyChartState("No retail price distribution available.");
    return;
  }

  const maxRetail = Math.max(...products.map((product) => product.retail), 1);
  const bins = 8;
  const step = maxRetail / bins;
  const counts = Array.from({ length: bins }, (_, index) => {
    const start = index * step;
    const end = index === bins - 1 ? maxRetail : (index + 1) * step;
    const count = products.filter((product) => product.retail >= start && (index === bins - 1 ? product.retail <= end : product.retail < end)).length;
    return { label: `${formatCompact(start)}-${formatCompact(end)}`, value: count };
  });

  elements.histogramChart.innerHTML = createVerticalBarSvg({
    items: counts,
    valueKey: "value",
    barColor: "#b45309",
    titleFormatter: (item) => `${item.value.toLocaleString("en-IN")} products`,
    tooltipFormatter: (item) => `Retail price range: ${item.label}\nProducts: ${item.value.toLocaleString("en-IN")}`,
  });
}

function renderBrandSalesChart(products) {
  if (!products.length) {
    elements.brandSalesChart.innerHTML = emptyChartState("No brand sales chart available.");
    return;
  }

  const grouped = aggregateBy(products, "brand", (acc, product) => acc + product.discounted);
  const top = Object.entries(grouped)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 8);

  elements.brandSalesChart.innerHTML = createVerticalBarSvg({
    items: top,
    valueKey: "sales",
    barColor: "#7c2d12",
    titleFormatter: (item) => formatCurrency(item.sales),
    tooltipFormatter: (item) => `Brand: ${item.name}\nDiscounted sales: ${formatCurrency(item.sales)}`,
  });
}

function renderPredictionChart(products) {
  if (!products.length) {
    elements.predictionChart.innerHTML = emptyChartState("No prediction chart available.");
    return;
  }

  const sample = products
    .slice()
    .sort((a, b) => a.retail - b.retail)
    .filter((_, index, list) => index % Math.max(1, Math.floor(list.length / 8)) === 0)
    .slice(0, 8)
    .map((product) => ({
      name: product.name,
      label: formatCompact(product.retail),
      retail: product.retail,
      actual: product.discounted,
      predicted: Math.max(0, appData.model.intercept + appData.model.slope * product.retail),
    }));

  elements.predictionChart.innerHTML = createGroupedBarSvg(sample);
}

function renderPieChart(products) {
  if (!products.length) {
    elements.pieChart.innerHTML = emptyChartState("No category share available.");
    return;
  }

  const grouped = aggregateBy(products, "category", (acc, product) => acc + product.discounted);
  const entries = Object.entries(grouped)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales);
  const top = entries.slice(0, 5);
  const others = entries.slice(5).reduce((sum, item) => sum + item.sales, 0);
  if (others > 0) top.push({ name: "Others", sales: others });

  const total = top.reduce((sum, item) => sum + item.sales, 0) || 1;
  let angle = -Math.PI / 2;
  const cx = 120;
  const cy = 120;
  const r = 92;
  const segments = top.map((item, index) => {
    const portion = item.sales / total;
    const nextAngle = angle + portion * Math.PI * 2;
    const path = describeArcSlice(cx, cy, r, angle, nextAngle);
    angle = nextAngle;
    return `<path d="${path}" fill="${PIE_COLORS[index % PIE_COLORS.length]}"><title>${escapeHtml(`${item.name}\nSales: ${formatCurrency(item.sales)}\nShare: ${((item.sales / total) * 100).toFixed(1)}%`)}</title></path>`;
  });

  const legend = top
    .map((item, index) => {
      const percent = ((item.sales / total) * 100).toFixed(1);
      return `
        <div class="pie-legend-item">
          <span class="pie-swatch" style="background:${PIE_COLORS[index % PIE_COLORS.length]}"></span>
          <span>${escapeHtml(item.name)} (${percent}%)</span>
        </div>
      `;
    })
    .join("");

  elements.pieChart.innerHTML = `
    <svg class="chart-frame" viewBox="0 0 260 260" aria-label="Category sales share pie chart">
      <circle cx="120" cy="120" r="104" fill="rgba(180, 83, 9, 0.07)"></circle>
      ${segments.join("")}
      <circle cx="120" cy="120" r="46" fill="#fff8ef"></circle>
      <text x="120" y="114" text-anchor="middle" class="chart-title-value">Sales</text>
      <text x="120" y="132" text-anchor="middle" class="chart-label">Share</text>
    </svg>
    <div class="pie-legend">${legend}</div>
  `;
}

function createVerticalBarSvg({ items, valueKey, barColor, titleFormatter, tooltipFormatter }) {
  const width = 760;
  const height = 320;
  const left = 56;
  const right = 18;
  const top = 24;
  const bottom = 68;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(...items.map((item) => item[valueKey]), 1);
  const barWidth = chartWidth / items.length;
  const gridValues = Array.from({ length: 4 }, (_, index) => (maxValue / 4) * (index + 1));

  const grids = gridValues
    .map((value) => {
      const y = top + chartHeight - (value / maxValue) * chartHeight;
      return `
        <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="chart-grid"></line>
        <text x="${left - 8}" y="${y + 4}" text-anchor="end" class="chart-label">${formatCompact(value)}</text>
      `;
    })
    .join("");

  const bars = items
    .map((item, index) => {
      const value = item[valueKey];
      const barHeight = (value / maxValue) * chartHeight;
      const x = left + index * barWidth + barWidth * 0.16;
      const y = top + chartHeight - barHeight;
      const w = barWidth * 0.68;
      const labelX = x + w / 2;
      return `
        <rect x="${x}" y="${y}" width="${w}" height="${barHeight}" rx="10" fill="${barColor}" opacity="0.92">
          <title>${escapeHtml(tooltipFormatter ? tooltipFormatter(item) : titleFormatter(item))}</title>
        </rect>
        <text x="${labelX}" y="${y - 8}" text-anchor="middle" class="chart-title-value">${escapeHtml(titleFormatter(item))}</text>
        <text x="${labelX}" y="${height - 18}" text-anchor="middle" class="chart-label">${escapeHtml(shorten(item.name || item.label, 12))}</text>
      `;
    })
    .join("");

  return `
    <svg class="chart-frame" viewBox="0 0 ${width} ${height}" aria-label="Bar chart">
      ${grids}
      <line x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}" class="chart-axis"></line>
      <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" class="chart-axis"></line>
      ${bars}
    </svg>
  `;
}

function createGroupedBarSvg(items) {
  const width = 760;
  const height = 320;
  const left = 56;
  const right = 20;
  const top = 24;
  const bottom = 68;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const maxValue = Math.max(...items.flatMap((item) => [item.actual, item.predicted]), 1);
  const groupWidth = chartWidth / items.length;
  const gridValues = Array.from({ length: 4 }, (_, index) => (maxValue / 4) * (index + 1));

  const grids = gridValues
    .map((value) => {
      const y = top + chartHeight - (value / maxValue) * chartHeight;
      return `
        <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" class="chart-grid"></line>
        <text x="${left - 8}" y="${y + 4}" text-anchor="end" class="chart-label">${formatCompact(value)}</text>
      `;
    })
    .join("");

  const bars = items
    .map((item, index) => {
      const baseX = left + index * groupWidth + groupWidth * 0.15;
      const actualHeight = (item.actual / maxValue) * chartHeight;
      const predictedHeight = (item.predicted / maxValue) * chartHeight;
      const actualX = baseX;
      const predictedX = baseX + groupWidth * 0.28;
      const actualW = groupWidth * 0.22;
      const predictedW = groupWidth * 0.22;
      return `
        <rect x="${actualX}" y="${top + chartHeight - actualHeight}" width="${actualW}" height="${actualHeight}" rx="8" fill="#b45309">
          <title>${escapeHtml(`Product: ${item.name}\nRetail price: ${formatCurrency(item.retail)}\nActual discounted: ${formatCurrency(item.actual)}`)}</title>
        </rect>
        <rect x="${predictedX}" y="${top + chartHeight - predictedHeight}" width="${predictedW}" height="${predictedHeight}" rx="8" fill="#f59e0b">
          <title>${escapeHtml(`Product: ${item.name}\nRetail price: ${formatCurrency(item.retail)}\nPredicted discounted: ${formatCurrency(item.predicted)}`)}</title>
        </rect>
        <text x="${baseX + groupWidth * 0.2}" y="${height - 18}" text-anchor="middle" class="chart-label">${escapeHtml(item.label)}</text>
      `;
    })
    .join("");

  return `
    <svg class="chart-frame" viewBox="0 0 ${width} ${height}" aria-label="Actual versus predicted price chart">
      ${grids}
      <line x1="${left}" y1="${top + chartHeight}" x2="${width - right}" y2="${top + chartHeight}" class="chart-axis"></line>
      <line x1="${left}" y1="${top}" x2="${left}" y2="${top + chartHeight}" class="chart-axis"></line>
      ${bars}
      <rect x="${width - 186}" y="28" width="12" height="12" rx="3" fill="#b45309"></rect>
      <text x="${width - 168}" y="38" class="chart-label">Actual discounted</text>
      <rect x="${width - 186}" y="50" width="12" height="12" rx="3" fill="#f59e0b"></rect>
      <text x="${width - 168}" y="60" class="chart-label">Predicted discounted</text>
    </svg>
  `;
}

function aggregateBy(products, key, reducer) {
  return products.reduce((acc, product) => {
    const name = product[key];
    const current = acc[name] || 0;
    acc[name] = reducer(current, product);
    return acc;
  }, {});
}

function describeArcSlice(cx, cy, radius, startAngle, endAngle) {
  const x1 = cx + radius * Math.cos(startAngle);
  const y1 = cy + radius * Math.sin(startAngle);
  const x2 = cx + radius * Math.cos(endAngle);
  const y2 = cy + radius * Math.sin(endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return [`M ${cx} ${cy}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, "Z"].join(" ");
}

function emptyChartState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function formatCompact(value) {
  return Number(value).toLocaleString("en-IN", { notation: "compact", maximumFractionDigits: 1 });
}

function shorten(value, max) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function updateRangeLabels() {
  elements.priceRangeValue.textContent = formatCurrency(state.maxRetail);
  elements.discountRangeValue.textContent = `${state.minDiscount}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function syncHero() {
  elements.heroProducts.textContent = appData.summary.totalProducts.toLocaleString("en-IN");
  elements.heroDiscount.textContent = formatPercent(appData.summary.averageDiscountPercent);
  elements.heroR2.textContent = appData.model.r2.toFixed(4);
}

function refresh() {
  const filtered = getFilteredProducts();
  renderSummaryCards(filtered);
  renderProducts(filtered);
  renderSpotlight(filtered);
  renderAnalytics(filtered);
}

function attachEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    refresh();
  });

  elements.categorySelect.addEventListener("change", (event) => {
    state.category = event.target.value;
    refresh();
  });

  elements.brandSelect.addEventListener("change", (event) => {
    state.brand = event.target.value;
    refresh();
  });

  elements.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    refresh();
  });

  elements.priceRange.addEventListener("input", (event) => {
    state.maxRetail = Number(event.target.value);
    updateRangeLabels();
    refresh();
  });

  elements.discountRange.addEventListener("input", (event) => {
    state.minDiscount = Number(event.target.value);
    updateRangeLabels();
    refresh();
  });

  elements.predictButton.addEventListener("click", runPrediction);
  elements.retailInput.addEventListener("input", runPrediction);
}

function init() {
  syncHero();
  populateFilters();
  renderBarChart(elements.brandChart, appData.topBrands);
  renderBarChart(elements.categoryChart, appData.topCategories);
  renderModelMetrics();
  attachEvents();
  runPrediction();
  refresh();
}

init();

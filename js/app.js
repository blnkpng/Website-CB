const rupiah = value => `Rp. ${Number(value || 0).toLocaleString("id-ID")}`;

const state = {
  route: "dashboard",
  masterBarang: [],
  supplier: [],
  lastWaText: "*Nota tanggal 01-10 Juli 2026*\nTotal Rp0",
  lastCashflow: null,
  cashFilter: {
    start: "",
    end: ""
  }
};


function initPinGate() {
  const form = document.getElementById("pinForm");
  const input = document.getElementById("pinInput");
  const button = document.getElementById("pinSubmitBtn");
  const errorBox = document.getElementById("pinError");

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    const pin = input.value.trim();
    if (!pin) return;

    button.disabled = true;
    button.textContent = "Mengecek...";
    errorBox.textContent = "";

    try {
      const res = await callApi("VERIFY_PIN", { pin });
      const token = res.token || res.authToken || res.sessionToken;
      if (!token) throw new Error("Token login tidak diterima dari server.");

      sessionStorage.setItem("CABE_AUTH_TOKEN", token);
      unlockApp();
      await init();
    } catch (err) {
      sessionStorage.removeItem("CABE_AUTH_TOKEN");
      errorBox.textContent = err.message || "PIN salah. Coba lagi.";
      input.select();
    } finally {
      button.disabled = false;
      button.textContent = "Buka Aplikasi";
    }
  });
}

function unlockApp() {
  document.body.classList.remove("pin-locked");
  document.getElementById("pinGate")?.classList.add("is-hidden");
}

async function bootApp() {
  initPinGate();

  const token = sessionStorage.getItem("CABE_AUTH_TOKEN");
  if (token) {
    unlockApp();
    await init();
  } else {
    document.body.classList.add("pin-locked");
    setTimeout(() => document.getElementById("pinInput")?.focus(), 50);
  }
}

document.addEventListener("DOMContentLoaded", bootApp);


async function init() {
  setToday();
  bindNavigation();
  bindForms();
  bindMoneyInputs(document);
  bindMultiItems();
  await loadAll();
  resetMasukItems();
  resetTerjualItems();
  updateWaPreview();
}

function setToday() {
  const today = new Date().toISOString().slice(0, 10);
  document.querySelectorAll('input[type="date"]').forEach(input => {
    if (!input.value) input.value = today;
  });
  const start = document.querySelector('[name="tanggalAwal"]');
  const end = document.querySelector('[name="tanggalAkhir"]');
  if (start) start.value = today;
  if (end) end.value = today;

  setCashFilterThisMonth();
}

function setCashFilterThisMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const start = toIsoDate(first);
  const end = toIsoDate(last);

  state.cashFilter.start = start;
  state.cashFilter.end = end;

  const startInput = document.getElementById("cashStartDate");
  const endInput = document.getElementById("cashEndDate");

  if (startInput) startInput.value = start;
  if (endInput) endInput.value = end;
}

function bindNavigation() {
  document.querySelectorAll("[data-route], [data-route-button]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.route || btn.dataset.routeButton));
  });
  document.getElementById("refreshBtn").addEventListener("click", loadAll);
  document.getElementById("stockRefreshBtn").addEventListener("click", loadStock);
}

function bindMultiItems() {
  document.getElementById("addMasukItemBtn").addEventListener("click", () => addItemRow("masuk"));
  document.getElementById("addTerjualItemBtn").addEventListener("click", () => addItemRow("terjual"));

  document.getElementById("resetMasukBtn").addEventListener("click", () => {
    document.getElementById("formMasuk").reset();
    setToday();
    resetMasukItems();
  });

  document.getElementById("resetTerjualBtn").addEventListener("click", () => {
    document.getElementById("formTerjual").reset();
    setToday();
    resetTerjualItems();
  });

  document.querySelector('[name="tanggalAwal"]').addEventListener("change", updateWaPreview);
  document.querySelector('[name="tanggalAkhir"]').addEventListener("change", updateWaPreview);
  document.getElementById("copyWaBtn").addEventListener("click", copyWaText);

  document.getElementById("applyCashFilterBtn").addEventListener("click", () => {
    state.cashFilter.start = document.getElementById("cashStartDate").value;
    state.cashFilter.end = document.getElementById("cashEndDate").value;
    if (state.lastCashflow) renderCashflow(state.lastCashflow);
  });

  document.getElementById("thisMonthCashBtn").addEventListener("click", () => {
    setCashFilterThisMonth();
    if (state.lastCashflow) renderCashflow(state.lastCashflow);
  });
}

function navigate(route) {
  state.route = route;
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(`page-${route}`)?.classList.add("active");

  document.querySelectorAll(".nav-link,.mobile-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.route === route);
  });

  const title = {
    dashboard: "Dashboard",
    masuk: "Barang Masuk",
    terjual: "Barang Terjual",
    stok: "Stok Barang",
    hutang: "Hutang Supplier",
    cashflow: "Cashflow",
    nota: "Nota Penjualan"
  }[route] || "Dashboard";

  document.getElementById("pageTitle").textContent = title;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindForms() {
  document.getElementById("formMasuk").addEventListener("submit", async event => {
    event.preventDefault();
    const payload = formData(event.target);
    payload.items = collectItems("masukItems", ["namaBarang", "qty", "harga"]);

    if (!payload.items.length) return toast("Isi minimal satu barang masuk.");

    await submit("ADD_BARANG_MASUK", payload, "Barang masuk tersimpan.");
    event.target.reset();
    setToday();
    resetMasukItems();
  });

  document.getElementById("formTerjual").addEventListener("submit", async event => {
    event.preventDefault();
    const payload = formData(event.target);
    payload.items = collectItems("terjualItems", ["namaBarang", "qty", "hpp", "laba", "hargaJual"]);

    if (!payload.items.length) return toast("Isi minimal satu barang terjual.");

    await submit("ADD_BARANG_TERJUAL", payload, "Data penjualan tersimpan.");
    event.target.reset();
    setToday();
    resetTerjualItems();
  });

  document.getElementById("formBayarHutang").addEventListener("submit", async event => {
    event.preventDefault();
    await submit("ADD_BAYAR_HUTANG", formData(event.target), "Pembayaran hutang tersimpan.");
    event.target.reset();
    setToday();
  });

  document.getElementById("formNota").addEventListener("submit", async event => {
    event.preventDefault();
    const data = formData(event.target);
    const payload = {
      tanggalAwal: data.tanggalAwal,
      tanggalAkhir: data.tanggalAkhir,
      start: data.tanggalAwal,
      end: data.tanggalAkhir,
      label: formatRangeLabel(data.tanggalAwal, data.tanggalAkhir)
    };

    try {
      const res = await callApi("GENERATE_NOTA_PENJUALAN", payload);
      const waText = res.waText || buildWaText(payload.label, res.total || 0);
      state.lastWaText = waText;
      document.getElementById("waText").textContent = waText;

      const link = document.getElementById("notaLink");
      if (res.url && res.url !== "#") {
        link.href = res.url;
        link.hidden = false;
      } else {
        link.hidden = true;
      }

      toast(res.message || "Nota penjualan berhasil dibuat");
    } catch (err) {
      toast(err.message || "Gagal generate nota");
    }
  });
}

function formData(form) {
  const moneyNames = new Set(["jumlahBayar", "harga", "hpp", "laba", "hargaJual", "total", "nominal"]);
  const data = Object.fromEntries(new FormData(form).entries());

  Object.keys(data).forEach(key => {
    if (moneyNames.has(key) || key.toLowerCase().includes("harga") || key.toLowerCase().includes("laba") || key.toLowerCase().includes("bayar")) {
      data[key] = moneyToNumber(data[key]);
    }
  });

  return data;
}

function collectItems(containerId, fields) {
  return Array.from(document.querySelectorAll(`#${containerId} .item-row`))
    .map(row => {
      const item = {};
      fields.forEach(field => {
        const input = row.querySelector(`[data-field="${field}"]`);
        item[field] = input && input.hasAttribute("data-money") ? moneyToNumber(input.value) : (input ? input.value : "");
      });
      return item;
    })
    .filter(item => item.namaBarang && Number(item.qty || 0) > 0);
}

function addItemRow(type, data = {}) {
  const isMasuk = type === "masuk";
  const container = document.getElementById(isMasuk ? "masukItems" : "terjualItems");
  const countId = isMasuk ? "masukItemCount" : "terjualItemCount";

  const row = document.createElement("div");
  row.className = isMasuk ? "item-row item-row-masuk" : "item-row item-row-terjual";

  if (isMasuk) {
    row.classList.add("masuk-clean-row");
    row.innerHTML = `
      <div class="masuk-no">1</div>

      <label class="masuk-field masuk-barang">
        <span>Barang</span>
        <select data-field="namaBarang" required></select>
      </label>

      <label class="masuk-field masuk-qty">
        <span>Qty</span>
        <input type="number" data-field="qty" min="0" step="0.01" placeholder="0" value="${escapeAttr(data.qty || "")}" required />
      </label>

      <label class="masuk-field masuk-harga">
        <span>Harga</span>
        <input type="text" inputmode="numeric" class="money-input" data-money data-field="harga" placeholder="Rp. 0" value="${escapeAttr(formatMoneyValue(data.harga || ""))}" required />
      </label>

      <button type="button" class="masuk-remove-btn remove-item-btn" title="Hapus barang">×</button>
    `;
  } else {
    row.innerHTML = `
      <div class="item-number"></div>
      <label class="item-field item-name-field">Nama Barang
        <span class="stock-available" data-stock-info>Stok tersedia: -</span>
        <select data-field="namaBarang" required></select>
      </label>
      <label class="item-field">Qty
        <input type="number" data-field="qty" min="0" step="0.01" placeholder="0" value="${escapeAttr(data.qty || "")}" required />
      </label>
      <label class="item-field">HPP/Kg
        <input type="text" inputmode="numeric" class="money-input" data-money data-field="hpp" placeholder="Rp. 0" value="${escapeAttr(formatMoneyValue(data.hpp || ""))}" readonly />
      </label>
      <label class="item-field">Laba/Kg
        <input type="text" inputmode="numeric" class="money-input" data-money data-field="laba" placeholder="Rp. 0" value="${escapeAttr(formatMoneyValue(data.laba || ""))}" required />
      </label>
      <label class="item-field">Harga Jual
        <input type="text" inputmode="numeric" class="money-input" data-money data-field="hargaJual" placeholder="Rp. 0" value="${escapeAttr(formatMoneyValue(data.hargaJual || ""))}" readonly />
      </label>
      <button type="button" class="remove-item-btn" title="Hapus barang">×</button>
    `;
  }

  container.appendChild(row);
  bindMoneyInputs(row);

  const select = row.querySelector('[data-field="namaBarang"]');
  fillBarangSelect(select, data.namaBarang || "");

  select.addEventListener("change", () => updateStockInfoRow(row));

  if (!isMasuk) {
    const labaInput = row.querySelector('[data-field="laba"]');
    select.addEventListener("change", () => updateSalePriceRow(row));
    labaInput.addEventListener("input", () => updateSalePriceRow(row));
    updateSalePriceRow(row);
  }

  updateStockInfoRow(row);

  row.querySelector(".remove-item-btn").addEventListener("click", () => {
    row.remove();
    if (!container.children.length) addItemRow(type);
    refreshNumbers(container.id, countId);
  });

  refreshNumbers(container.id, countId);
}

function updateSalePriceRow(row) {
  const nama = row.querySelector('[data-field="namaBarang"]')?.value || "";
  const hppInput = row.querySelector('[data-field="hpp"]');
  const labaInput = row.querySelector('[data-field="laba"]');
  const hargaJualInput = row.querySelector('[data-field="hargaJual"]');

  const stockItem = state.stok.find(item => normalizeText(item.nama) === normalizeText(nama));
  const hpp = Number(stockItem?.hpp || 0);
  const laba = moneyToNumber(labaInput?.value || 0);

  if (hppInput) hppInput.value = hpp ? formatMoneyValue(hpp) : "";
  if (hargaJualInput) hargaJualInput.value = hpp || laba ? formatMoneyValue(hpp + laba) : "";
}

function updateStockInfoRow(row) {
  const nama = row.querySelector('[data-field="namaBarang"]')?.value || "";
  const info = row.querySelector("[data-stock-info]");
  if (!info) return;

  const stockItem = state.stok.find(item => normalizeText(item.nama) === normalizeText(nama));

  if (!nama) {
    info.textContent = "Stok tersedia: -";
    info.className = "stock-available";
    return;
  }

  const stok = Number(stockItem?.stok || 0);
  const satuan = stockItem?.satuan || "Kg";
  const status = String(stockItem?.status || "").toUpperCase();

  info.textContent = `Stok tersedia: ${stok.toLocaleString("id-ID")} ${satuan}`;
  info.className = "stock-available";

  if (status === "HABIS" || stok <= 0) info.classList.add("danger");
  else if (status === "MENIPIS") info.classList.add("warning");
  else info.classList.add("safe");
}

function bindMoneyInputs(scope = document) {
  scope.querySelectorAll("[data-money]").forEach(input => {
    if (input.dataset.moneyBound === "true") return;
    input.dataset.moneyBound = "true";

    if (input.value) {
      input.value = formatMoneyValue(input.value);
    }

    input.addEventListener("input", () => {
      const cursorAtEnd = input.selectionStart === input.value.length;
      input.value = formatMoneyValue(input.value);
      if (cursorAtEnd) input.setSelectionRange(input.value.length, input.value.length);
    });

    input.addEventListener("blur", () => {
      input.value = formatMoneyValue(input.value);
    });
  });
}

function moneyToNumber(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace(/Rp\.?/gi, "").replace(/\./g, "").replace(/,/g, "").replace(/[^0-9-]/g, "")) || 0;
}

function formatMoneyValue(value) {
  const number = moneyToNumber(value);
  if (!number) return "";
  return `Rp. ${number.toLocaleString("id-ID")}`;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function resetMasukItems() {
  document.getElementById("masukItems").innerHTML = "";
  addItemRow("masuk");
}

function resetTerjualItems() {
  document.getElementById("terjualItems").innerHTML = "";
  addItemRow("terjual");
}

function refreshNumbers(containerId, counterId) {
  const rows = Array.from(document.querySelectorAll(`#${containerId} .item-row`));
  rows.forEach((row, index) => {
    const numberEl = row.querySelector(".item-number, .masuk-no");
    if (numberEl) numberEl.textContent = index + 1;
  });
  document.getElementById(counterId).textContent = `${rows.length} item`;
}

function fillBarangSelect(select, selectedValue = "") {
  const options = state.masterBarang.map(item => `<option value="${escapeAttr(item.nama)}">${escapeHtml(item.nama)}</option>`).join("");
  select.innerHTML = `<option value="">Pilih barang</option>${options}`;
  select.value = selectedValue;
}

async function submit(action, payload, successMessage) {
  try {
    const res = await callApi(action, payload);
    toast(res.message || successMessage);
    await loadAll();
  } catch (err) {
    toast(err.message || "Data gagal disimpan.");
  }
}

async function loadAll() {
  try {
    const [dashboard, masterBarang, supplier, stok, hutang, cashflow] = await Promise.all([
      callApi("GET_DASHBOARD"),
      callApi("GET_MASTER_BARANG"),
      callApi("GET_SUPPLIER"),
      callApi("GET_STOK_BARANG"),
      callApi("GET_HUTANG"),
      callApi("GET_CASHFLOW")
    ]);

    state.masterBarang = normalizeMaster(masterBarang);
    state.supplier = normalizeSupplier(supplier);
    state.stok = normalizeStock(stok);

    renderDashboard(normalizeDashboard(dashboard));
    renderSelects();
    refreshItemSelects();
    renderStock(state.stok);
    renderDebt(normalizeDebt(hutang));
    renderCashflow(normalizeCashflow(cashflow));
  } catch (err) {
    toast(err.message || "Gagal memuat data");
  }
}

async function loadStock() {
  try {
    renderStock(normalizeStock(await callApi("GET_STOK_BARANG")));
    toast("Data stok diperbarui.");
  } catch (err) {
    toast(err.message || "Gagal refresh stok");
  }
}

function renderDashboard(data) {
  setText("kpiStock", rupiah(data.totalNilaiStok));
  setText("heroStock", rupiah(data.totalNilaiStok));
  setText("kpiSales", rupiah(data.penjualanBulanIni));
  setText("kpiCashIn", rupiah(data.pemasukanCairBulanIni));
  setText("kpiReceivable", rupiah(data.tagihanBelumHC));
  setText("kpiProfitIn", rupiah(data.labaMasukBulanIni));
  setText("kpiProfitMoved", rupiah(data.labaDipindahBulanIni));
  setText("kpiProfitLeft", rupiah(data.sisaLabaBulanIni));
  setText("heroProfit", rupiah(data.sisaLabaBulanIni));
  setText("kpiDebt", rupiah(data.hutangBelumLunas));

  const wrap = document.getElementById("lowStockList");
  wrap.innerHTML = "";

  if (!data.stokPerluDicek.length) {
    wrap.innerHTML = `<div class="list-item"><div><strong>Semua stok aman</strong><span>Belum ada barang kritis.</span></div><span class="badge green">AMAN</span></div>`;
    return;
  }

  data.stokPerluDicek.forEach(item => {
    const status = String(item.status || "").toUpperCase();
    const cls = status === "MENIPIS" ? "orange" : "red";
    wrap.insertAdjacentHTML("beforeend", `
      <div class="list-item">
        <div>
          <strong>${escapeHtml(item.nama)}</strong>
          <span>${escapeHtml(item.kode)} · ${escapeHtml(item.kategori)} · Min ${Number(item.minimum || 0).toLocaleString("id-ID")}</span>
        </div>
        <span class="badge ${cls}">${escapeHtml(status)}</span>
      </div>
    `);
  });
}

function renderSelects() {
  const options = state.supplier.map(item => `<option value="${escapeAttr(item.nama)}">${escapeHtml(item.nama)}</option>`).join("");
  document.querySelectorAll('select[name="supplier"]').forEach(select => {
    const current = select.value;
    select.innerHTML = `<option value="">Pilih supplier</option>${options}`;
    select.value = current;
  });
}

function refreshItemSelects() {
  document.querySelectorAll('.item-row [data-field="namaBarang"]').forEach(select => {
    const current = select.value;
    fillBarangSelect(select, current);
    const itemRow = select.closest(".item-row");
    if (itemRow) updateStockInfoRow(itemRow);
    const row = select.closest(".item-row-terjual");
    if (row) updateSalePriceRow(row);
  });
}

function renderStock(rows) {
  const wrap = document.getElementById("stockList");
  wrap.innerHTML = "";

  if (!rows.length) {
    wrap.innerHTML = `<div class="list-item"><div><strong>Belum ada stok</strong><span>Input barang masuk dulu.</span></div></div>`;
    return;
  }

  rows.forEach(item => {
    const status = String(item.status || "").toUpperCase();
    const cls = status === "AMAN" ? "green" : status === "MENIPIS" ? "orange" : "red";

    wrap.insertAdjacentHTML("beforeend", `
      <article class="stock-card stock-card-center">
        <h4>${escapeHtml(item.nama)} <span class="status-text ${cls}">(${escapeHtml(status)})</span></h4>
        <strong>${Number(item.stok || 0).toLocaleString("id-ID")} ${escapeHtml(item.satuan)}</strong>
        <small>HPP ${rupiah(item.hpp)}</small>
      </article>
    `);
  });
}

function renderDebt(rows) {
  const wrap = document.getElementById("debtList");
  wrap.innerHTML = "";

  if (!rows.length) {
    wrap.innerHTML = `<div class="list-item"><div><strong>Tidak ada hutang</strong><span>Supplier aman.</span></div><span class="badge green">LUNAS</span></div>`;
    return;
  }

  rows.forEach(item => {
    wrap.insertAdjacentHTML("beforeend", `
      <div class="list-item">
        <div>
          <strong>${escapeHtml(item.supplier)}</strong>
          <span>${escapeHtml(item.noNota)} · Bayar ${rupiah(item.totalBayar)}</span>
        </div>
        <div style="text-align:right">
          <strong>${rupiah(item.sisaHutang)}</strong>
          <span class="badge red">${escapeHtml(item.status)}</span>
        </div>
      </div>
    `);
  });
}

function renderCashflow(data) {
  state.lastCashflow = data;

  const filteredRows = filterCashflowRows(data.rows || []);

  const filteredTotals = filteredRows.reduce((acc, row) => {
    acc.penjualan += Number(row.penjualan || 0);
    acc.pemasukan += Number(row.pemasukan || 0);
    acc.pengeluaran += Number(row.pengeluaran || 0);
    acc.laba += Number(row.laba || 0);
    acc.labaDipindah += row.lc ? Number(row.laba || 0) : 0;
    return acc;
  }, {
    penjualan: 0,
    pemasukan: 0,
    pengeluaran: 0,
    laba: 0,
    labaDipindah: 0
  });

  const tagihanBelumHC = Math.max(filteredTotals.penjualan - filteredTotals.pemasukan, 0);
  const sisaLaba = Math.max(filteredTotals.laba - filteredTotals.labaDipindah, 0);
  const saldoFilter = filteredTotals.pemasukan - filteredTotals.pengeluaran;

  setText("cashSales", rupiah(filteredTotals.penjualan));
  setText("cashIn", rupiah(filteredTotals.pemasukan));
  setText("cashReceivable", rupiah(tagihanBelumHC));
  setText("cashBalance", rupiah(saldoFilter));
  setText("cashProfitIn", rupiah(filteredTotals.laba));
  setText("cashProfitMoved", rupiah(filteredTotals.labaDipindah));
  setText("cashProfitLeft", rupiah(sisaLaba));
  setText("cashOut", rupiah(filteredTotals.pengeluaran));

  updateCashRangeNote(filteredRows);

  const wrap = document.getElementById("cashflowRows");
  wrap.innerHTML = "";

  if (!filteredRows.length) {
    wrap.innerHTML = `<div class="empty-state">Tidak ada data pada periode tanggal ini.</div>`;
    return;
  }

  filteredRows.forEach((row, index) => {
    const key = row.id || row.tanggal || index;
    const detailId = `cash-detail-${String(index).replace(/[^a-zA-Z0-9]/g, "")}`;

    wrap.insertAdjacentHTML("beforeend", `
      <article class="cash-row-card">
        <div class="cash-row-main">
          <div class="cash-day">${escapeHtml(shortCashDate(row.tanggal))}</div>

          <div class="cash-row-amount in">
            <strong>${rupiah(row.pemasukan)}</strong>
          </div>

          <div class="cash-row-amount out">
            <strong>${rupiah(row.pengeluaran)}</strong>
          </div>

          <label class="cash-row-check" title="H.C">
            <input type="checkbox" data-action="UPDATE_HC" data-key="${escapeAttr(key)}" ${row.hc ? "checked" : ""}>
            <span class="sr-only">H.C</span>
          </label>

          <label class="cash-row-check" title="L.C">
            <input type="checkbox" data-action="UPDATE_LC" data-key="${escapeAttr(key)}" ${row.lc ? "checked" : ""}>
            <span class="sr-only">L.C</span>
          </label>

          <button class="cash-row-detail-btn" type="button" aria-expanded="false" data-toggle-cash-detail="${escapeAttr(detailId)}">Detail</button>
        </div>

        <div class="cash-row-detail" id="${escapeAttr(detailId)}" hidden>
          <div><span>Tanggal</span><strong>${escapeHtml(row.tanggal)}</strong></div>
          <div><span>Penjualan</span><strong>${rupiah(row.penjualan)}</strong></div>
          <div><span>Saldo</span><strong>${rupiah(row.saldo)}</strong></div>
          <div><span>Laba</span><strong>${rupiah(row.laba)}</strong></div>
        </div>
      </article>
    `);
  });

  wrap.querySelectorAll("[data-toggle-cash-detail]").forEach(button => {
    button.addEventListener("click", () => {
      const box = document.getElementById(button.dataset.toggleCashDetail);
      const card = button.closest(".cash-row-card");
      if (!box) return;

      const willOpen = box.hidden;
      box.hidden = !willOpen;
      button.textContent = willOpen ? "Tutup" : "Detail";
      button.setAttribute("aria-expanded", willOpen ? "true" : "false");
      card?.classList.toggle("is-open", willOpen);
    });
  });

  wrap.querySelectorAll("input[type='checkbox']").forEach(input => {
    input.addEventListener("change", async event => {
      const action = event.target.dataset.action;
      const payload = {
        id: event.target.dataset.key,
        key: event.target.dataset.key,
        checked: event.target.checked
      };

      try {
        await callApi(action, payload);
        toast(action === "UPDATE_HC"
          ? (event.target.checked ? "H.C dicentang: uang masuk" : "H.C dibatalkan")
          : (event.target.checked ? "L.C dicentang: laba dipindah" : "L.C dibatalkan")
        );
        await loadAll();
      } catch (err) {
        event.target.checked = !event.target.checked;
        toast(err.message || "Status gagal diperbarui.");
      }
    });
  });
}

function filterCashflowRows(rows) {
  const start = state.cashFilter.start ? new Date(state.cashFilter.start + "T00:00:00") : null;
  const end = state.cashFilter.end ? new Date(state.cashFilter.end + "T23:59:59") : null;

  return rows.filter(row => {
    const date = parseIndonesianDate(row.tanggal);
    if (!date) return true;
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  });
}

function updateCashRangeNote(rows) {
  const note = document.getElementById("cashRangeNote");
  if (!note) return;

  const start = state.cashFilter.start;
  const end = state.cashFilter.end;
  const label = start && end ? formatRangeLabel(start, end) : "Semua tanggal";

  note.innerHTML = `
    <strong>Range:</strong> ${escapeHtml(label)}
    <span>${rows.length} tanggal tampil</span>
  `;
}

function parseIndonesianDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;

  const text = String(value);
  const parts = text.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function shortCashDate(value) {
  const date = parseIndonesianDate(value);
  if (!date) return String(value || "-");
  return String(date.getDate());
}

function updateWaPreview() {
  const start = document.querySelector('[name="tanggalAwal"]').value;
  const end = document.querySelector('[name="tanggalAkhir"]').value;
  const label = formatRangeLabel(start, end);
  state.lastWaText = buildWaText(label, 0);
  document.getElementById("waText").textContent = state.lastWaText;
}

function buildWaText(label, total) {
  return `*Nota tanggal ${label}*\nTotal ${rupiah(total)}`;
}

function formatRangeLabel(start, end) {
  if (!start || !end) return "01-10 Juli 2026";

  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const month = e.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const sd = String(s.getDate()).padStart(2, "0");
  const ed = String(e.getDate()).padStart(2, "0");

  return `${sd}-${ed} ${month}`;
}

async function copyWaText() {
  try {
    await navigator.clipboard.writeText(document.getElementById("waText").textContent);
    toast("Pesan nota berhasil disalin.");
  } catch (err) {
    toast("Pesan belum bisa disalin otomatis.");
  }
}

function normalizeMaster(data = []) {
  return asArray(data).map(item => ({
    kode: item.kode || item.kodeBarang || item["Kode Barang"] || item[0] || "",
    nama: item.nama || item.namaBarang || item["Nama Barang"] || item[1] || "",
    satuan: item.satuan || item["Satuan"] || item[2] || "Kg"
  })).filter(item => item.nama);
}

function normalizeSupplier(data = []) {
  return asArray(data).map(item => ({
    kode: item.kode || item.kodeSupplier || item["Kode Supplier"] || item[0] || "",
    nama: item.nama || item.namaSupplier || item["Nama Supplier"] || item[1] || ""
  })).filter(item => item.nama);
}

function normalizeDashboard(data = {}) {
  return {
    totalNilaiStok: num(data.totalNilaiStok ?? data.stockValue),
    penjualanBulanIni: num(data.penjualanBulanIni ?? data.salesThisMonth),
    pemasukanCairBulanIni: num(data.pemasukanCairBulanIni ?? data.pemasukanCair ?? data.cashIn),
    labaMasukBulanIni: num(data.labaMasukBulanIni ?? data.labaMasuk ?? data.grossProfit),
    labaDipindahBulanIni: num(data.labaDipindahBulanIni ?? data.labaDipindah ?? data.profitMoved),
    sisaLabaBulanIni: num(data.sisaLabaBulanIni ?? data.sisaLaba ?? data.profitLeft),
    tagihanBelumHC: num(data.tagihanBelumHC ?? data.belumCair ?? data.receivable),
    hutangBelumLunas: num(data.hutangBelumLunas ?? data.debt),
    stokPerluDicek: asArray(data.stokPerluDicek ?? data.lowStock)
  };
}

function normalizeStock(data = []) {
  return asArray(data).map(item => ({
    kode: item.kode || item.kodeBarang || item[0] || "",
    nama: item.nama || item.namaBarang || item[1] || "",
    stok: num(item.stok ?? item.stokAkhir ?? item[4]),
    satuan: item.satuan || item[3] || "Kg",
    hpp: num(item.hpp ?? item.hppKg ?? item[7]),
    status: item.status || item.statusStok || item[6] || "AMAN"
  })).filter(item => item.nama);
}

function normalizeDebt(data = []) {
  return asArray(data).map(item => ({
    noNota: item.noNota || item[0] || "",
    supplier: item.supplier || item[2] || "",
    totalBayar: num(item.totalBayar ?? item[4]),
    sisaHutang: num(item.sisaHutang ?? item[5]),
    status: item.status || item.statusHutang || item[6] || "BELUM LUNAS"
  })).filter(item => item.noNota || item.supplier);
}

function normalizeCashflow(data = {}) {
  return {
    penjualan: num(data.penjualan ?? data.sales),
    pemasukanCair: num(data.pemasukanCair ?? data.pemasukan ?? data.cashIn),
    tagihanBelumHC: num(data.tagihanBelumHC ?? data.belumCair ?? data.receivable),
    pengeluaran: num(data.pengeluaran ?? data.cashOut),
    saldo: num(data.saldo ?? data.balance),
    labaMasuk: num(data.labaMasuk ?? data.profitIn),
    labaDipindah: num(data.labaDipindah ?? data.profitMoved),
    sisaLaba: num(data.sisaLaba ?? data.profitLeft),
    rows: asArray(data.rows).map((row, i) => ({
      id: row.id || row.key || i,
      tanggal: row.tanggal || row.date || "",
      penjualan: num(row.penjualan ?? row.sales),
      pemasukan: num(row.pemasukan ?? row.cashIn),
      pengeluaran: num(row.pengeluaran ?? row.cashOut),
      saldo: num(row.saldo ?? row.balance),
      laba: num(row.laba ?? row.labaMasuk ?? row.profit),
      hc: Boolean(row.hc ?? row.HC),
      lc: Boolean(row.lc ?? row.LC)
    }))
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function num(value) {
  if (typeof value === "number") return value;
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace(/Rp/gi, "").replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "")) || 0;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

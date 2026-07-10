const demoData = {
  dashboard: {
    totalNilaiStok: 4250040,
    penjualanBulanIni: 2747000,
    pemasukanCairBulanIni: 1450000,
    labaMasukBulanIni: 1534000,
    labaDipindahBulanIni: 500000,
    sisaLabaBulanIni: 1034000,
    tagihanBelumHC: 1297000,
    hutangBelumLunas: 3500000,
    stokPerluDicek: [
      { kode: "RP", nama: "Rawit Putih", kategori: "Cabe", stok: 0, minimum: 5, status: "HABIS" },
      { kode: "TI", nama: "Tomat Ijo", kategori: "Sayur", stok: 0, minimum: 5, status: "HABIS" },
      { kode: "JP", nama: "Jeruk Peras", kategori: "Buah", stok: 4, minimum: 5, status: "MENIPIS" }
    ]
  },
  masterBarang: [
    { kode: "CI", nama: "Cabe Ijo", satuan: "Kg" },
    { kode: "RP", nama: "Rawit Putih", satuan: "Kg" },
    { kode: "TI", nama: "Tomat Ijo", satuan: "Kg" },
    { kode: "JP", nama: "Jeruk Peras", satuan: "Kg" },
    { kode: "CK", nama: "Cabe Kriting", satuan: "Kg" }
  ],
  supplier: [
    { kode: "SUP001", nama: "Pasar Besar" },
    { kode: "SUP002", nama: "Supplier Pak Budi" },
    { kode: "SUP003", nama: "Agen Sayur Batu" }
  ],
  stok: [
    { kode: "CI", nama: "Cabe Ijo", stok: 12, satuan: "Kg", hpp: 8000, status: "AMAN" },
    { kode: "RP", nama: "Rawit Putih", stok: 0, satuan: "Kg", hpp: 12000, status: "HABIS" },
    { kode: "TI", nama: "Tomat Ijo", stok: 0, satuan: "Kg", hpp: 7000, status: "HABIS" },
    { kode: "JP", nama: "Jeruk Peras", stok: 4, satuan: "Kg", hpp: 7500, status: "MENIPIS" },
    { kode: "CK", nama: "Cabe Kriting", stok: 16, satuan: "Kg", hpp: 15000, status: "AMAN" }
  ],
  hutang: [
    { noNota: "NT-20260708-002", supplier: "Supplier Pak Budi", totalHutang: 3500000, totalBayar: 0, sisaHutang: 3500000, status: "BELUM LUNAS" }
  ],
  cashflow: {
    penjualan: 2747000,
    pemasukanCair: 1450000,
    tagihanBelumHC: 1297000,
    pengeluaran: 4750000,
    saldo: -3300000,
    labaMasuk: 1534000,
    labaDipindah: 500000,
    sisaLaba: 1034000,
    rows: [
      { id: "CF-1", tanggal: "01/07/2026", penjualan: 0, pemasukan: 0, pengeluaran: 44000, saldo: -44000, laba: 0, hc: false, lc: false },
      { id: "CF-2", tanggal: "02/07/2026", penjualan: 0, pemasukan: 0, pengeluaran: 235000, saldo: -279000, laba: 0, hc: false, lc: false },
      { id: "CF-3", tanggal: "05/07/2026", penjualan: 1200000, pemasukan: 1200000, pengeluaran: 0, saldo: 921000, laba: 700000, hc: true, lc: true },
      { id: "CF-4", tanggal: "07/07/2026", penjualan: 1547000, pemasukan: 250000, pengeluaran: 104000, saldo: 1067000, laba: 834000, hc: false, lc: false }
    ]
  }
};

async function callApi(action, payload = {}) {
  const apiUrl = window.CABE_CONFIG && window.CABE_CONFIG.API_URL ? window.CABE_CONFIG.API_URL.trim() : "";

  if (!apiUrl) {
    await new Promise(resolve => setTimeout(resolve, 140));
    return getDemoResponse(action, payload);
  }

  const authToken = sessionStorage.getItem("CABE_AUTH_TOKEN") || "";
  const requestPayload = { ...payload };
  if (authToken) requestPayload.authToken = authToken;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, payload: requestPayload, authToken })
  });

  let result;
  try {
    result = await response.json();
  } catch (err) {
    throw new Error("Response API bukan JSON. Cek deploy Apps Script.");
  }

  if (!result.ok && result.status !== "SUCCESS") {
    throw new Error(result.message || "Request gagal");
  }

  return result.data || result.result || result;
}

function getDemoResponse(action, payload) {
  const map = {
    GET_DASHBOARD: demoData.dashboard,
    GET_MASTER_BARANG: demoData.masterBarang,
    GET_SUPPLIER: demoData.supplier,
    GET_STOK_BARANG: demoData.stok,
    GET_HUTANG: demoData.hutang,
    GET_CASHFLOW: demoData.cashflow,
    ADD_BARANG_MASUK: { message: `${payload.items?.length || 0} barang masuk tersimpan.` },
    ADD_BARANG_TERJUAL: { message: `${payload.items?.length || 0} barang terjual tersimpan.` },
    ADD_BAYAR_HUTANG: { message: "pembayaran hutang tersimpan" },
    UPDATE_HC: { message: "Status pembayaran diperbarui" },
    UPDATE_LC: { message: "Status laba diperbarui" },
    GENERATE_NOTA_PENJUALAN: {
      message: "Nota berhasil dibuat",
      url: "#",
      waText: `*Nota tanggal ${payload.label || "01-10 Juli 2026"}*\nTotal Rp10.000.000`
    },
    VERIFY_PIN: payload.pin === "1234"
      ? { token: "DEMO-CABE-TOKEN", message: "PIN demo diterima" }
      : (() => { throw new Error("PIN salah. Untuk mode demo gunakan 1234."); })()
  };
  return map[action] || { message: "Demo berhasil" };
}

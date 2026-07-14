/******************************************************
 * CABE STOCK SYSTEM - SETUP OTOMATIS GOOGLE SHEETS
 * Versi: V21 - Kontrol Keuangan Lengkap
 * Spreadsheet ID: 1UXtV-nDSPf0rjO40b_S8KXtwtq8c1rOCZeW1j1oD01c
 *
 * Cara pakai:
 * 1) Buka Google Sheet tujuan
 * 2) Extensions > Apps Script
 * 3) Paste semua kode ini
 * 4) Run: setupCABE()
 * 5) Reload Google Sheet
 ******************************************************/

const CABE_SPREADSHEET_ID = '1UXtV-nDSPf0rjO40b_S8KXtwtq8c1rOCZeW1j1oD01c';
const CABE_TZ = 'Asia/Jakarta';
const CABE_APP_PIN = '1234'; // GANTI PIN DI SINI
const CABE_TOKEN_TTL_SECONDS = 21600; // 6 jam sesi login
const CABE_BOOTSTRAP_CACHE_SECONDS = 20; // cache ringkas agar load data awal lebih cepat
const CABE_BOOTSTRAP_CACHE_KEY = 'CABE_BOOTSTRAP_V21';
const CABE_WRITE_RESULT_CACHE_SECONDS = 21600; // 6 jam: cegah transaksi dobel saat koneksi lambat
const CABE_WRITE_RESULT_CACHE_PREFIX = 'CABE_WRITE_RESULT_';
const CABE_DRIVE_NOTA_PENJUALAN_FOLDER_ID = '1VHAvhRR0rydciTdKyxwyFVxQCNO7NOsh';
const CABE_START_ROW = 3;
const CABE_HEADER_ROW = 2;
const CABE_MAX_ROWS = 2000;
const CABE_TITLE_COLOR = '#9f2f3f';
const CABE_LIGHT_COLOR = '#f8e8ec';
const CABE_SOFT_BG = '#f7f7f7';

const CABE_SHEETS = {
  DASHBOARD: 'DASHBOARD',
  CASHFLOW: 'CASHFLOW BISNIS',
  MASTER_BARANG: 'MASTER BARANG',
  SUPPLIER: 'SUPPLIER',
  BARANG_MASUK: 'BARANG MASUK',
  BARANG_TERJUAL: 'BARANG TERJUAL',
  STOK_OPNAME: 'STOK OPNAME',
  STOK_BARANG: 'STOK BARANG',
  HPP: 'HPP',
  HUTANG: 'HUTANG',
  HUTANG_AWAL: 'HUTANG AWAL',
  BAYAR_HUTANG: 'BAYAR HUTANG',
  PENGELUARAN: 'PENGELUARAN',
  NOTA_PENJUALAN: 'NOTA PENJUALAN',
  AKSES_PERANGKAT: 'AKSES PERANGKAT',
  KOREKSI_TRANSAKSI: 'KOREKSI TRANSAKSI',
  MUTASI_MODAL: 'MUTASI MODAL',
  REKONSILIASI_BANK: 'REKONSILIASI BANK',
  TUTUP_PERIODE: 'TUTUP PERIODE',
  SETUP: 'SETUP'
};

const CABE_HEADERS = {
  'CASHFLOW BISNIS': [
    'Tanggal', 'Pemasukan', 'Pengeluaran', 'Saldo',
    'Laba Masuk', 'Laba Keluar', 'Laba Bersih', 'H.C', 'L.C'
  ],
  'MASTER BARANG': [
    'Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Stok Minimum',
    'Status', 'HPP Manual', 'Harga Jual Manual', 'Catatan', 'Created At', 'Updated At'
  ],
  'SUPPLIER': [
    'Kode Supplier', 'Nama Supplier', 'No HP', 'Alamat', 'Status', 'Catatan', 'Created At', 'Updated At'
  ],
  'BARANG MASUK': [
    'ID', 'Tanggal', 'Kode Barang', 'Nama Barang', 'Qty', 'Satuan', 'Harga/Kg',
    'Total Modal', 'Supplier', 'No Nota', 'Status Bayar', 'Jatuh Tempo', 'Keterangan', 'Created At', 'Updated At'
  ],
  'BARANG TERJUAL': [
    'ID', 'Tanggal', 'Kode Barang', 'Nama Barang', 'Qty', 'Satuan', 'HPP/Kg',
    'Laba/Kg', 'Harga Jual/Kg', 'Total HPP', 'Total Laba', 'Total Jual',
    'Markup', 'Margin', 'Keterangan', 'Created At', 'Updated At'
  ],
  'STOK OPNAME': [
    'ID', 'Tanggal', 'Kode Barang', 'Nama Barang', 'Stok Sistem', 'Stok Fisik',
    'Selisih', 'HPP/Kg', 'Nilai Selisih', 'Petugas', 'Keterangan', 'Created At', 'Updated At'
  ],
  'STOK BARANG': [
    'Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Stok Akhir', 'Stok Minimum',
    'Status Stok', 'HPP/Kg', 'Nilai Stok', 'Harga Jual Manual', 'Nilai Jika Terjual'
  ],
  'HPP': [
    'Kode Barang', 'Nama Barang', 'Satuan', 'Qty Masuk', 'Nilai Masuk', 'Qty Terjual',
    'Selisih Opname', 'Stok Akhir', 'HPP Rata-rata', 'HPP Bulat', 'Harga Beli Terakhir', 'Tanggal Update'
  ],
  'HUTANG': [
    'No Nota', 'Tanggal Nota', 'Supplier', 'Total Hutang', 'Total Bayar', 'Sisa Hutang',
    'Status Hutang', 'Jatuh Tempo', 'Keterangan'
  ],
  'HUTANG AWAL': [
    'No Nota', 'Tanggal Nota', 'Supplier', 'Sisa Hutang Awal', 'Jatuh Tempo', 'Keterangan', 'Created At', 'Updated At'
  ],
  'BAYAR HUTANG': [
    'ID', 'Tanggal Bayar', 'Supplier', 'No Nota', 'Jumlah Hutang', 'Jumlah Bayar',
    'Metode Bayar', 'Keterangan', 'Created At', 'Updated At'
  ],
  'PENGELUARAN': [
    'ID', 'Tanggal', 'Kategori', 'Jumlah', 'Metode Bayar', 'Keterangan', 'Created At', 'Updated At'
  ],
  'NOTA PENJUALAN': [
    'No Nota', 'Tanggal Awal', 'Tanggal Akhir', 'Total Nota', 'Status H.C',
    'Status L.C', 'File PDF', 'Pesan WA', 'Created At', 'Updated At'
  ],
  'AKSES PERANGKAT': [
    'ID Perangkat', 'Nama Pengguna', 'Nama Perangkat', 'ID Akses Aman',
    'Kunci Publik', 'Jumlah Pemakaian', 'Status', 'Tanggal Daftar',
    'Terakhir Login', 'Catatan'
  ],
  'KOREKSI TRANSAKSI': [
    'ID Koreksi', 'Waktu Koreksi', 'Jenis', 'Tanggal Transaksi', 'ID Transaksi',
    'Kode Barang', 'Nama Barang', 'Data Lama', 'Data Baru', 'Selisih Qty',
    'Alasan', 'Aksi'
  ],
  'MUTASI MODAL': [
    'ID', 'Tanggal', 'Jenis', 'Jumlah', 'Metode', 'Keterangan', 'Created At', 'Updated At'
  ],
  'REKONSILIASI BANK': [
    'ID', 'Tanggal', 'Saldo Sistem', 'Saldo Bank Aktual', 'Selisih', 'Keterangan', 'Created At', 'Updated At'
  ],
  'TUTUP PERIODE': [
    'ID', 'Periode', 'Tanggal Tutup', 'Saldo Sistem', 'Saldo Bank Aktual', 'Selisih',
    'Penjualan', 'HPP', 'Laba Kotor', 'Pengeluaran Usaha', 'Laba Bersih',
    'Pemasukan Kas', 'Uang Keluar', 'Nilai Stok Akhir', 'Piutang', 'Hutang',
    'Tambahan Modal', 'Pengambilan Pemilik', 'Catatan', 'Status', 'Created At'
  ],
  'SETUP': ['Kunci', 'Isi / Pilihan', 'Keterangan']
};

/***********************
 * MENU
 ***********************/
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('CABE Tools')
    .addItem('Setup / Repair Sheet', 'setupCABE')
    .addItem('Aktifkan Auto Trigger', 'installCABETriggers')
    .addItem('Repair Kode Barang, Supplier, Tanggal & Hutang', 'repairMissingCodesCABE')
    .addItem('Rapikan No Nota per Tanggal & Supplier', 'repairNoNotaPerTanggalSupplierCABE')
    .addItem('Refresh Cashflow Bisnis', 'refreshCashflowCABE')
    .addItem('Refresh Nota & Piutang', 'refreshPiutangCABE')
    .addItem('Generate Nota Penjualan PDF', 'menuGenerateNotaPenjualan')
    .addItem('Arsip & Mulai Periode Baru', 'menuArsipMulaiBaruCABE')
    .addItem('Tambah Barang', 'menuTambahBarang')
    .addItem('Tambah Supplier', 'menuTambahSupplier')
    .addItem('Siapkan Akses Perangkat', 'menuSetupAksesPerangkat')
    .addItem('Refresh Formula View', 'refreshFormulaCABE')
    .addSeparator()
    .addItem('Hard Reset Template Kosong', 'hardResetCABE')
    .addToUi();
}

/**
 * Installable trigger opsional.
 * Simple trigger onEdit biasanya cukup kalau script ditempel dari Extensions > Apps Script.
 * Menu ini disiapkan sebagai pengaman kalau auto kode tidak jalan di akun tertentu.
 */
function installCABETriggers() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'handleCABEEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('handleCABEEdit').forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getUi().alert('Auto trigger aktif. Kode barang, supplier, transaksi, dan nota akan terisi otomatis saat diedit.');
}

/***********************
 * SETUP UTAMA
 ***********************/
function setupCABE() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  ss.setSpreadsheetTimeZone(CABE_TZ);

  const order = [
    CABE_SHEETS.DASHBOARD,
    CABE_SHEETS.CASHFLOW,
    CABE_SHEETS.MASTER_BARANG,
    CABE_SHEETS.SUPPLIER,
    CABE_SHEETS.BARANG_MASUK,
    CABE_SHEETS.BARANG_TERJUAL,
    CABE_SHEETS.NOTA_PENJUALAN,
    CABE_SHEETS.STOK_OPNAME,
    CABE_SHEETS.STOK_BARANG,
    CABE_SHEETS.HPP,
    CABE_SHEETS.HUTANG_AWAL,
    CABE_SHEETS.HUTANG,
    CABE_SHEETS.BAYAR_HUTANG,
    CABE_SHEETS.PENGELUARAN,
    CABE_SHEETS.AKSES_PERANGKAT,
    CABE_SHEETS.KOREKSI_TRANSAKSI,
    CABE_SHEETS.MUTASI_MODAL,
    CABE_SHEETS.REKONSILIASI_BANK,
    CABE_SHEETS.TUTUP_PERIODE,
    CABE_SHEETS.SETUP
  ];

  order.forEach(name => prepareSheet_(ss, name, false));
  setupSheetOrder_(ss, order);
  setupSetupSheet_(ss);
  setupAksesPerangkatSheet_(ss);
  setupDataValidation_(ss);
  setupFormats_(ss);
  seedInitialMasterIfEmpty_(ss);
  repairMissingCodes_(ss);
  refreshFormulaCABE();
  buildDashboard_(ss);

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Setup CABE selesai. Sheet sudah dibuat, rumus aktif, dropdown aktif.');
}

/***********************
 * HARD RESET - HATI-HATI
 ***********************/
function hardResetCABE() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.alert(
    'Hard Reset Template Kosong',
    'Ini akan menghapus isi sheet sistem CABE lalu membuat ulang template kosong. Lanjutkan?',
    ui.ButtonSet.YES_NO
  );
  if (res !== ui.Button.YES) return;

  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  Object.keys(CABE_HEADERS).forEach(name => prepareSheet_(ss, name, true));
  prepareSheet_(ss, CABE_SHEETS.DASHBOARD, true);
  setupSetupSheet_(ss);
  setupAksesPerangkatSheet_(ss);
  setupDataValidation_(ss);
  setupFormats_(ss);
  seedInitialMasterIfEmpty_(ss);
  repairMissingCodes_(ss);
  refreshFormulaCABE();
  buildDashboard_(ss);

  SpreadsheetApp.getUi().alert('Hard reset selesai.');
}

/***********************
 * FORMULA VIEW
 ***********************/
function refreshFormulaCABE() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  setupHPPFormulas_(ss);
  setupStokBarangFormulas_(ss);
  setupHutangFormulas_(ss);
  buildCashflowBisnis_(ss);
  buildDashboard_(ss);
  SpreadsheetApp.flush();
}

function refreshCashflowCABE() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  buildCashflowBisnis_(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Cashflow Bisnis sudah diperbarui.');
}

function refreshPiutangCABE() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  buildCashflowBisnis_(ss);
  buildDashboard_(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Nota, H.C, L.C, dan dashboard sudah disinkronkan.');
}

function setupHPPFormulas_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.HPP);
  clearViewBody_(sh, CABE_HEADERS[CABE_SHEETS.HPP].length);

  sh.getRange('A3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!A3:A;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('B3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!B3:B;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('C3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!D3:D;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('D3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(SUMIF('${CABE_SHEETS.BARANG_MASUK}'!C:C;A3:A;'${CABE_SHEETS.BARANG_MASUK}'!E:E);0)))`);
  sh.getRange('E3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(SUMIF('${CABE_SHEETS.BARANG_MASUK}'!C:C;A3:A;'${CABE_SHEETS.BARANG_MASUK}'!H:H);0)))`);
  sh.getRange('F3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(SUMIF('${CABE_SHEETS.BARANG_TERJUAL}'!C:C;A3:A;'${CABE_SHEETS.BARANG_TERJUAL}'!E:E);0)))`);
  sh.getRange('G3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(SUMIF('${CABE_SHEETS.STOK_OPNAME}'!C:C;A3:A;'${CABE_SHEETS.STOK_OPNAME}'!G:G);0)))`);
  sh.getRange('H3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;D3:D-F3:F+G3:G))`);
  sh.getRange('I3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(E3:E/D3:D;0)))`);
  sh.getRange('J3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(IF(VLOOKUP(A3:A;'${CABE_SHEETS.MASTER_BARANG}'!A:G;7;FALSE)>0;VLOOKUP(A3:A;'${CABE_SHEETS.MASTER_BARANG}'!A:G;7;FALSE);ROUNDUP(I3:I;0));ROUNDUP(I3:I;0))))`);
  sh.getRange('K3').setFormula(`=MAP(A3:A;LAMBDA(k;IF(k="";;IFERROR(LOOKUP(2;1/('${CABE_SHEETS.BARANG_MASUK}'!C:C=k);'${CABE_SHEETS.BARANG_MASUK}'!G:G);0))))`);
  sh.getRange('L3').setFormula(`=MAP(A3:A;LAMBDA(k;IF(k="";;IFERROR(LOOKUP(2;1/('${CABE_SHEETS.BARANG_MASUK}'!C:C=k);'${CABE_SHEETS.BARANG_MASUK}'!B:B);""))))`);

  applyNumberFormatsHPP_(sh);
}

function setupStokBarangFormulas_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.STOK_BARANG);
  clearViewBody_(sh, CABE_HEADERS[CABE_SHEETS.STOK_BARANG].length);

  sh.getRange('A3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!A3:A;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('B3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!B3:B;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('C3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!C3:C;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('D3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!D3:D;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('E3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(VLOOKUP(A3:A;${CABE_SHEETS.HPP}!A:J;8;FALSE);0)))`);
  sh.getRange('F3').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.MASTER_BARANG}'!E3:E;'${CABE_SHEETS.MASTER_BARANG}'!B3:B<>"";'${CABE_SHEETS.MASTER_BARANG}'!F3:F="AKTIF");"")`);
  sh.getRange('G3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IF(E3:E<=0;"HABIS";IF(E3:E<=F3:F;"MENIPIS";"AMAN"))))`);
  sh.getRange('H3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(VLOOKUP(A3:A;${CABE_SHEETS.HPP}!A:J;10;FALSE);0)))`);
  sh.getRange('I3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;E3:E*H3:H))`);
  sh.getRange('J3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(VLOOKUP(A3:A;'${CABE_SHEETS.MASTER_BARANG}'!A:H;8;FALSE);0)))`);
  sh.getRange('K3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;E3:E*J3:J))`);

  applyNumberFormatsStok_(sh);
}

function setupHutangFormulas_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.HUTANG);
  clearViewBody_(sh, CABE_HEADERS[CABE_SHEETS.HUTANG].length);

  // Sumber hutang aktif:
  // 1) BARANG MASUK dengan Status Bayar = HUTANG
  // 2) HUTANG AWAL hasil arsip periode lama
  // Pembayaran tetap dari BAYAR HUTANG berdasarkan No Nota.
  sh.getRange('A3').setFormula(`=IFERROR(SORT(UNIQUE(FILTER(VSTACK(IFERROR(FILTER('${CABE_SHEETS.BARANG_MASUK}'!J3:J;'${CABE_SHEETS.BARANG_MASUK}'!K3:K="HUTANG";'${CABE_SHEETS.BARANG_MASUK}'!J3:J<>"");"");IFERROR(FILTER('${CABE_SHEETS.HUTANG_AWAL}'!A3:A;'${CABE_SHEETS.HUTANG_AWAL}'!A3:A<>"");""));VSTACK(IFERROR(FILTER('${CABE_SHEETS.BARANG_MASUK}'!J3:J;'${CABE_SHEETS.BARANG_MASUK}'!K3:K="HUTANG";'${CABE_SHEETS.BARANG_MASUK}'!J3:J<>"");"");IFERROR(FILTER('${CABE_SHEETS.HUTANG_AWAL}'!A3:A;'${CABE_SHEETS.HUTANG_AWAL}'!A3:A<>"");""))<>"")));"")`);
  sh.getRange('B3').setFormula(`=MAP(A3:A;LAMBDA(n;IF(n="";;IFERROR(TO_DATE(INT(MIN(FILTER('${CABE_SHEETS.BARANG_MASUK}'!B:B;'${CABE_SHEETS.BARANG_MASUK}'!J:J=n))));IFERROR(TO_DATE(INT(VLOOKUP(n;'${CABE_SHEETS.HUTANG_AWAL}'!A:E;2;FALSE)));"")))))`);
  sh.getRange('C3').setFormula(`=MAP(A3:A;LAMBDA(n;IF(n="";;IFERROR(INDEX(FILTER('${CABE_SHEETS.BARANG_MASUK}'!I:I;'${CABE_SHEETS.BARANG_MASUK}'!J:J=n;'${CABE_SHEETS.BARANG_MASUK}'!I:I<>"");1);IFERROR(VLOOKUP(n;'${CABE_SHEETS.HUTANG_AWAL}'!A:E;3;FALSE);"")))))`);
  sh.getRange('D3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(SUMIF('${CABE_SHEETS.BARANG_MASUK}'!J:J;A3:A;'${CABE_SHEETS.BARANG_MASUK}'!H:H);0)+IFERROR(VLOOKUP(A3:A;'${CABE_SHEETS.HUTANG_AWAL}'!A:D;4;FALSE);0)))`);
  sh.getRange('E3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IFERROR(SUMIF('${CABE_SHEETS.BAYAR_HUTANG}'!D:D;A3:A;'${CABE_SHEETS.BAYAR_HUTANG}'!F:F);0)))`);
  sh.getRange('F3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;D3:D-E3:E))`);
  sh.getRange('H3').setFormula(`=MAP(A3:A;LAMBDA(n;IF(n="";;IFERROR(TO_DATE(INT(INDEX(FILTER('${CABE_SHEETS.BARANG_MASUK}'!L:L;'${CABE_SHEETS.BARANG_MASUK}'!J:J=n;'${CABE_SHEETS.BARANG_MASUK}'!L:L<>"");1)));IFERROR(TO_DATE(INT(VLOOKUP(n;'${CABE_SHEETS.HUTANG_AWAL}'!A:E;5;FALSE)));"")))))`);
  sh.getRange('G3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;IF(F3:F<=0;"LUNAS";IF((H3:H<>"")*(H3:H<TODAY());"JATUH TEMPO";"BELUM LUNAS"))))`);
  sh.getRange('I3').setFormula(`=ARRAYFORMULA(IF(A3:A="";;"Auto dari BARANG MASUK, HUTANG AWAL, dan BAYAR HUTANG"))`);

  applyNumberFormatsHutang_(sh);
}

function buildCashflowBisnis_(ss) {
  ensureFinanceControlSheets_(ss);
  const sh = ss.getSheetByName(CABE_SHEETS.CASHFLOW) || ss.insertSheet(CABE_SHEETS.CASHFLOW);
  const savedCashflowFlags = readCashflowFlagsFromSheet_(sh);
  const savedYear = parseNumber_(sh.getRange('B3').getValue()) || new Date().getFullYear();
  const savedMonth = parseNumber_(sh.getRange('D3').getValue()) || (new Date().getMonth() + 1);
  const savedOpeningBalance = parseNumber_(sh.getRange('G3').getValue());
  sh.clear();
  sh.setTabColor('#174a91');

  const dark = '#174a91';
  const mid = '#2d64ad';
  const light = '#dbeafe';
  const white = '#ffffff';

  sh.getRange('A1:I1').merge().setValue('CASHFLOW BISNIS')
    .setBackground(dark).setFontColor(white).setFontWeight('bold')
    .setFontSize(16).setHorizontalAlignment('center');

  sh.getRange('A2:I2').merge().setValue('"Laporan Keuangan Harian dan Bulanan"')
    .setBackground(dark).setFontColor(white).setFontStyle('italic')
    .setFontSize(9).setHorizontalAlignment('center');

  sh.getRange('A3').setValue('Tahun');
  sh.getRange('B3').setValue(savedYear);
  sh.getRange('C3').setValue('Bulan');
  sh.getRange('D3').setValue(savedMonth);
  sh.getRange('E3:F3').merge().setValue('SALDO AWAL');
  sh.getRange('G3:I3').merge().setValue(savedOpeningBalance);
  sh.getRange('A3:I3').setBackground(dark).setFontColor(white).setFontWeight('bold')
    .setHorizontalAlignment('center');
  sh.getRange('G3:I3').setNumberFormat('"Rp"#,##0');

  sh.getRange('A4:I4').merge()
    .setFormula('=UPPER(TEXT(DATE($B$3;$D$3;1);"mmmm yyyy"))')
    .setBackground(mid).setFontColor(white).setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('A5:I5').setValues([[
    'Tanggal', 'Pemasukan', 'Pengeluaran', 'Saldo',
    'Laba Masuk', 'Laba Keluar', 'Laba Bersih', 'H.C', 'L.C'
  ]]);
  sh.getRange('A5:I5').setBackground(dark).setFontColor(white).setFontWeight('bold')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');

  // LOGIKA FINAL:
  // H.C = Hasil Cair. Kalau TRUE, nilai penjualan tanggal itu menjadi pemasukan kas.
  // L.C = Laba Cair. Kalau TRUE, laba tanggal itu dianggap sudah dipindah ke rekening/bank laba.
  // Sebelum H.C, barang tetap tercatat terjual, stok berkurang, tetapi uang belum dianggap masuk.
  const formulas = [];
  for (let r = 6; r <= 36; r++) {
    const dayRef = r - 5;
    formulas.push([
      `=IF(ROW(A${dayRef})>DAY(EOMONTH(DATE($B$3;$D$3;1);0));"";DATE($B$3;$D$3;ROW(A${dayRef})))`,
      `=IF($A${r}="";"";IF($H${r}=TRUE;SUMIFS('${CABE_SHEETS.BARANG_TERJUAL}'!$L:$L;'${CABE_SHEETS.BARANG_TERJUAL}'!$B:$B;$A${r});0)+SUMIFS('${CABE_SHEETS.MUTASI_MODAL}'!$D:$D;'${CABE_SHEETS.MUTASI_MODAL}'!$B:$B;$A${r};'${CABE_SHEETS.MUTASI_MODAL}'!$C:$C;"TAMBAHAN MODAL"))`,
      `=IF($A${r}="";"";SUMIFS('${CABE_SHEETS.BARANG_MASUK}'!$H:$H;'${CABE_SHEETS.BARANG_MASUK}'!$B:$B;$A${r};'${CABE_SHEETS.BARANG_MASUK}'!$K:$K;"TUNAI")+SUMIFS('${CABE_SHEETS.BAYAR_HUTANG}'!$F:$F;'${CABE_SHEETS.BAYAR_HUTANG}'!$B:$B;$A${r})+SUMIFS('${CABE_SHEETS.PENGELUARAN}'!$D:$D;'${CABE_SHEETS.PENGELUARAN}'!$B:$B;$A${r})+SUMIFS('${CABE_SHEETS.MUTASI_MODAL}'!$D:$D;'${CABE_SHEETS.MUTASI_MODAL}'!$B:$B;$A${r};'${CABE_SHEETS.MUTASI_MODAL}'!$C:$C;"PRIVE PEMILIK")+SUMIFS('${CABE_SHEETS.MUTASI_MODAL}'!$D:$D;'${CABE_SHEETS.MUTASI_MODAL}'!$B:$B;$A${r};'${CABE_SHEETS.MUTASI_MODAL}'!$C:$C;"PENGAMBILAN LABA"))`,
      `=IF($A${r}="";"";IF(ROW()=6;$G$3;D${r-1})+B${r}-C${r})`,
      `=IF($A${r}="";"";IF($H${r}=TRUE;SUMIFS('${CABE_SHEETS.BARANG_TERJUAL}'!$K:$K;'${CABE_SHEETS.BARANG_TERJUAL}'!$B:$B;$A${r});0))`,
      `=IF($A${r}="";"";IF($I${r}=TRUE;E${r};0))`,
      `=IF($A${r}="";"";E${r}-F${r})`,
      '',
      ''
    ]);
  }
  sh.getRange(6, 1, 31, 9).setFormulas(formulas);
  sh.getRange('H6:I36').insertCheckboxes();
  restoreCashflowFlagsToSheet_(sh, savedCashflowFlags);

  // Summary bulanan utama.
  sh.getRange('A38:I38').merge().setValue('CASHFLOW / BULAN')
    .setBackground(dark).setFontColor(white).setFontWeight('bold')
    .setHorizontalAlignment('center');

  sh.getRange('A39:B39').merge().setValue('Pemasukan Kas');
  sh.getRange('C39:D39').merge().setValue('Pengeluaran');
  sh.getRange('E39:F39').merge().setValue('Saldo Kas');
  sh.getRange('G39').setValue('Laba Masuk');
  sh.getRange('H39').setValue('Laba Dipindah');
  sh.getRange('I39').setValue('Sisa Laba');

  sh.getRange('A40:B40').merge().setFormula('=SUM(B6:B36)');
  sh.getRange('C40:D40').merge().setFormula('=SUM(C6:C36)');
  sh.getRange('E40:F40').merge().setFormula('=IFERROR(LOOKUP(2;1/(D6:D36<>"");D6:D36);$G$3)');
  sh.getRange('G40').setFormula('=SUM(E6:E36)');
  sh.getRange('H40').setFormula('=SUM(F6:F36)');
  sh.getRange('I40').setFormula('=SUM(G6:G36)');

  sh.getRange('A42:C42').merge().setValue('Total Tagihan Belum H.C');
  sh.getRange('D42:F42').merge().setValue('Total Modal Barang');
  sh.getRange('G42:I42').merge().setValue('Total Hutang Belanja');

  sh.getRange('A43:C43').merge().setFormula(`=IFERROR(SUM(FILTER(SUMIF('${CABE_SHEETS.BARANG_TERJUAL}'!$B:$B;$A$6:$A$36;'${CABE_SHEETS.BARANG_TERJUAL}'!$L:$L);$A$6:$A$36<>"";$H$6:$H$36<>TRUE));0)`);
  sh.getRange('D43:F43').merge().setFormula(`=SUM('${CABE_SHEETS.STOK_BARANG}'!I3:I)`);
  sh.getRange('G43:I43').merge().setFormula(`=SUMIF('${CABE_SHEETS.HUTANG}'!G:G;"<>LUNAS";'${CABE_SHEETS.HUTANG}'!F:F)`);

  sh.getRange('A45:C45').merge().setValue('Uang Modal Siap Belanja');
  sh.getRange('D45:F45').merge().setValue('Uang Laba Sudah Dipindah');
  sh.getRange('G45:I45').merge().setValue('Total Bersih Setelah Hutang');

  // Uang modal = pemasukan cair - laba masuk - pengeluaran operasional/belanja yang sudah keluar.
  sh.getRange('A46:C46').merge().setFormula('=A40-G40-C40');
  sh.getRange('D46:F46').merge().setFormula('=H40');
  sh.getRange('G46:I46').merge().setFormula('=E40-G43');

  sh.getRange('A48:I48').merge()
    .setFormula('="*Nota tanggal 01-"&TEXT(EOMONTH(DATE($B$3;$D$3;1);0);"dd mmmm yyyy")&" *"&CHAR(10)&"Total Rp "&TEXT(A43;"#,##0")')
    .setBackground(light).setFontColor(dark).setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sh.getRange('A39:I39').setBackground(mid).setFontColor(white).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange('A42:I42').setBackground(mid).setFontColor(white).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange('A45:I45').setBackground(dark).setFontColor(white).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange('A40:I40').setBackground(white).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange('A43:I43').setBackground(white).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange('A46:I46').setBackground(white).setFontWeight('bold').setHorizontalAlignment('center');

  sh.getRange('A6:I36').setBorder(true, true, true, true, true, true, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange('A38:I48').setBorder(true, true, true, true, true, true, '#93c5fd', SpreadsheetApp.BorderStyle.SOLID);

  sh.getRange('A6:A36').setNumberFormat('dd/mm/yyyy');
  sh.getRange('B6:G36').setNumberFormat('"Rp"#,##0');
  sh.getRange('A40:I46').setNumberFormat('"Rp"#,##0');
  sh.getRange('B3').setNumberFormat('0');
  sh.getRange('D3').setNumberFormat('0');

  sh.setFrozenRows(5);
  sh.setRowHeight(1, 28);
  sh.setRowHeight(2, 20);
  sh.setRowHeight(48, 42);
  sh.setColumnWidths(1, 1, 110);
  sh.setColumnWidths(2, 6, 120);
  sh.setColumnWidths(8, 2, 55);
  sh.getRange('A1:I48').setFontFamily('Arial').setFontSize(9);
  sh.getRange('A1:I2').setFontSize(10);
  sh.getRange('A1').setFontSize(16);
  sh.getRange('A5:I48').setVerticalAlignment('middle');
}


function buildDashboard_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.DASHBOARD) || ss.insertSheet(CABE_SHEETS.DASHBOARD);
  sh.clear();
  sh.setTabColor(CABE_TITLE_COLOR);

  sh.getRange('A1:H1').merge().setValue('DASHBOARD CABE')
    .setBackground(CABE_TITLE_COLOR).setFontColor('#ffffff').setFontWeight('bold')
    .setFontSize(20).setHorizontalAlignment('center');

  const kpis = [
    ['KPI', 'Nilai'],
    ['Total Nilai Stok', `=SUM('${CABE_SHEETS.STOK_BARANG}'!I3:I)`],
    ['Total Stok Barang', `=SUM('${CABE_SHEETS.STOK_BARANG}'!E3:E)`],
    ['Jumlah Jenis Barang', `=COUNTA('${CABE_SHEETS.STOK_BARANG}'!A3:A)`],
    ['Penjualan Bulan Ini', `=SUMIFS('${CABE_SHEETS.BARANG_TERJUAL}'!L:L;'${CABE_SHEETS.BARANG_TERJUAL}'!B:B;">="&DATE('${CABE_SHEETS.CASHFLOW}'!B3;'${CABE_SHEETS.CASHFLOW}'!D3;1);'${CABE_SHEETS.BARANG_TERJUAL}'!B:B;"<="&EOMONTH(DATE('${CABE_SHEETS.CASHFLOW}'!B3;'${CABE_SHEETS.CASHFLOW}'!D3;1);0))`],
    ['Pemasukan Cair', `=SUM('${CABE_SHEETS.CASHFLOW}'!B6:B36)`],
    ['Tagihan Belum H.C', `='${CABE_SHEETS.CASHFLOW}'!A43`],
    ['Uang Keluar', `=SUM('${CABE_SHEETS.CASHFLOW}'!C6:C36)`],
    ['Saldo Kas', `='${CABE_SHEETS.CASHFLOW}'!E40`],
    ['Laba Masuk', `=SUM('${CABE_SHEETS.CASHFLOW}'!E6:E36)`],
    ['Laba Sudah L.C', `=SUM('${CABE_SHEETS.CASHFLOW}'!F6:F36)`],
    ['Sisa Laba', `=SUM('${CABE_SHEETS.CASHFLOW}'!G6:G36)`],
    ['Hutang Supplier Belum Lunas', `=SUMIF('${CABE_SHEETS.HUTANG}'!G:G;"<>LUNAS";'${CABE_SHEETS.HUTANG}'!F:F)`]
  ];

  sh.getRange(3, 1, kpis.length, 2).setValues(kpis.map(function(r) { return [r[0], '']; }));
  for (let i = 1; i < kpis.length; i++) sh.getRange(3 + i, 2).setFormula(kpis[i][1]);

  sh.getRange('A3:B3').setBackground(CABE_TITLE_COLOR).setFontColor('#ffffff').setFontWeight('bold');
  sh.getRange('A4:A15').setFontWeight('bold');
  sh.getRange('B4:B4').setNumberFormat('"Rp"#,##0');
  sh.getRange('B5:B6').setNumberFormat('#,##0.00');
  sh.getRange('B7:B15').setNumberFormat('"Rp"#,##0');
  sh.getRange('A17:H17').merge().setValue('STOK PERLU DICEK')
    .setBackground(CABE_TITLE_COLOR).setFontColor('#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center');
  sh.getRange('A18').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.STOK_BARANG}'!A3:G;'${CABE_SHEETS.STOK_BARANG}'!G3:G<>"AMAN";'${CABE_SHEETS.STOK_BARANG}'!A3:A<>"");"Semua stok aman")`);

  sh.getRange('A30:H30').merge().setValue('HUTANG BELUM LUNAS')
    .setBackground(CABE_TITLE_COLOR).setFontColor('#ffffff').setFontWeight('bold')
    .setHorizontalAlignment('center');
  sh.getRange('A31').setFormula(`=IFERROR(FILTER('${CABE_SHEETS.HUTANG}'!A3:H;'${CABE_SHEETS.HUTANG}'!G3:G<>"LUNAS";'${CABE_SHEETS.HUTANG}'!A3:A<>"");"Tidak ada hutang terbuka")`);
  sh.getRange('B31:B70').setNumberFormat('dd/mm/yyyy');
  sh.getRange('D31:F70').setNumberFormat('"Rp"#,##0');
  sh.getRange('H31:H70').setNumberFormat('dd/mm/yyyy');
  sh.getRange('A18:H70').setFontSize(10);

  sh.setFrozenRows(1);
  sh.setColumnWidths(1, 8, 140);
  sh.getRange('A1:H70').setFontFamily('Arial');
}

/***********************
 * AUTO EDIT
 ***********************/
function onEdit(e) {
  handleCABEEdit(e);
}

function handleCABEEdit(e) {
  if (!e || !e.range) return;

  const ss = e.source;
  const sh = e.range.getSheet();
  const name = sh.getName();
  const startRow = e.range.getRow();
  const numRows = e.range.getNumRows();
  const col = e.range.getColumn();

  if (startRow + numRows - 1 < CABE_START_ROW) return;

  const firstRow = Math.max(startRow, CABE_START_ROW);
  const lastRow = startRow + numRows - 1;

  for (let row = firstRow; row <= lastRow; row++) {
    if (name === CABE_SHEETS.MASTER_BARANG) autoMasterBarang_(ss, sh, row);
    if (name === CABE_SHEETS.SUPPLIER) autoSupplier_(ss, sh, row);
    if (name === CABE_SHEETS.BARANG_MASUK) autoBarangMasuk_(ss, sh, row, col);
    if (name === CABE_SHEETS.BARANG_TERJUAL) autoBarangTerjual_(ss, sh, row, col);
    if (name === CABE_SHEETS.STOK_OPNAME) autoStokOpname_(ss, sh, row, col);
    if (name === CABE_SHEETS.BAYAR_HUTANG) autoBayarHutang_(ss, sh, row, col);
    if (name === CABE_SHEETS.PENGELUARAN) autoPengeluaran_(ss, sh, row);
  }
}

function autoMasterBarang_(ss, sh, row) {
  const nama = sh.getRange(row, 2).getValue();
  if (!nama) return;

  const namaClean = nama.toString().trim();
  if (namaClean !== nama) sh.getRange(row, 2).setValue(namaClean);

  if (!sh.getRange(row, 1).getValue()) {
    sh.getRange(row, 1).setValue(generateBarangCode_(ss, namaClean, row));
  }
  if (!sh.getRange(row, 4).getValue()) sh.getRange(row, 4).setValue('Kg');
  if (!sh.getRange(row, 5).getValue()) sh.getRange(row, 5).setValue(5);
  if (!sh.getRange(row, 6).getValue()) sh.getRange(row, 6).setValue('AKTIF');
  setTimestamps_(sh, row, 10, 11);
}

function autoSupplier_(ss, sh, row) {
  const nama = sh.getRange(row, 2).getValue();
  if (!nama) return;

  const namaClean = nama.toString().trim();
  if (namaClean !== nama) sh.getRange(row, 2).setValue(namaClean);

  if (!sh.getRange(row, 1).getValue()) sh.getRange(row, 1).setValue(generateSupplierCode_(ss, row));
  if (!sh.getRange(row, 5).getValue()) sh.getRange(row, 5).setValue('AKTIF');
  setTimestamps_(sh, row, 7, 8);
}

function autoBarangMasuk_(ss, sh, row, col) {
  // Jangan membuat tanggal/ID pada baris kosong. Ini yang mencegah tanggal muncul lagi saat dihapus.
  const hasInput = rowHasAnyData_(sh, row, [2, 3, 4, 5, 7, 9, 10, 11, 12, 13]);
  if (!hasInput) {
    clearTransactionAutoFields_(sh, row, [1, 2, 6, 8, 10, 11, 14, 15]);
    return;
  }

  const idCell = sh.getRange(row, 1);
  const isNew = !idCell.getValue();
  if (isNew) idCell.setValue(makeId_('BM'));

  // Tanggal hanya otomatis saat baris baru pertama kali dibuat.
  // Kalau tanggal dihapus manual, sistem tidak akan memaksa isi lagi.
  if (isNew && !sh.getRange(row, 2).getValue() && col !== 2) sh.getRange(row, 2).setValue(todayDate_());

  const codeCell = sh.getRange(row, 3);
  const nameCell = sh.getRange(row, 4);
  syncCodeName_(ss, codeCell, nameCell);

  const kode = codeCell.getValue();
  if (kode) {
    const satuan = lookupMaster_(ss, kode, 4);
    if (satuan && !sh.getRange(row, 6).getValue()) sh.getRange(row, 6).setValue(satuan);
  }

  sh.getRange(row, 8).setFormula(`=IF(OR(E${row}="";G${row}="");"";E${row}*G${row})`);

  const statusCell = sh.getRange(row, 11);
  if (!statusCell.getValue()) statusCell.setValue('TUNAI');
  const statusBayar = statusCell.getValue();

  // No Nota otomatis hanya untuk transaksi BARANG MASUK, bukan nota penjualan.
  // Prefix mengikuti status:
  // TUNAI/HUTANG = NT, STOK AWAL = SA, BONUS = BN, KOREKSI MASUK = KM.
  // Kalau nomor pernah diedit manual, tidak akan ditimpa. Kalau status diubah dan nomor masih otomatis, prefix ikut disesuaikan.
  const notaCell = sh.getRange(row, 10);
  const currentNota = notaCell.getValue();
  const supplierNota = sh.getRange(row, 9).getValue() || '';
  if (col !== 10 && (!currentNota || ((col === 2 || col === 9 || col === 11) && isAutoNotaNumber_(currentNota)))) {
    const tanggalNota = sh.getRange(row, 2).getValue() || todayDate_();
    notaCell.setValue(generateNotaNumber_(ss, tanggalNota, row, statusBayar, supplierNota));
  }

  setTimestamps_(sh, row, 14, 15);
}

function autoBarangTerjual_(ss, sh, row, col) {
  const hasInput = rowHasAnyData_(sh, row, [2, 3, 4, 5, 7, 8, 15]);
  if (!hasInput) {
    clearTransactionAutoFields_(sh, row, [1, 2, 6, 7, 9, 10, 11, 12, 13, 14, 16, 17]);
    return;
  }

  const idCell = sh.getRange(row, 1);
  const isNew = !idCell.getValue();
  if (isNew) idCell.setValue(makeId_('BT'));
  if (isNew && !sh.getRange(row, 2).getValue() && col !== 2) sh.getRange(row, 2).setValue(todayDate_());

  const codeCell = sh.getRange(row, 3);
  const nameCell = sh.getRange(row, 4);
  syncCodeName_(ss, codeCell, nameCell);

  const kode = codeCell.getValue();
  if (kode) {
    const satuan = lookupMaster_(ss, kode, 4);
    const hpp = lookupHPP_(ss, kode);
    if (satuan && !sh.getRange(row, 6).getValue()) sh.getRange(row, 6).setValue(satuan);
    if (hpp && !sh.getRange(row, 7).getValue()) sh.getRange(row, 7).setValue(hpp);
  }

  sh.getRange(row, 9).setFormula(`=IF(OR(G${row}="";H${row}="");"";G${row}+H${row})`);
  sh.getRange(row, 10).setFormula(`=IF(OR(E${row}="";G${row}="");"";E${row}*G${row})`);
  sh.getRange(row, 11).setFormula(`=IF(OR(E${row}="";H${row}="");"";E${row}*H${row})`);
  sh.getRange(row, 12).setFormula(`=IF(OR(E${row}="";I${row}="");"";E${row}*I${row})`);
  sh.getRange(row, 13).setFormula(`=IFERROR(H${row}/G${row};"")`);
  sh.getRange(row, 14).setFormula(`=IFERROR(H${row}/I${row};"")`);

  setTimestamps_(sh, row, 16, 17);
}

function autoStokOpname_(ss, sh, row, col) {
  const hasInput = rowHasAnyData_(sh, row, [2, 3, 4, 6, 10, 11]);
  if (!hasInput) {
    clearTransactionAutoFields_(sh, row, [1, 2, 5, 7, 8, 9, 12, 13]);
    return;
  }

  const idCell = sh.getRange(row, 1);
  const isNew = !idCell.getValue();
  if (isNew) idCell.setValue(makeId_('SO'));
  if (isNew && !sh.getRange(row, 2).getValue() && col !== 2) sh.getRange(row, 2).setValue(todayDate_());

  const codeCell = sh.getRange(row, 3);
  const nameCell = sh.getRange(row, 4);
  syncCodeName_(ss, codeCell, nameCell);

  const kode = codeCell.getValue();
  if (kode) {
    const stokCell = sh.getRange(row, 5);
    const hppCell = sh.getRange(row, 8);

    // Jangan menimpa snapshot dari Web/PWA. Saat kode/nama diedit manual di sheet,
    // stok dan HPP tetap disegarkan mengikuti barang yang baru dipilih.
    const barangDigantiManual = col === 3 || col === 4;
    if (stokCell.getValue() === '' || barangDigantiManual) stokCell.setValue(lookupStok_(ss, kode));
    if (hppCell.getValue() === '' || barangDigantiManual) hppCell.setValue(lookupHPP_(ss, kode));
  }

  sh.getRange(row, 7).setFormula(`=IF(OR(E${row}="";F${row}="");"";F${row}-E${row})`);
  sh.getRange(row, 9).setFormula(`=IF(OR(G${row}="";H${row}="");"";G${row}*H${row})`);
  setTimestamps_(sh, row, 12, 13);
}

function autoBayarHutang_(ss, sh, row, col) {
  // Struktur baru BAYAR HUTANG:
  // A ID | B Tanggal Bayar | C Supplier | D No Nota | E Jumlah Hutang | F Jumlah Bayar | G Metode Bayar | H Ket | I Created | J Updated
  const hasInput = rowHasAnyData_(sh, row, [2, 3, 4, 6, 7, 8]);
  if (!hasInput) {
    clearTransactionAutoFields_(sh, row, [1, 2, 4, 5, 7, 9, 10]);
    return;
  }

  const idCell = sh.getRange(row, 1);
  const isNew = !idCell.getValue();
  if (isNew) idCell.setValue(makeId_('BH'));
  if (isNew && !sh.getRange(row, 2).getValue() && col !== 2) sh.getRange(row, 2).setValue(todayDate_());

  const supplierCell = sh.getRange(row, 3);
  const notaCell = sh.getRange(row, 4);
  const jumlahHutangCell = sh.getRange(row, 5);

  const supplier = supplierCell.getValue();
  const noNota = notaCell.getValue();

  // Kalau user pilih supplier, No Nota otomatis ambil hutang paling lama yang belum lunas.
  if (supplier && !noNota) {
    const hutang = findOpenDebtBySupplier_(ss, supplier);
    if (hutang.noNota) {
      notaCell.setValue(hutang.noNota);
      jumlahHutangCell.setValue(hutang.sisaHutang);
    }
  }

  // Kalau user isi No Nota manual, supplier dan jumlah hutang ikut dilengkapi.
  const finalNota = notaCell.getValue();
  if (finalNota) {
    const debt = lookupDebtByNota_(ss, finalNota);
    if (debt.supplier && !supplierCell.getValue()) supplierCell.setValue(debt.supplier);
    if (debt.sisaHutang !== '') jumlahHutangCell.setValue(debt.sisaHutang);
  }

  if (!sh.getRange(row, 7).getValue()) sh.getRange(row, 7).setValue('TRANSFER');
  setTimestamps_(sh, row, 9, 10);
}

function autoPengeluaran_(ss, sh, row, col) {
  const hasInput = rowHasAnyData_(sh, row, [2, 3, 4, 5, 6]);
  if (!hasInput) {
    clearTransactionAutoFields_(sh, row, [1, 2, 5, 7, 8]);
    return;
  }

  const idCell = sh.getRange(row, 1);
  const isNew = !idCell.getValue();
  if (isNew) idCell.setValue(makeId_('PG'));
  if (isNew && !sh.getRange(row, 2).getValue() && col !== 2) sh.getRange(row, 2).setValue(todayDate_());
  if (!sh.getRange(row, 5).getValue()) sh.getRange(row, 5).setValue('CASH');
  setTimestamps_(sh, row, 7, 8);
}



/***********************
 * ARSIP & MULAI PERIODE BARU
 ***********************/
function menuArsipMulaiBaruCABE() {
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    'Arsip & Mulai Periode Baru',
    'Sistem akan membuat COPY ARSIP file ini, lalu mengosongkan transaksi harian. Stok akhir akan dimasukkan kembali sebagai STOK AWAL. Hutang terbuka akan dibawa ke HUTANG AWAL. Lanjutkan?',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  const datePrompt = ui.prompt(
    'Tanggal Mulai Baru',
    'Masukkan tanggal saldo awal periode baru. Kosongkan untuk hari ini. Format: dd/mm/yyyy',
    ui.ButtonSet.OK_CANCEL
  );
  if (datePrompt.getSelectedButton() !== ui.Button.OK) return;

  try {
    const result = arsipMulaiBaruCABE(datePrompt.getResponseText());
    ui.alert(
      'Arsip selesai.\n\n' +
      'File arsip: ' + result.archiveUrl + '\n' +
      'Stok awal dibawa: ' + result.stockRows + ' barang\n' +
      'Hutang awal dibawa: ' + result.debtRows + ' nota\n\n' +
      'Sekarang sheet siap dipakai dari awal lagi.'
    );
  } catch (err) {
    ui.alert('Gagal arsip:\n' + err.message);
  }
}

function arsipMulaiBaruCABE(startDateText) {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  const startDate = parseDateInput_(startDateText) || todayDate_();
  startDate.setHours(0, 0, 0, 0);

  // Pastikan semua formula view sudah paling baru sebelum snapshot.
  refreshFormulaCABE();
  SpreadsheetApp.flush();

  const stockSnapshot = takeStockSnapshot_(ss);
  const debtSnapshot = takeDebtSnapshot_(ss);

  // Safety first: buat copy arsip dulu. Kalau gagal, transaksi tidak akan dihapus.
  const archive = copySpreadsheetToArchive_(ss);

  clearTransactionSheetsForNewPeriod_(ss);
  insertStockAwalRows_(ss, stockSnapshot, startDate);
  insertHutangAwalRows_(ss, debtSnapshot);

  setupDataValidation_(ss);
  setupFormats_(ss);
  refreshFormulaCABE();
  SpreadsheetApp.flush();

  return {
    status: 'SUCCESS',
    archiveId: archive.id,
    archiveUrl: archive.url,
    stockRows: stockSnapshot.length,
    debtRows: debtSnapshot.length
  };
}

function takeStockSnapshot_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.STOK_BARANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const data = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 11).getValues();
  return data
    .filter(r => r[0] && r[1] && parseNumber_(r[4]) !== 0)
    .map(r => ({
      kode: r[0],
      nama: r[1],
      satuan: r[3] || 'Kg',
      stokAkhir: parseNumber_(r[4]),
      hpp: parseNumber_(r[7]),
      keterangan: 'Stok awal otomatis dari arsip periode sebelumnya'
    }));
}

function takeDebtSnapshot_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.HUTANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const data = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 8).getValues();
  return data
    .filter(r => r[0] && normalize_(r[6]) !== 'lunas' && parseNumber_(r[5]) > 0)
    .map(r => ({
      noNota: r[0],
      tanggalNota: r[1] instanceof Date ? r[1] : '',
      supplier: r[2] || '',
      sisaHutang: parseNumber_(r[5]),
      jatuhTempo: r[7] instanceof Date ? r[7] : '',
      keterangan: 'Hutang awal otomatis dari arsip periode sebelumnya'
    }));
}

function clearTransactionSheetsForNewPeriod_(ss) {
  [
    CABE_SHEETS.BARANG_MASUK,
    CABE_SHEETS.BARANG_TERJUAL,
    CABE_SHEETS.NOTA_PENJUALAN,
    CABE_SHEETS.STOK_OPNAME,
    CABE_SHEETS.BAYAR_HUTANG,
    CABE_SHEETS.PENGELUARAN,
    CABE_SHEETS.HUTANG_AWAL
  ].forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const headers = CABE_HEADERS[name];
    if (!headers) return;
    const rows = Math.max(sh.getMaxRows() - CABE_START_ROW + 1, 1);
    sh.getRange(CABE_START_ROW, 1, rows, headers.length).clearContent();
  });
}

function insertStockAwalRows_(ss, snapshot, startDate) {
  if (!snapshot || snapshot.length === 0) return;
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  const now = new Date();
  const rows = snapshot.map((item, idx) => {
    const hpp = parseNumber_(item.hpp);
    const qty = parseNumber_(item.stokAkhir);
    return [
      makeId_('BM'),
      new Date(startDate),
      item.kode,
      item.nama,
      qty,
      item.satuan || 'Kg',
      hpp,
      qty * hpp,
      '',
      'SA-' + Utilities.formatDate(startDate, CABE_TZ, 'yyyyMMdd') + '-' + String(idx + 1).padStart(3, '0'),
      'STOK AWAL',
      '',
      item.keterangan || 'Stok awal otomatis dari arsip',
      now,
      now
    ];
  });
  sh.getRange(CABE_START_ROW, 1, rows.length, CABE_HEADERS[CABE_SHEETS.BARANG_MASUK].length).setValues(rows);
}

function insertHutangAwalRows_(ss, snapshot) {
  if (!snapshot || snapshot.length === 0) return;
  const sh = ss.getSheetByName(CABE_SHEETS.HUTANG_AWAL);
  const now = new Date();
  const rows = snapshot.map(item => [
    item.noNota,
    item.tanggalNota || '',
    item.supplier || '',
    item.sisaHutang,
    item.jatuhTempo || '',
    item.keterangan || 'Hutang awal otomatis dari arsip',
    now,
    now
  ]);
  sh.getRange(CABE_START_ROW, 1, rows.length, CABE_HEADERS[CABE_SHEETS.HUTANG_AWAL].length).setValues(rows);
}

function copySpreadsheetToArchive_(ss) {
  const stamp = Utilities.formatDate(new Date(), CABE_TZ, 'yyyyMMdd-HHmmss');
  const archiveName = 'ARSIP CABE - ' + stamp;
  const archiveSS = ss.copy(archiveName);

  try {
    const originalFile = DriveApp.getFileById(ss.getId());
    const archiveFile = DriveApp.getFileById(archiveSS.getId());
    const parent = getFirstParentFolder_(originalFile);
    if (parent) archiveFile.moveTo(parent);
  } catch (err) {
    // Copy tetap berhasil meski gagal dipindah folder. File akan ada di My Drive.
  }

  return {
    id: archiveSS.getId(),
    url: archiveSS.getUrl()
  };
}

function getFirstParentFolder_(file) {
  const parents = file.getParents();
  return parents.hasNext() ? parents.next() : null;
}

/***********************
 * NOTA PENJUALAN PDF
 * Sumber: BARANG TERJUAL
 * Drive tujuan: CABE_DRIVE_NOTA_PENJUALAN_FOLDER_ID
 ***********************/
function menuGenerateNotaPenjualan() {
  const ui = SpreadsheetApp.getUi();
  const startPrompt = ui.prompt(
    'Generate Nota Penjualan',
    'Tanggal awal. Format boleh dd/mm/yyyy, dd-mm-yyyy, atau yyyy-mm-dd:',
    ui.ButtonSet.OK_CANCEL
  );
  if (startPrompt.getSelectedButton() !== ui.Button.OK) return;

  const endPrompt = ui.prompt(
    'Generate Nota Penjualan',
    'Tanggal akhir. Kosongkan jika hanya 1 hari:',
    ui.ButtonSet.OK_CANCEL
  );
  if (endPrompt.getSelectedButton() !== ui.Button.OK) return;

  try {
    const result = generateNotaPenjualanCABE(
      startPrompt.getResponseText(),
      endPrompt.getResponseText() || startPrompt.getResponseText()
    );
    ui.alert('Nota Penjualan berhasil dibuat:\n' + result.url + '\n\nTeks WhatsApp siap copy:\n' + result.pesanWA);
  } catch (err) {
    ui.alert('Gagal membuat nota penjualan:\n' + err.message);
  }
}

function generateNotaPenjualanCABE(start, end) {
  const startDate = parseDateInput_(start);
  const endDate = parseDateInput_(end || start);
  if (!startDate || !endDate) throw new Error('Tanggal tidak valid. Gunakan format dd/mm/yyyy atau yyyy-mm-dd.');

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  if (!sh) throw new Error('Sheet BARANG TERJUAL tidak ditemukan.');

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) throw new Error('Belum ada data BARANG TERJUAL.');

  const data = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, CABE_HEADERS[CABE_SHEETS.BARANG_TERJUAL].length).getValues();
  const rows = [];

  data.forEach(r => {
    const tanggal = r[1];
    if (!(tanggal instanceof Date)) return;
    const t = new Date(tanggal);
    t.setHours(12, 0, 0, 0);
    if (t < startDate || t > endDate) return;

    const nama = r[3];
    const qty = parseNumber_(r[4]);
    const satuan = r[5] || '';
    const hargaJual = parseNumber_(r[8]);
    const totalJual = parseNumber_(r[11]);
    if (!nama || qty <= 0) return;

    rows.push({
      tanggal: tanggal,
      nama: nama,
      qty: qty,
      satuan: satuan,
      hargaJual: hargaJual,
      totalJual: totalJual || qty * hargaJual
    });
  });

  if (rows.length === 0) throw new Error('Tidak ada data penjualan pada rentang tanggal tersebut.');

  rows.sort((a, b) => a.tanggal - b.tanggal || a.nama.toString().localeCompare(b.nama.toString()));

  const startStr = Utilities.formatDate(startDate, CABE_TZ, 'dd/MM/yyyy');
  const endStr = Utilities.formatDate(endDate, CABE_TZ, 'dd/MM/yyyy');
  const kodeNota = 'NPJ-' + Utilities.formatDate(new Date(), CABE_TZ, 'yyyyMMdd-HHmmss');
  const total = rows.reduce((sum, item) => sum + item.totalJual, 0);
  const invoiceGroups = groupNotaRowsByDate_(rows);

  let html = `
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 0;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 14px;
        }
        .invoice-section {
          margin: 0 0 44px 0;
          page-break-inside: avoid;
        }
        .invoice-title {
          margin: 0 0 16px 0;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 700;
        }
        .tanggal {
          margin: 0 0 14px 0;
          font-size: 14px;
          line-height: 1.2;
        }
        .tanggal b { font-weight: 700; }
        table.items {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        table.items th,
        table.items td {
          border: 2px solid #4a4a4a;
          padding: 5px 6px;
          vertical-align: middle;
          line-height: 1.15;
        }
        table.items th {
          text-align: center;
          font-weight: 700;
        }
        table.items td {
          text-align: left;
          font-weight: 400;
        }
        .col-name { width: 33%; }
        .col-qty { width: 12%; }
        .col-price { width: 26%; }
        .col-total { width: 29%; }
        .total-row td {
          font-weight: 700;
        }
      </style>
    </head>
    <body>
  `;

  invoiceGroups.forEach(group => {
    html += `
      <section class="invoice-section">
        <h1 class="invoice-title">INVOICE</h1>
        <p class="tanggal"><b>Tanggal:</b> ${escapeHtml_(formatNotaDateEnglish_(group.date))}</p>
        <table class="items">
          <thead>
            <tr>
              <th class="col-name">Nama</th>
              <th class="col-qty">Qty</th>
              <th class="col-price">Harga</th>
              <th class="col-total">Total</th>
            </tr>
          </thead>
          <tbody>
    `;

    group.rows.forEach(item => {
      html += `
            <tr>
              <td>${escapeHtml_(item.nama)}</td>
              <td>${escapeHtml_(formatQty_(item.qty))}</td>
              <td>${escapeHtml_(formatRupiahNota_(item.hargaJual))}</td>
              <td>${escapeHtml_(formatRupiahNota_(item.totalJual))}</td>
            </tr>
      `;
    });

    html += `
            <tr class="total-row">
              <td colspan="3">TOTAL</td>
              <td>${escapeHtml_(formatRupiahNota_(group.total))}</td>
            </tr>
          </tbody>
        </table>
      </section>
    `;
  });

  html += `
    </body>
    </html>
  `;

  const folder = DriveApp.getFolderById(CABE_DRIVE_NOTA_PENJUALAN_FOLDER_ID);
  const monthName = Utilities.formatDate(startDate, CABE_TZ, 'MMMM yyyy');
  const subFolder = getOrCreateFolder_(folder, 'NOTA PENJUALAN - ' + monthName);
  const fileName = `${kodeNota} - ${startStr.replace(/\//g, '-')}_to_${endStr.replace(/\//g, '-')}.pdf`;
  const blob = Utilities.newBlob(html, 'text/html', fileName).getAs('application/pdf').setName(fileName);
  const file = subFolder.createFile(blob);
  const pesanWA = buildNotaWhatsAppMessage_(startDate, endDate, total);
  appendNotaPenjualanLog_(ss, {
    noNota: kodeNota,
    startDate: startDate,
    endDate: endDate,
    total: total,
    fileUrl: file.getUrl(),
    pesanWA: pesanWA
  });

  return {
    status: 'SUCCESS',
    fileId: file.getId(),
    name: file.getName(),
    url: file.getUrl(),
    pesanWA: pesanWA,
    total: total
  };
}

/***********************
 * MENU PROMPT
 ***********************/
function menuTambahBarang() {
  const ui = SpreadsheetApp.getUi();
  const nama = ui.prompt('Tambah Barang', 'Nama barang:', ui.ButtonSet.OK_CANCEL);
  if (nama.getSelectedButton() !== ui.Button.OK || !nama.getResponseText()) return;

  const kategori = ui.prompt('Tambah Barang', 'Kategori:', ui.ButtonSet.OK_CANCEL);
  if (kategori.getSelectedButton() !== ui.Button.OK) return;

  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  tambahBarangCABE(nama.getResponseText(), kategori.getResponseText(), 'Kg', 5, '', '', '');
  ss.toast('Barang ditambahkan: ' + nama.getResponseText());
}

function menuTambahSupplier() {
  const ui = SpreadsheetApp.getUi();
  const nama = ui.prompt('Tambah Supplier', 'Nama supplier:', ui.ButtonSet.OK_CANCEL);
  if (nama.getSelectedButton() !== ui.Button.OK || !nama.getResponseText()) return;

  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  tambahSupplierCABE(nama.getResponseText(), '', '', '');
  ss.toast('Supplier ditambahkan: ' + nama.getResponseText());
}

function tambahBarangCABE(nama, kategori, satuan, stokMin, hppManual, hargaJualManual, catatan) {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  const sh = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const row = getNextEmptyRow_(sh, CABE_START_ROW, 2);
  const kode = generateBarangCode_(ss, nama, row);
  const now = new Date();

  sh.getRange(row, 1, 1, 11).setValues([[
    kode, nama, kategori || '', satuan || 'Kg', stokMin || 5,
    'AKTIF', hppManual || '', hargaJualManual || '', catatan || '', now, now
  ]]);
  return kode;
}

function tambahSupplierCABE(nama, hp, alamat, catatan) {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  const sh = ss.getSheetByName(CABE_SHEETS.SUPPLIER);
  const row = getNextEmptyRow_(sh, CABE_START_ROW, 2);
  const kode = generateSupplierCode_(ss);
  const now = new Date();

  sh.getRange(row, 1, 1, 8).setValues([[
    kode, nama, hp || '', alamat || '', 'AKTIF', catatan || '', now, now
  ]]);
  return kode;
}

/***********************
 * PREPARE SHEETS
 ***********************/
function prepareSheet_(ss, name, clearAll) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (clearAll) sh.clear();

  const headers = CABE_HEADERS[name];
  if (!headers) return sh;

  const lastCol = headers.length;
  sh.setTabColor(name === CABE_SHEETS.DASHBOARD ? CABE_TITLE_COLOR : (name === CABE_SHEETS.CASHFLOW ? '#174a91' : null));

  if (clearAll || sh.getRange(1, 1).getValue() === '') {
    sh.getRange(1, 1, 1, lastCol).merge();
    sh.getRange(1, 1).setValue(name)
      .setBackground(CABE_TITLE_COLOR)
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(18)
      .setHorizontalAlignment('center');
  }

  sh.getRange(CABE_HEADER_ROW, 1, 1, lastCol).setValues([headers]);
  sh.getRange(CABE_HEADER_ROW, 1, 1, lastCol)
    .setBackground(CABE_TITLE_COLOR)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sh.setFrozenRows(2);
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 50), lastCol).setFontFamily('Arial');
  sh.setRowHeight(1, 34);
  sh.setRowHeight(2, 42);
  setColumnWidths_(sh, name);
  safeCreateFilter_(sh, lastCol);
  return sh;
}

function setupSheetOrder_(ss, order) {
  order.forEach((name, index) => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    ss.setActiveSheet(sh);
    ss.moveActiveSheet(index + 1);
  });
}

function setupSetupSheet_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.SETUP);
  sh.getRange(CABE_START_ROW, 1, Math.max(sh.getMaxRows() - CABE_START_ROW + 1, 1), 3).clearContent();
  const data = [
    ['Kategori Barang', 'Cabe', 'Pilihan contoh. Boleh ditambah manual.'],
    ['', 'Sayur', ''],
    ['', 'Buah', ''],
    ['', 'Bumbu', ''],
    ['', 'Lain-lain', ''],
    ['Satuan', 'Kg', 'Pilihan satuan.'],
    ['', 'Gram', ''],
    ['', 'Pcs', ''],
    ['', 'Pack', ''],
    ['Status', 'AKTIF', 'Jangan hapus pilihan ini.'],
    ['', 'NONAKTIF', ''],
    ['Status Bayar', 'TUNAI', 'Pembelian cash: masuk stok dan masuk pengeluaran cashflow.'],
    ['', 'HUTANG', 'Pembelian hutang: masuk stok dan masuk hutang, belum masuk pengeluaran cashflow.'],
    ['', 'STOK AWAL', 'Saldo awal stok saat mulai periode/sistem. Tidak masuk hutang/cashflow.'],
    ['', 'BONUS', 'Barang gratis/bonus. Masuk stok, tidak masuk hutang/cashflow.'],
    ['', 'KOREKSI MASUK', 'Koreksi tambahan stok. Masuk stok, tidak masuk hutang/cashflow.'],
    ['Metode Bayar', 'CASH', 'Untuk pembayaran dan pengeluaran.'],
    ['', 'TRANSFER', ''],
    ['', 'QRIS', ''],
    ['Kategori Pengeluaran', 'Admin', 'Boleh ditambah.'],
    ['', 'Transport', ''],
    ['', 'Operasional', ''],
    ['', 'Lain-lain', ''],
    ['MODAL_STOK_MINIMUM', 0, 'Cadangan minimum untuk belanja stok sebelum laba dipindahkan.'],
    ['BATAS_PIUTANG_HARI', 7, 'Batas hari nota belum H.C sebelum muncul peringatan.']
  ];
  sh.getRange(CABE_START_ROW, 1, data.length, 3).setValues(data);
  sh.getRange('A:A').setFontWeight('bold');
}


function menuSetupAksesPerangkat() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  prepareSheet_(ss, CABE_SHEETS.AKSES_PERANGKAT, false);
  setupAksesPerangkatSheet_(ss);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('Sheet AKSES PERANGKAT sudah siap untuk Face ID / Sidik Jari.');
}

function setupAksesPerangkatSheet_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.AKSES_PERANGKAT) || prepareSheet_(ss, CABE_SHEETS.AKSES_PERANGKAT, false);
  sh.setTabColor('#1d4ed8');

  const headerCount = CABE_HEADERS[CABE_SHEETS.AKSES_PERANGKAT].length;
  sh.getRange(1, 1, 1, headerCount).setBackground('#1d4ed8');
  sh.getRange(CABE_HEADER_ROW, 1, 1, headerCount).setBackground('#1d4ed8');

  // Status perangkat dibuat sederhana agar mudah dikelola dari Sheet.
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['AKTIF', 'NONAKTIF'], true)
    .setAllowInvalid(false)
    .build();
  sh.getRange(CABE_START_ROW, 7, CABE_MAX_ROWS, 1).setDataValidation(statusRule);

  sh.getRange(CABE_START_ROW, 6, CABE_MAX_ROWS, 1).setNumberFormat('0');
  sh.getRange(CABE_START_ROW, 8, CABE_MAX_ROWS, 2).setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange(CABE_START_ROW, 1, CABE_MAX_ROWS, headerCount).setVerticalAlignment('middle').setWrap(true);
}

function setupDataValidation_(ss) {
  const master = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const supplier = ss.getSheetByName(CABE_SHEETS.SUPPLIER);
  const hutang = ss.getSheetByName(CABE_SHEETS.HUTANG);
  const setup = ss.getSheetByName(CABE_SHEETS.SETUP);

  const itemNameRange = master.getRange(3, 2, CABE_MAX_ROWS, 1);
  const itemCodeRange = master.getRange(3, 1, CABE_MAX_ROWS, 1);
  const supplierNameRange = supplier.getRange(3, 2, CABE_MAX_ROWS, 1);
  const noNotaHutangRange = hutang.getRange(3, 1, CABE_MAX_ROWS, 1);

  const kategoriRange = setup.getRange('B3:B7');
  const satuanRange = setup.getRange('B8:B11');
  const statusRange = setup.getRange('B12:B13');
  const statusBayarRange = setup.getRange('B14:B18');
  const metodeBayarRange = setup.getRange('B19:B21');
  const kategoriPengeluaranRange = setup.getRange('B22:B25');

  setValidationRange_(master.getRange(3, 3, CABE_MAX_ROWS, 1), kategoriRange, true);
  setValidationRange_(master.getRange(3, 4, CABE_MAX_ROWS, 1), satuanRange, true);
  setValidationRange_(master.getRange(3, 6, CABE_MAX_ROWS, 1), statusRange, true);
  setValidationRange_(supplier.getRange(3, 5, CABE_MAX_ROWS, 1), statusRange, true);

  const masuk = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  setValidationRange_(masuk.getRange(3, 3, CABE_MAX_ROWS, 1), itemCodeRange, true);
  setValidationRange_(masuk.getRange(3, 4, CABE_MAX_ROWS, 1), itemNameRange, true);
  setValidationRange_(masuk.getRange(3, 9, CABE_MAX_ROWS, 1), supplierNameRange, true);
  setValidationRange_(masuk.getRange(3, 11, CABE_MAX_ROWS, 1), statusBayarRange, true);

  const terjual = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  setValidationRange_(terjual.getRange(3, 3, CABE_MAX_ROWS, 1), itemCodeRange, true);
  setValidationRange_(terjual.getRange(3, 4, CABE_MAX_ROWS, 1), itemNameRange, true);

  const opname = ss.getSheetByName(CABE_SHEETS.STOK_OPNAME);
  setValidationRange_(opname.getRange(3, 3, CABE_MAX_ROWS, 1), itemCodeRange, true);
  setValidationRange_(opname.getRange(3, 4, CABE_MAX_ROWS, 1), itemNameRange, true);

  const bayar = ss.getSheetByName(CABE_SHEETS.BAYAR_HUTANG);
  // Di BAYAR HUTANG, No Nota adalah kunci pembayaran. Supplier dan jumlah hutang ikut dilengkapi.
  setValidationRange_(bayar.getRange(3, 3, CABE_MAX_ROWS, 1), supplierNameRange, true);
  setValidationRange_(bayar.getRange(3, 4, CABE_MAX_ROWS, 1), noNotaHutangRange, true);
  setValidationRange_(bayar.getRange(3, 7, CABE_MAX_ROWS, 1), metodeBayarRange, true);

  const pengeluaran = ss.getSheetByName(CABE_SHEETS.PENGELUARAN);
  setValidationRange_(pengeluaran.getRange(3, 3, CABE_MAX_ROWS, 1), kategoriPengeluaranRange, true);
  setValidationRange_(pengeluaran.getRange(3, 5, CABE_MAX_ROWS, 1), metodeBayarRange, true);
}

function setupFormats_(ss) {
  const moneyFormat = '"Rp"#,##0';
  const qtyFormat = '#,##0.##';
  const dateFormat = 'dd/mm/yyyy';
  const datetimeFormat = 'dd/mm/yyyy hh:mm';

  Object.keys(CABE_HEADERS).forEach(name => {
    const sh = ss.getSheetByName(name);
    const lastCol = CABE_HEADERS[name].length;
    sh.getRange(3, 1, CABE_MAX_ROWS, lastCol)
      .setBorder(true, true, true, true, true, true, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID)
      .setVerticalAlignment('middle');
  });

  ss.getSheetByName(CABE_SHEETS.MASTER_BARANG).getRange('E3:E').setNumberFormat(qtyFormat);
  ss.getSheetByName(CABE_SHEETS.MASTER_BARANG).getRange('G3:H').setNumberFormat(moneyFormat);
  ss.getSheetByName(CABE_SHEETS.MASTER_BARANG).getRange('J3:K').setNumberFormat(datetimeFormat);

  ss.getSheetByName(CABE_SHEETS.SUPPLIER).getRange('G3:H').setNumberFormat(datetimeFormat);

  const masuk = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  masuk.getRange('B3:B').setNumberFormat(dateFormat);
  masuk.getRange('E3:E').setNumberFormat(qtyFormat);
  masuk.getRange('G3:H').setNumberFormat(moneyFormat);
  masuk.getRange('L3:L').setNumberFormat(dateFormat);
  masuk.getRange('N3:O').setNumberFormat(datetimeFormat);

  const terjual = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  terjual.getRange('B3:B').setNumberFormat(dateFormat);
  terjual.getRange('E3:E').setNumberFormat(qtyFormat);
  terjual.getRange('G3:L').setNumberFormat(moneyFormat);
  terjual.getRange('M3:N').setNumberFormat('0%');
  terjual.getRange('P3:Q').setNumberFormat(datetimeFormat);

  const opname = ss.getSheetByName(CABE_SHEETS.STOK_OPNAME);
  opname.getRange('B3:B').setNumberFormat(dateFormat);
  opname.getRange('E3:G').setNumberFormat(qtyFormat);
  opname.getRange('H3:I').setNumberFormat(moneyFormat);
  opname.getRange('L3:M').setNumberFormat(datetimeFormat);

  const hutangAwal = ss.getSheetByName(CABE_SHEETS.HUTANG_AWAL);
  hutangAwal.getRange('B3:B').setNumberFormat(dateFormat);
  hutangAwal.getRange('D3:D').setNumberFormat(moneyFormat);
  hutangAwal.getRange('E3:E').setNumberFormat(dateFormat);
  hutangAwal.getRange('G3:H').setNumberFormat(datetimeFormat);

  const bayar = ss.getSheetByName(CABE_SHEETS.BAYAR_HUTANG);
  bayar.getRange('B3:B').setNumberFormat(dateFormat);
  bayar.getRange('E3:F').setNumberFormat(moneyFormat);
  bayar.getRange('I3:J').setNumberFormat(datetimeFormat);

  const pengeluaran = ss.getSheetByName(CABE_SHEETS.PENGELUARAN);
  pengeluaran.getRange('B3:B').setNumberFormat(dateFormat);
  pengeluaran.getRange('D3:D').setNumberFormat(moneyFormat);
  pengeluaran.getRange('G3:H').setNumberFormat(datetimeFormat);

  const notaPenjualan = ss.getSheetByName(CABE_SHEETS.NOTA_PENJUALAN);
  if (notaPenjualan) {
    notaPenjualan.getRange('B3:C').setNumberFormat(dateFormat);
    notaPenjualan.getRange('D3:D').setNumberFormat(moneyFormat);
    notaPenjualan.getRange('I3:J').setNumberFormat(datetimeFormat);
  }

  const aksesPerangkat = ss.getSheetByName(CABE_SHEETS.AKSES_PERANGKAT);
  if (aksesPerangkat) {
    aksesPerangkat.getRange('F3:F').setNumberFormat('0');
    aksesPerangkat.getRange('H3:I').setNumberFormat(datetimeFormat);
  }

  const koreksi = ss.getSheetByName(CABE_SHEETS.KOREKSI_TRANSAKSI);
  if (koreksi) {
    koreksi.getRange('B3:B').setNumberFormat(datetimeFormat);
    koreksi.getRange('D3:D').setNumberFormat(dateFormat);
    koreksi.getRange('J3:J').setNumberFormat(qtyFormat);
  }
}

function applyNumberFormatsHPP_(sh) {
  sh.getRange('D3:H').setNumberFormat('#,##0.##');
  sh.getRange('E3:E').setNumberFormat('"Rp"#,##0');
  sh.getRange('I3:K').setNumberFormat('"Rp"#,##0');
  sh.getRange('L3:L').setNumberFormat('dd/mm/yyyy');
}

function applyNumberFormatsStok_(sh) {
  sh.getRange('E3:F').setNumberFormat('#,##0.##');
  sh.getRange('H3:K').setNumberFormat('"Rp"#,##0');
}

function applyNumberFormatsHutang_(sh) {
  sh.getRange('B3:B').setNumberFormat('dd/mm/yyyy');
  sh.getRange('D3:F').setNumberFormat('"Rp"#,##0');
  sh.getRange('H3:H').setNumberFormat('dd/mm/yyyy');
}

/***********************
 * LOOKUP HELPERS
 ***********************/
function syncCodeName_(ss, codeCell, nameCell) {
  const code = codeCell.getValue();
  const name = nameCell.getValue();
  const master = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const last = master.getLastRow();
  if (last < CABE_START_ROW) return;
  const data = master.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 2).getValues();

  if (name && !code) {
    const row = data.find(r => normalize_(r[1]) === normalize_(name));
    if (row) codeCell.setValue(row[0]);
  }
  if (code && !name) {
    const row = data.find(r => normalize_(r[0]) === normalize_(code));
    if (row) nameCell.setValue(row[1]);
  }
}

function lookupMaster_(ss, kode, colIndex) {
  const sh = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return '';
  const data = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, Math.max(colIndex, 2)).getValues();
  const row = data.find(r => normalize_(r[0]) === normalize_(kode));
  return row ? row[colIndex - 1] : '';
}

function lookupHPP_(ss, kode) {
  const sh = ss.getSheetByName(CABE_SHEETS.HPP);
  const last = Math.max(sh.getLastRow(), 3);
  const data = sh.getRange(3, 1, last - 2, 10).getValues();
  const row = data.find(r => normalize_(r[0]) === normalize_(kode));
  return row ? parseNumber_(row[9]) : 0;
}

function lookupStok_(ss, kode) {
  const sh = ss.getSheetByName(CABE_SHEETS.STOK_BARANG);
  const last = Math.max(sh.getLastRow(), 3);
  const data = sh.getRange(3, 1, last - 2, 5).getValues();
  const row = data.find(r => normalize_(r[0]) === normalize_(kode));
  return row ? parseNumber_(row[4]) : 0;
}

function lookupSupplierByNota_(ss, noNota) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return '';
  const data = sh.getRange(CABE_START_ROW, 9, last - CABE_START_ROW + 1, 2).getValues();
  for (let i = data.length - 1; i >= 0; i--) {
    if (normalize_(data[i][1]) === normalize_(noNota)) return data[i][0];
  }
  return '';
}


function lookupDebtByNota_(ss, noNota) {
  const sh = ss.getSheetByName(CABE_SHEETS.HUTANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return { supplier: '', totalHutang: '', totalBayar: '', sisaHutang: '', status: '' };
  const data = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 7).getValues();
  const row = data.find(r => normalize_(r[0]) === normalize_(noNota));
  if (!row) return { supplier: '', totalHutang: '', totalBayar: '', sisaHutang: '', status: '' };
  return {
    supplier: row[2] || '',
    totalHutang: parseNumber_(row[3]),
    totalBayar: parseNumber_(row[4]),
    sisaHutang: parseNumber_(row[5]),
    status: row[6] || ''
  };
}

function findOpenDebtBySupplier_(ss, supplier) {
  const sh = ss.getSheetByName(CABE_SHEETS.HUTANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return { noNota: '', sisaHutang: 0 };

  const data = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 8).getValues();
  const debts = data
    .filter(r => normalize_(r[2]) === normalize_(supplier) && normalize_(r[6]) !== 'lunas' && parseNumber_(r[5]) > 0)
    .map(r => ({ noNota: r[0], tanggal: r[1] instanceof Date ? r[1].getTime() : 0, sisaHutang: parseNumber_(r[5]) }));

  if (debts.length === 0) return { noNota: '', sisaHutang: 0 };
  debts.sort((a, b) => a.tanggal - b.tanggal);
  return debts[0];
}

/***********************
 * REPAIR / BACKFILL KODE
 ***********************/
function repairMissingCodesCABE() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  repairMissingCodes_(ss);
  setupDataValidation_(ss);
  refreshFormulaCABE();
  SpreadsheetApp.getUi().alert('Repair selesai. Kode barang, kode supplier, No Nota, format hutang, dan view sudah diperbaiki.');
}

function repairMissingCodes_(ss) {
  repairMasterBarangCodes_(ss);
  repairSupplierCodes_(ss);
  repairMissingNoNota_(ss);
  repairTransactionCodeName_(ss, CABE_SHEETS.BARANG_MASUK);
  repairTransactionCodeName_(ss, CABE_SHEETS.BARANG_TERJUAL);
  repairTransactionCodeName_(ss, CABE_SHEETS.STOK_OPNAME);
}

function repairMasterBarangCodes_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return;

  for (let row = CABE_START_ROW; row <= last; row++) {
    const nama = sh.getRange(row, 2).getValue();
    if (!nama) continue;
    autoMasterBarang_(ss, sh, row);
  }
}

function repairSupplierCodes_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.SUPPLIER);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return;

  for (let row = CABE_START_ROW; row <= last; row++) {
    const nama = sh.getRange(row, 2).getValue();
    if (!nama) continue;
    autoSupplier_(ss, sh, row);
  }
}
function repairMissingNoNota_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return;

  for (let row = CABE_START_ROW; row <= last; row++) {
    const tanggal = sh.getRange(row, 2).getValue();
    const kode = sh.getRange(row, 3).getValue();
    const nama = sh.getRange(row, 4).getValue();
    const qty = sh.getRange(row, 5).getValue();
    const harga = sh.getRange(row, 7).getValue();
    const noNota = sh.getRange(row, 10).getValue();

    // Isi No Nota hanya untuk baris transaksi yang benar-benar ada isinya.
    if (!noNota && (tanggal || kode || nama || qty || harga)) {
      sh.getRange(row, 10).setValue(generateNotaNumber_(ss, tanggal || todayDate_(), row, sh.getRange(row, 11).getValue(), sh.getRange(row, 9).getValue()));
    }
  }
}



function repairNoNotaPerTanggalSupplierCABE() {
  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  const result = repairNoNotaPerTanggalSupplier_(ss);
  setupHutangFormulas_(ss);
  buildCashflowBisnis_(ss);
  buildDashboard_(ss);
  clearCABECache_();
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert(
    'No Nota sudah dirapikan.\n\n' +
    'Baris diperbarui: ' + result.updatedRows + '\n' +
    'Kelompok nota: ' + result.groupCount + '\n\n' +
    'Aturan: tanggal yang sama + supplier yang sama + status yang sama memakai satu No Nota.'
  );
}

function repairNoNotaPerTanggalSupplier_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  if (!sh) return { updatedRows: 0, groupCount: 0 };
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return { updatedRows: 0, groupCount: 0 };

  // Ambil B:K = Tanggal s/d Status Bayar.
  const rowCount = last - CABE_START_ROW + 1;
  const data = sh.getRange(CABE_START_ROW, 2, rowCount, 10).getValues();
  const currentNotaValues = sh.getRange(CABE_START_ROW, 10, rowCount, 1).getValues();
  const groupMap = {};
  const sequenceMap = {};
  let updatedRows = 0;

  data.forEach((r, i) => {
    const tanggal = r[0];
    const kode = r[1];
    const nama = r[2];
    const qty = r[3];
    const harga = r[5];
    const supplier = r[7] || '';
    const currentNota = currentNotaValues[i][0];
    const statusBayar = r[9] || 'TUNAI';

    // Lewati baris kosong dan No Nota manual yang tidak mengikuti format otomatis.
    if (!(tanggal || kode || nama || qty || harga)) return;
    if (currentNota && !isAutoNotaNumber_(currentNota)) return;

    const dateKey = notaDateKey_(tanggal || todayDate_());
    if (!dateKey) return;

    const prefix = getNotaPrefixByStatus_(statusBayar);
    const statusKey = normalize_(statusBayar || 'TUNAI');
    const supplierKey = normalize_(supplier || 'TANPA SUPPLIER');
    const groupKey = [prefix, dateKey, statusKey, supplierKey].join('|');
    const prefixDateKey = prefix + '-' + dateKey;

    if (!groupMap[groupKey]) {
      sequenceMap[prefixDateKey] = (sequenceMap[prefixDateKey] || 0) + 1;
      groupMap[groupKey] = prefix + '-' + dateKey + '-' + String(sequenceMap[prefixDateKey]).padStart(3, '0');
    }

    const newNota = groupMap[groupKey];
    if (currentNotaValues[i][0] !== newNota) {
      currentNotaValues[i][0] = newNota;
      updatedRows++;
    }
  });

  if (updatedRows > 0) {
    sh.getRange(CABE_START_ROW, 10, rowCount, 1).setValues(currentNotaValues);
  }
  return { updatedRows: updatedRows, groupCount: Object.keys(groupMap).length };
}

function repairTransactionCodeName_(ss, sheetName) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return;
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return;

  for (let row = CABE_START_ROW; row <= last; row++) {
    const codeCell = sh.getRange(row, 3);
    const nameCell = sh.getRange(row, 4);
    if (!codeCell.getValue() && !nameCell.getValue()) continue;
    syncCodeName_(ss, codeCell, nameCell);
  }
}


/***********************
 * NOTA PENJUALAN LOG + WA
 ***********************/
function buildNotaWhatsAppMessage_(startDate, endDate, total) {
  const sameMonth = Utilities.formatDate(startDate, CABE_TZ, 'MM/yyyy') === Utilities.formatDate(endDate, CABE_TZ, 'MM/yyyy');
  const periode = sameMonth
    ? Utilities.formatDate(startDate, CABE_TZ, 'dd') + '-' + Utilities.formatDate(endDate, CABE_TZ, 'dd MMMM yyyy')
    : Utilities.formatDate(startDate, CABE_TZ, 'dd MMMM yyyy') + ' - ' + Utilities.formatDate(endDate, CABE_TZ, 'dd MMMM yyyy');
  return '*Nota tanggal ' + periode + '*\nTotal ' + formatRupiah_(total);
}

function groupNotaRowsByDate_(rows) {
  const map = {};
  const groups = [];

  rows.forEach(item => {
    const key = Utilities.formatDate(item.tanggal, CABE_TZ, 'yyyy-MM-dd');
    if (!map[key]) {
      map[key] = {
        key: key,
        date: item.tanggal,
        rows: [],
        total: 0
      };
      groups.push(map[key]);
    }

    map[key].rows.push(item);
    map[key].total += parseNumber_(item.totalJual);
  });

  return groups;
}

function formatNotaDateEnglish_(date) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const day = Utilities.formatDate(date, CABE_TZ, 'dd');
  const monthIndex = Number(Utilities.formatDate(date, CABE_TZ, 'M')) - 1;
  const year = Utilities.formatDate(date, CABE_TZ, 'yyyy');
  return day + ' ' + months[monthIndex] + ' ' + year;
}

function formatRupiahNota_(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

function appendNotaPenjualanLog_(ss, nota) {
  const sh = ss.getSheetByName(CABE_SHEETS.NOTA_PENJUALAN) || prepareSheet_(ss, CABE_SHEETS.NOTA_PENJUALAN, false);
  const row = getNextEmptyRow_(sh, CABE_START_ROW, 1);
  const now = new Date();
  sh.getRange(row, 1, 1, CABE_HEADERS[CABE_SHEETS.NOTA_PENJUALAN].length).setValues([[
    nota.noNota,
    nota.startDate,
    nota.endDate,
    nota.total,
    'BELUM H.C',
    'BELUM L.C',
    nota.fileUrl,
    nota.pesanWA,
    now,
    now
  ]]);
  return row;
}

/***********************
 * WEB API - SIAP UNTUK NETLIFY/PWA
 * Apps Script menjadi backend; Google Sheet tetap database.
 ***********************/
function doGet(e) {
  return jsonResponse_({ ok: true, data: { app: 'CABE API', status: 'READY', time: new Date() } });
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = body.action;
    const payload = body.payload || {};

    // Token bisa dikirim di body utama atau di payload.
    const authToken = body.authToken || body.token || payload.authToken || payload.token || '';
    const data = apiHandleCABE_(action, payload, authToken);

    return jsonResponse_({ ok: true, data: data });
  } catch (err) {
    return jsonResponse_({ ok: false, message: err.message || String(err) });
  }
}

function apiHandleCABE_(action, payload, authToken) {
  if (!action) throw new Error('Action API wajib diisi.');

  // VERIFY_PIN sengaja dibuka untuk gerbang login awal.
  if (action === 'VERIFY_PIN') {
    return apiVerifyPin_(payload);
  }

  // VERIFY_FACE_DEVICE juga dibuka, tetapi hanya menerima perangkat aktif
  // yang sudah terdaftar di sheet AKSES PERANGKAT.
  if (action === 'VERIFY_FACE_DEVICE') {
    const ssFace = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
    return apiVerifyFaceDevice_(ssFace, payload);
  }

  // VERIFY_SESSION dipakai frontend untuk mengecek token lama sebelum dashboard dibuka.
  if (action === 'VERIFY_SESSION') {
    requireCABEAuth_(authToken);
    return { valid: true, message: 'Sesi akses aktif.', expiresInSeconds: CABE_TOKEN_TTL_SECONDS };
  }

  // Semua action selain VERIFY_PIN / VERIFY_FACE_DEVICE / VERIFY_SESSION wajib membawa token hasil akses.
  requireCABEAuth_(authToken);

  const ss = SpreadsheetApp.openById(CABE_SPREADSHEET_ID);
  const writeActions = ['ADD_BARANG_MASUK', 'ADD_BARANG_TERJUAL', 'SAVE_KOREKSI_TRANSAKSI', 'ADD_STOK_OPNAME', 'ADD_BAYAR_HUTANG', 'ADD_PENGELUARAN', 'UPDATE_PENGELUARAN', 'DELETE_PENGELUARAN', 'UPDATE_HC', 'UPDATE_LC', 'UPDATE_NOTA_HC', 'GENERATE_NOTA_PENJUALAN', 'SAVE_BANK_RECONCILIATION', 'SAVE_FINANCE_SETTINGS', 'ADD_CAPITAL_MOVEMENT', 'CLOSE_PERIOD', 'REGISTER_FACE_DEVICE', 'DISABLE_FACE_DEVICE'];

  if (writeActions.indexOf(action) >= 0) {
    return withCABEWriteLock_(function() {
      return runIdempotentWrite_(ss, action, payload);
    });
  }

  return apiRouteCABE_(ss, action, payload);
}

function apiRouteCABE_(ss, action, payload) {
  switch (action) {
    case 'GET_BOOTSTRAP': return apiGetBootstrap_(ss, payload);
    case 'GET_DASHBOARD': return apiGetDashboard_(ss);
    case 'GET_MASTER_BARANG': return apiGetMasterBarang_(ss);
    case 'GET_SUPPLIER': return apiGetSupplier_(ss);
    case 'GET_STOK_BARANG': return apiGetStokBarang_(ss);
    case 'GET_STOK_DETAIL': return apiGetStokDetail_(ss, payload);
    case 'GET_STOK_OPNAME_HISTORY': return apiGetStokOpnameHistory_(ss);
    case 'GET_HUTANG': return apiGetHutang_(ss);
    case 'GET_BAYAR_HUTANG_HISTORY': return apiGetBayarHutangHistory_(ss);
    case 'GET_CASHFLOW': return apiGetCashflow_(ss);
    case 'GET_PENGELUARAN_HISTORY': return apiGetPengeluaranHistory_(ss);
    case 'GET_NOTA_HISTORY': return apiGetNotaHistory_(ss);
    case 'GET_TRANSACTION_SUMMARY': return apiGetTransactionSummary_(ss);
    case 'GET_FINANCE_CONTROL': return apiGetFinanceControl_(ss, payload);
    case 'GET_MONTHLY_REPORT': return apiGetMonthlyReport_(ss, payload);
    case 'GET_KOREKSI_TRANSAKSI': return apiGetKoreksiTransaksi_(ss, payload);
    case 'ADD_BARANG_MASUK': return apiAddBarangMasuk_(ss, payload);
    case 'ADD_BARANG_TERJUAL': return apiAddBarangTerjual_(ss, payload);
    case 'SAVE_KOREKSI_TRANSAKSI': return apiSaveKoreksiTransaksi_(ss, payload);
    case 'ADD_STOK_OPNAME': return apiAddStokOpname_(ss, payload);
    case 'ADD_BAYAR_HUTANG': return apiAddBayarHutang_(ss, payload);
    case 'ADD_PENGELUARAN': return apiAddPengeluaran_(ss, payload);
    case 'UPDATE_PENGELUARAN': return apiUpdatePengeluaran_(ss, payload);
    case 'DELETE_PENGELUARAN': return apiDeletePengeluaran_(ss, payload);
    case 'UPDATE_HC': return apiUpdateCashflowFlag_(ss, payload, 'HC');
    case 'UPDATE_LC': return apiUpdateCashflowFlag_(ss, payload, 'LC');
    case 'UPDATE_NOTA_HC': return apiUpdateNotaHC_(ss, payload);
    case 'GENERATE_NOTA_PENJUALAN': return apiGenerateNotaPenjualan_(ss, payload);
    case 'SAVE_BANK_RECONCILIATION': return apiSaveBankReconciliation_(ss, payload);
    case 'SAVE_FINANCE_SETTINGS': return apiSaveFinanceSettings_(ss, payload);
    case 'ADD_CAPITAL_MOVEMENT': return apiAddCapitalMovement_(ss, payload);
    case 'CLOSE_PERIOD': return apiClosePeriod_(ss, payload);
    case 'GET_AKSES_PERANGKAT': return apiGetAksesPerangkat_(ss);
    case 'REGISTER_FACE_DEVICE': return apiRegisterFaceDevice_(ss, payload);
    case 'DISABLE_FACE_DEVICE': return apiDisableFaceDevice_(ss, payload);
    default: throw new Error('Action API tidak dikenal: ' + action);
  }
}

/***********************
 * PIN GATE / AUTH TOKEN
 ***********************/
function apiVerifyPin_(payload) {
  const pinInput = String((payload && (payload.pin || payload.PIN || payload.password)) || '').trim();
  const pinServer = String(CABE_APP_PIN || '').trim();

  if (!pinInput) throw new Error('PIN wajib diisi.');
  if (!pinServer) throw new Error('PIN server belum diatur di Code.gs.');
  if (pinInput !== pinServer) throw new Error('PIN salah.');

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('CABE_AUTH_' + token, 'VALID', CABE_TOKEN_TTL_SECONDS);

  return {
    message: 'PIN benar. Akses dibuka.',
    token: token,
    authToken: token,
    sessionToken: token,
    expiresInSeconds: CABE_TOKEN_TTL_SECONDS
  };
}

function requireCABEAuth_(token) {
  token = String(token || '').trim();
  if (!token) throw new Error('Akses ditolak. Masukkan PIN terlebih dahulu.');

  const valid = CacheService.getScriptCache().get('CABE_AUTH_' + token);
  if (valid !== 'VALID') {
    throw new Error('Sesi PIN sudah habis atau tidak valid. Silakan masukkan PIN lagi.');
  }

  // Perpanjang sesi setiap ada aktivitas, supaya user tidak gampang terlempar saat sedang input.
  CacheService.getScriptCache().put('CABE_AUTH_' + token, 'VALID', CABE_TOKEN_TTL_SECONDS);
  return true;
}

function apiVerifyFaceDevice_(ss, payload) {
  const credentialId = String((payload && (payload.credentialId || payload.idAksesAman || payload.deviceId)) || '').trim();
  if (!credentialId) throw new Error('Akses perangkat belum tersedia. Silakan gunakan PIN akses.');

  const sh = ss.getSheetByName(CABE_SHEETS.AKSES_PERANGKAT) || prepareSheet_(ss, CABE_SHEETS.AKSES_PERANGKAT, false);
  setupAksesPerangkatSheet_(ss);

  const row = findAksesPerangkatRowByCredential_(sh, credentialId);
  if (!row) throw new Error('Perangkat ini belum terdaftar. Silakan masuk dengan PIN terlebih dahulu.');

  const status = String(sh.getRange(row, 7).getValue() || '').trim().toUpperCase();
  if (status !== 'AKTIF') throw new Error('Akses perangkat ini sudah dinonaktifkan. Silakan gunakan PIN akses.');

  const jumlahPemakaian = parseNumber_(sh.getRange(row, 6).getValue()) + 1;
  const now = new Date();
  sh.getRange(row, 6).setValue(jumlahPemakaian);
  sh.getRange(row, 9).setValue(now);

  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('CABE_AUTH_' + token, 'VALID', CABE_TOKEN_TTL_SECONDS);

  return {
    message: 'Akses perangkat diterima.',
    token: token,
    authToken: token,
    sessionToken: token,
    expiresInSeconds: CABE_TOKEN_TTL_SECONDS,
    idPerangkat: sh.getRange(row, 1).getValue(),
    namaPengguna: sh.getRange(row, 2).getValue(),
    namaPerangkat: sh.getRange(row, 3).getValue(),
    jumlahPemakaian: jumlahPemakaian
  };
}


function apiGetAksesPerangkat_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.AKSES_PERANGKAT) || prepareSheet_(ss, CABE_SHEETS.AKSES_PERANGKAT, false);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  return sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, CABE_HEADERS[CABE_SHEETS.AKSES_PERANGKAT].length).getValues()
    .filter(r => r[0] || r[1] || r[2] || r[3])
    .map(r => ({
      idPerangkat: r[0],
      namaPengguna: r[1],
      namaPerangkat: r[2],
      idAksesAman: r[3],
      jumlahPemakaian: parseNumber_(r[5]),
      status: r[6] || 'AKTIF',
      tanggalDaftar: formatDateTimeApi_(r[7]),
      terakhirLogin: formatDateTimeApi_(r[8]),
      catatan: r[9] || ''
    }));
}

function apiRegisterFaceDevice_(ss, payload) {
  const sh = ss.getSheetByName(CABE_SHEETS.AKSES_PERANGKAT) || prepareSheet_(ss, CABE_SHEETS.AKSES_PERANGKAT, false);
  setupAksesPerangkatSheet_(ss);

  const namaPengguna = String((payload && (payload.namaPengguna || payload.userName || payload.user)) || 'Pengguna').trim();
  const namaPerangkat = String((payload && (payload.namaPerangkat || payload.deviceName || payload.device)) || 'Perangkat').trim();
  const credentialId = String((payload && (payload.credentialId || payload.idAksesAman || payload.deviceId)) || '').trim();
  const publicKey = String((payload && (payload.publicKey || payload.kunciPublik)) || '').trim();
  const signCount = parseNumber_(payload && (payload.signCount || payload.jumlahPemakaian));
  const catatan = String((payload && payload.catatan) || 'Terdaftar dari Web/PWA').trim();

  if (!credentialId) throw new Error('ID akses perangkat wajib diisi.');
  if (!publicKey) throw new Error('Kunci akses perangkat wajib diisi.');

  const existingRow = findAksesPerangkatRowByCredential_(sh, credentialId);
  const now = new Date();

  if (existingRow) {
    sh.getRange(existingRow, 2, 1, 9).setValues([[namaPengguna, namaPerangkat, credentialId, publicKey, signCount, 'AKTIF', sh.getRange(existingRow, 8).getValue() || now, now, catatan]]);
    clearCABEBootstrapCache_();
    return { message: 'Akses perangkat diperbarui.', idPerangkat: sh.getRange(existingRow, 1).getValue(), status: 'AKTIF' };
  }

  const row = getNextEmptyRow_(sh, CABE_START_ROW, 1);
  const idPerangkat = makeId_('DEV');
  sh.getRange(row, 1, 1, CABE_HEADERS[CABE_SHEETS.AKSES_PERANGKAT].length).setValues([[
    idPerangkat,
    namaPengguna,
    namaPerangkat,
    credentialId,
    publicKey,
    signCount,
    'AKTIF',
    now,
    '',
    catatan
  ]]);

  clearCABEBootstrapCache_();
  return { message: 'Akses perangkat berhasil didaftarkan.', idPerangkat: idPerangkat, status: 'AKTIF' };
}

function apiDisableFaceDevice_(ss, payload) {
  const sh = ss.getSheetByName(CABE_SHEETS.AKSES_PERANGKAT);
  if (!sh) throw new Error('Sheet AKSES PERANGKAT belum tersedia.');

  const idPerangkat = String((payload && (payload.idPerangkat || payload.deviceAccessId)) || '').trim();
  const credentialId = String((payload && (payload.credentialId || payload.idAksesAman || payload.deviceId)) || '').trim();
  if (!idPerangkat && !credentialId) throw new Error('ID perangkat wajib diisi.');

  const row = idPerangkat ? findAksesPerangkatRowById_(sh, idPerangkat) : findAksesPerangkatRowByCredential_(sh, credentialId);
  if (!row) throw new Error('Perangkat tidak ditemukan.');

  sh.getRange(row, 7).setValue('NONAKTIF');
  sh.getRange(row, 10).setValue('Dinonaktifkan dari Web/PWA');
  clearCABEBootstrapCache_();
  return { message: 'Akses perangkat dinonaktifkan.', idPerangkat: sh.getRange(row, 1).getValue(), status: 'NONAKTIF' };
}

function findAksesPerangkatRowByCredential_(sh, credentialId) {
  credentialId = normalize_(credentialId);
  if (!credentialId) return 0;
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return 0;

  const values = sh.getRange(CABE_START_ROW, 4, last - CABE_START_ROW + 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (normalize_(values[i][0]) === credentialId) return CABE_START_ROW + i;
  }
  return 0;
}

function findAksesPerangkatRowById_(sh, idPerangkat) {
  idPerangkat = normalize_(idPerangkat);
  if (!idPerangkat) return 0;
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return 0;

  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (normalize_(values[i][0]) === idPerangkat) return CABE_START_ROW + i;
  }
  return 0;
}


function apiGetBootstrap_(ss, payload) {
  const useCache = !(payload && payload.fresh === true);
  const cache = CacheService.getScriptCache();

  if (useCache) {
    const cached = cache.get(CABE_BOOTSTRAP_CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        data.cached = true;
        data.cacheAge = 'singkat';
        return data;
      } catch (err) {
        cache.remove(CABE_BOOTSTRAP_CACHE_KEY);
      }
    }
  }

  // Data yang dipakai Dashboard juga dikirim ke halaman lain. Baca sekali agar refresh lebih cepat.
  const masterBarang = apiGetMasterBarang_(ss);
  const supplier = apiGetSupplier_(ss);
  const stok = apiGetStokBarang_(ss);
  const hutang = apiGetHutang_(ss);
  const cashflow = apiGetCashflow_(ss);

  const data = {
    dashboard: buildDashboardPayload_(cashflow, stok, hutang),
    masterBarang: masterBarang,
    supplier: supplier,
    stok: stok,
    stockDetail: apiGetStokDetail_(ss, {}),
    stokOpnameHistory: apiGetStokOpnameHistory_(ss),
    hutang: hutang,
    bayarHutangHistory: apiGetBayarHutangHistory_(ss),
    cashflow: cashflow,
    pengeluaranHistory: apiGetPengeluaranHistory_(ss),
    notaHistory: apiGetNotaHistory_(ss),
    transactionSummary: apiGetTransactionSummary_(ss),
    financeControl: apiGetFinanceControl_(ss, { _context: { cashflow: cashflow, hutang: hutang, stok: stok } }),
    monthlyReport: apiGetMonthlyReport_(ss, { _context: { cashflow: cashflow, hutang: hutang, stok: stok } }),
    cached: false,
    serverTime: formatDateTimeApi_(new Date())
  };

  try {
    const text = JSON.stringify(data);
    // CacheService punya batas ukuran. Kalau data membesar, sistem tetap jalan tanpa cache.
    if (text.length < 90000) cache.put(CABE_BOOTSTRAP_CACHE_KEY, text, CABE_BOOTSTRAP_CACHE_SECONDS);
  } catch (err) {
    // Abaikan cache kalau data terlalu besar.
  }

  return data;
}

function clearCABEBootstrapCache_() {
  try {
    CacheService.getScriptCache().remove(CABE_BOOTSTRAP_CACHE_KEY);
  } catch (err) {
    // Cache gagal dibersihkan bukan alasan transaksi gagal.
  }
}

function withCABEWriteLock_(fn) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    return fn();
  } finally {
    try { lock.releaseLock(); } catch (err) {}
  }
}

function runIdempotentWrite_(ss, action, payload) {
  const requestId = getCABERequestId_(action, payload);
  const cache = CacheService.getScriptCache();

  if (requestId) {
    const cached = cache.get(CABE_WRITE_RESULT_CACHE_PREFIX + requestId);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        data.duplicateSafe = true;
        data.message = data.message || 'Data sudah tersimpan.';
        return data;
      } catch (err) {
        cache.remove(CABE_WRITE_RESULT_CACHE_PREFIX + requestId);
      }
    }
  }

  const result = apiRouteCABE_(ss, action, payload);

  if (requestId) {
    try {
      cache.put(CABE_WRITE_RESULT_CACHE_PREFIX + requestId, JSON.stringify(result), CABE_WRITE_RESULT_CACHE_SECONDS);
    } catch (err) {
      // Kalau cache gagal, transaksi tetap dianggap berhasil.
    }
  }

  return result;
}

function getCABERequestId_(action, payload) {
  if (!payload) return '';
  const raw = payload.requestId || payload.requestID || payload.idempotencyKey || '';
  if (!raw) return '';
  return String(action || 'WRITE').trim().toUpperCase() + '_' + String(raw).trim().replace(/[^A-Za-z0-9_\-:.]/g, '').substring(0, 120);
}

function normalizeStatusBayarApi_(payload) {
  payload = payload || {};
  const raw = payload.statusBayar || payload.status_bayar || payload.statusBayarMasuk || payload.status || payload.jenisPembayaran || payload.jenisTransaksi || '';
  let status = String(raw || '').trim().toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

  if (!status) return 'TUNAI';
  if (status === 'STOKAWAL') status = 'STOK AWAL';
  if (status === 'KOREKSIMASUK') status = 'KOREKSI MASUK';

  const allowed = ['TUNAI', 'HUTANG', 'STOK AWAL', 'BONUS', 'KOREKSI MASUK'];
  if (allowed.indexOf(status) === -1) {
    throw new Error('Status barang masuk tidak valid: ' + raw);
  }
  return status;
}

function quickAfterWrite_(ss) {
  SpreadsheetApp.flush();
  clearCABEBootstrapCache_();
}

function apiGetDashboard_(ss) {
  // Dashboard web dihitung langsung dari sumber data agar selalu sama dengan Cashflow.
  // Tidak lagi bergantung pada nilai formula di sheet DASHBOARD yang dapat tertinggal cache.
  return buildDashboardPayload_(apiGetCashflow_(ss), apiGetStokBarang_(ss), apiGetHutang_(ss));
}

function buildDashboardPayload_(cashflow, stokRows, hutangRows) {
  cashflow = cashflow || {};
  stokRows = stokRows || [];
  hutangRows = hutangRows || [];

  const totalNilaiStok = stokRows.reduce(function(sum, item) {
    return sum + parseNumber_(item.nilaiStok);
  }, 0);

  const stokPerSatuan = {};
  stokRows.forEach(function(item) {
    const satuan = String(item.satuan || 'Kg').trim() || 'Kg';
    stokPerSatuan[satuan] = (stokPerSatuan[satuan] || 0) + parseNumber_(item.stok);
  });
  const satuanList = Object.keys(stokPerSatuan);
  const satuanStokBarang = satuanList.length === 1 ? satuanList[0] : (satuanList.length ? 'unit campuran' : 'Kg');
  const totalStokBarang = satuanList.reduce(function(sum, satuan) {
    return sum + parseNumber_(stokPerSatuan[satuan]);
  }, 0);

  const hutangBelumLunas = hutangRows.reduce(function(sum, item) {
    return sum + parseNumber_(item.sisaHutang);
  }, 0);

  const stokPerluDicek = stokRows
    .filter(function(item) { return String(item.status || '').toUpperCase() !== 'AMAN'; })
    .map(function(item) {
      return {
        kode: item.kode,
        nama: item.nama,
        kategori: item.kategori,
        satuan: item.satuan,
        stok: parseNumber_(item.stok),
        minimum: parseNumber_(item.minimum),
        status: item.status
      };
    });

  return {
    totalNilaiStok: totalNilaiStok,
    totalStokBarang: totalStokBarang,
    satuanStokBarang: satuanStokBarang,
    stokPerSatuan: stokPerSatuan,
    jumlahJenisBarang: stokRows.length,
    penjualanBulanIni: parseNumber_(cashflow.penjualan),
    pemasukanCairBulanIni: parseNumber_(cashflow.pemasukanCair),
    pengeluaranBulanIni: parseNumber_(cashflow.pengeluaran),
    saldoKas: parseNumber_(cashflow.saldo),
    totalLabaPenjualan: parseNumber_(cashflow.totalLabaPenjualan),
    labaSudahHCBulanIni: parseNumber_(cashflow.labaSudahHC),
    labaBelumHCBulanIni: parseNumber_(cashflow.labaBelumHC),
    // Alias lama dipertahankan; nilainya adalah laba yang sudah H.C.
    labaMasukBulanIni: parseNumber_(cashflow.labaSudahHC),
    labaDipindahBulanIni: parseNumber_(cashflow.labaDipindah),
    sisaLabaBelumDipindah: parseNumber_(cashflow.sisaLaba),
    sisaLabaBulanIni: parseNumber_(cashflow.sisaLaba),
    tagihanBelumHC: parseNumber_(cashflow.tagihanBelumHC),
    hutangSupplierBelumLunas: hutangBelumLunas,
    hutangBelumLunas: hutangBelumLunas,
    stokPerluDicek: stokPerluDicek
  };
}

function apiGetLowStock_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.STOK_BARANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];
  return sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 7).getValues()
    .filter(r => r[0] && r[6] !== 'AMAN')
    .map(r => ({ kode: r[0], nama: r[1], kategori: r[2], satuan: r[3], stok: parseNumber_(r[4]), minimum: parseNumber_(r[5]), status: r[6] }));
}

function apiGetMasterBarang_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];
  return sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 6).getValues()
    .filter(r => r[0] && r[1] && r[5] === 'AKTIF')
    .map(r => ({ kode: r[0], nama: r[1], kategori: r[2], satuan: r[3], minimum: parseNumber_(r[4]), status: r[5] }));
}

function apiGetSupplier_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.SUPPLIER);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];
  return sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 5).getValues()
    .filter(r => r[0] && r[1] && r[4] === 'AKTIF')
    .map(r => ({ kode: r[0], nama: r[1], hp: r[2], alamat: r[3], status: r[4] }));
}

function apiGetStokBarang_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.STOK_BARANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];
  return sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 11).getValues()
    .filter(r => r[0] && r[1])
    .map(r => ({ kode: r[0], nama: r[1], kategori: r[2], satuan: r[3], stok: parseNumber_(r[4]), minimum: parseNumber_(r[5]), status: r[6], hpp: parseNumber_(r[7]), nilaiStok: parseNumber_(r[8]) }));
}

function apiGetStokDetail_(ss, payload) {
  payload = payload || {};

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const startDate = parseDateInput_(payload.startDate || payload.tanggalAwal) || defaultStart;
  const endDate = parseDateInput_(payload.endDate || payload.tanggalAkhir) || defaultEnd;

  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  if (startDay.getTime() > endDay.getTime()) {
    throw new Error('Tanggal awal tidak boleh melewati tanggal akhir.');
  }

  const startTime = startDay.getTime();
  const endTime = endDay.getTime();
  const movementMap = {};

  function addMovement_(kode, nama, satuan, qty, type) {
    kode = String(kode || '').trim();
    nama = String(nama || '').trim();
    if (!nama) return;

    const key = normalize_(kode || nama);
    if (!movementMap[key]) {
      movementMap[key] = {
        kode: kode,
        nama: nama,
        satuan: String(satuan || 'Kg').trim() || 'Kg',
        qtyMasuk: 0,
        qtyKeluar: 0
      };
    }

    if (!movementMap[key].kode && kode) movementMap[key].kode = kode;
    if (!movementMap[key].nama && nama) movementMap[key].nama = nama;
    if (!movementMap[key].satuan && satuan) movementMap[key].satuan = String(satuan);

    const value = parseNumber_(qty);
    if (type === 'masuk') movementMap[key].qtyMasuk += value;
    if (type === 'keluar') movementMap[key].qtyKeluar += value;
  }

  function readMovement_(sheetName, type) {
    const sh = ss.getSheetByName(sheetName);
    if (!sh) return;
    const last = sh.getLastRow();
    if (last < CABE_START_ROW) return;

    // Kolom A-F sudah mencakup ID, Tanggal, Kode, Nama, Qty, dan Satuan.
    const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 6).getValues();
    values.forEach(function(row) {
      const date = row[1] instanceof Date ? row[1] : parseDateInput_(row[1]);
      if (!date) return;
      const dayTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      if (dayTime < startTime || dayTime > endTime) return;
      addMovement_(row[2], row[3], row[5], row[4], type);
    });
  }

  readMovement_(CABE_SHEETS.BARANG_MASUK, 'masuk');
  readMovement_(CABE_SHEETS.BARANG_TERJUAL, 'keluar');

  const rows = Object.keys(movementMap)
    .map(function(key) { return movementMap[key]; })
    .filter(function(item) { return item.qtyMasuk !== 0 || item.qtyKeluar !== 0; })
    .sort(function(a, b) {
      return String(a.nama || '').localeCompare(String(b.nama || ''), 'id', { sensitivity: 'base' });
    });

  const totalMasuk = rows.reduce(function(sum, item) { return sum + parseNumber_(item.qtyMasuk); }, 0);
  const totalKeluar = rows.reduce(function(sum, item) { return sum + parseNumber_(item.qtyKeluar); }, 0);
  const units = {};
  rows.forEach(function(item) { units[String(item.satuan || 'Kg')] = true; });
  const unitNames = Object.keys(units);
  const totalUnit = unitNames.length === 1 ? unitNames[0] : (unitNames.length ? 'Unit campuran' : 'Kg');

  return {
    startDate: Utilities.formatDate(startDay, CABE_TZ, 'yyyy-MM-dd'),
    endDate: Utilities.formatDate(endDay, CABE_TZ, 'yyyy-MM-dd'),
    label: formatDateApi_(startDay) + ' - ' + formatDateApi_(endDay),
    totalMasuk: totalMasuk,
    totalKeluar: totalKeluar,
    totalUnit: totalUnit,
    rows: rows
  };
}

function apiGetStokOpnameHistory_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.STOK_OPNAME);
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const width = CABE_HEADERS[CABE_SHEETS.STOK_OPNAME].length;
  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, width).getValues();
  const master = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const unitMap = {};
  if (master && master.getLastRow() >= CABE_START_ROW) {
    master.getRange(CABE_START_ROW, 1, master.getLastRow() - CABE_START_ROW + 1, 4).getValues().forEach(function(row) {
      if (row[0]) unitMap[normalize_(row[0])] = String(row[3] || 'Kg');
    });
  }

  return values.map(function(row, index) {
      const rowNumber = CABE_START_ROW + index;
      const tanggalRaw = row[1] instanceof Date ? row[1] : parseDateInput_(row[1]);
      const kode = String(row[2] || '').trim();
      return {
        rowNumber: rowNumber,
        id: String(row[0] || ('SO-ROW-' + rowNumber)).trim(),
        tanggalRaw: tanggalRaw,
        tanggal: tanggalRaw ? formatDateApi_(tanggalRaw) : String(row[1] || ''),
        tanggalIso: tanggalRaw ? Utilities.formatDate(tanggalRaw, CABE_TZ, 'yyyy-MM-dd') : '',
        kodeBarang: kode,
        namaBarang: String(row[3] || '').trim(),
        stokSistem: parseNumber_(row[4]),
        stokFisik: parseNumber_(row[5]),
        selisih: parseNumber_(row[6]),
        hpp: parseNumber_(row[7]),
        nilaiSelisih: parseNumber_(row[8]),
        petugas: String(row[9] || '').trim(),
        keterangan: String(row[10] || '').trim(),
        satuan: unitMap[normalize_(kode)] || 'Kg',
        createdAt: formatDateTimeApi_(row[11]),
        updatedAt: formatDateTimeApi_(row[12])
      };
    })
    .filter(function(item) { return item.namaBarang || item.kodeBarang; })
    .sort(function(a, b) {
      const aTime = a.tanggalRaw ? a.tanggalRaw.getTime() : 0;
      const bTime = b.tanggalRaw ? b.tanggalRaw.getTime() : 0;
      return bTime - aTime || b.rowNumber - a.rowNumber;
    });
}

function apiGetHutang_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.HUTANG);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];
  return sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 8).getValues()
    .filter(r => r[0] && r[6] !== 'LUNAS')
    .map(r => ({ noNota: r[0], tanggalNota: formatDateApi_(r[1]), supplier: r[2], totalHutang: parseNumber_(r[3]), totalBayar: parseNumber_(r[4]), sisaHutang: parseNumber_(r[5]), status: r[6], jatuhTempo: formatDateApi_(r[7]) }));
}

function apiGetBayarHutangHistory_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.BAYAR_HUTANG);
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const width = CABE_HEADERS[CABE_SHEETS.BAYAR_HUTANG].length;
  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, width).getValues();

  return values.map(function(row, index) {
      const rowNumber = CABE_START_ROW + index;
      const tanggalRaw = row[1] instanceof Date ? row[1] : parseDateInput_(row[1]);
      return {
        rowNumber: rowNumber,
        id: String(row[0] || ('BH-ROW-' + rowNumber)).trim(),
        tanggalRaw: tanggalRaw,
        tanggal: tanggalRaw ? formatDateApi_(tanggalRaw) : String(row[1] || ''),
        tanggalIso: tanggalRaw ? Utilities.formatDate(tanggalRaw, CABE_TZ, 'yyyy-MM-dd') : '',
        supplier: String(row[2] || '').trim(),
        noNota: String(row[3] || '').trim(),
        jumlahHutang: parseNumber_(row[4]),
        jumlahBayar: parseNumber_(row[5]),
        metodeBayar: String(row[6] || 'TRANSFER').trim().toUpperCase(),
        keterangan: String(row[7] || '').trim(),
        createdAt: formatDateTimeApi_(row[8]),
        updatedAt: formatDateTimeApi_(row[9])
      };
    })
    .filter(function(item) { return item.noNota && item.jumlahBayar > 0; })
    .sort(function(a, b) {
      const aTime = a.tanggalRaw ? a.tanggalRaw.getTime() : 0;
      const bTime = b.tanggalRaw ? b.tanggalRaw.getTime() : 0;
      return bTime - aTime || b.rowNumber - a.rowNumber;
    });
}

function apiGetCashflow_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.CASHFLOW);
  if (!sh) throw new Error('Sheet CASHFLOW BISNIS tidak ditemukan.');

  const salesProfitMap = getSalesProfitMapByDate_(ss);
  const capitalMovementMap = getCapitalMovementMapByDate_(ss);
  const saldoAwal = parseNumber_(sh.getRange('G3').getValue());
  let saldoBerjalan = saldoAwal;

  // Nilai H.C/L.C dihitung langsung dari checkbox dan transaksi penjualan.
  // Dengan begitu ringkasan web tidak bergantung pada formula summary yang mungkin belum tersinkron.
  const rows = sh.getRange('A6:I36').getValues()
    .filter(function(r) { return r[0]; })
    .map(function(r) {
      const key = formatCashflowKey_(r[0]);
      const sale = salesProfitMap[key] || { penjualan: 0, laba: 0 };
      const hc = r[7] === true;
      const lc = r[8] === true;
      const penjualan = parseNumber_(sale.penjualan);
      const laba = parseNumber_(sale.laba);
      const pemasukan = hc ? penjualan : 0;
      const movement = capitalMovementMap[key] || { modalMasuk: 0, prive: 0, pengambilanLaba: 0 };
      const modalMasuk = parseNumber_(movement.modalMasuk);
      const pengambilanPemilik = parseNumber_(movement.prive) + parseNumber_(movement.pengambilanLaba);
      // Kolom Pengeluaran pada sheet sudah mencakup pengeluaran usaha + mutasi pemilik.
      // Pisahkan kembali agar mutasi pemilik tidak dihitung dua kali di API.
      const pengeluaran = parseNumber_(r[2]);
      const pengeluaranUsaha = Math.max(0, pengeluaran - pengambilanPemilik);
      const pemasukanTotal = pemasukan + modalMasuk;
      const labaSudahHC = hc ? laba : 0;
      const labaBelumHC = hc ? 0 : laba;
      const labaSudahLC = hc && lc ? laba : 0;
      const sisaLaba = labaSudahHC - labaSudahLC;
      saldoBerjalan += pemasukanTotal - pengeluaran;

      return {
        id: key,
        key: key,
        tanggal: formatDateApi_(r[0]),
        penjualan: penjualan,
        pemasukan: pemasukan,
        pemasukanTotal: pemasukanTotal,
        modalMasuk: modalMasuk,
        pengeluaranUsaha: pengeluaranUsaha,
        pengambilanPemilik: pengambilanPemilik,
        prive: parseNumber_(movement.prive),
        pengambilanLaba: parseNumber_(movement.pengambilanLaba),
        pengeluaran: pengeluaran,
        saldo: saldoBerjalan,
        laba: laba,
        totalLaba: laba,
        labaSudahHC: labaSudahHC,
        labaBelumHC: labaBelumHC,
        labaSudahLC: labaSudahLC,
        sisaLaba: sisaLaba,
        // Alias lama dipertahankan agar frontend versi sebelumnya tetap dapat membaca data.
        labaMasuk: labaSudahHC,
        labaKeluar: labaSudahLC,
        labaBersih: sisaLaba,
        hc: hc,
        lc: lc
      };
    });

  const totalPenjualan = rows.reduce(function(sum, row) { return sum + parseNumber_(row.penjualan); }, 0);
  const pemasukanCair = rows.reduce(function(sum, row) { return sum + parseNumber_(row.pemasukan); }, 0);
  const modalMasuk = rows.reduce(function(sum, row) { return sum + parseNumber_(row.modalMasuk); }, 0);
  const pemasukanTotal = pemasukanCair + modalMasuk;
  const pengeluaranUsaha = rows.reduce(function(sum, row) { return sum + parseNumber_(row.pengeluaranUsaha); }, 0);
  const pengambilanPemilik = rows.reduce(function(sum, row) { return sum + parseNumber_(row.pengambilanPemilik); }, 0);
  const pengeluaran = pengeluaranUsaha + pengambilanPemilik;
  const totalLabaPenjualan = rows.reduce(function(sum, row) { return sum + parseNumber_(row.totalLaba); }, 0);
  const labaSudahHC = rows.reduce(function(sum, row) { return sum + parseNumber_(row.labaSudahHC); }, 0);
  const labaBelumHC = rows.reduce(function(sum, row) { return sum + parseNumber_(row.labaBelumHC); }, 0);
  const labaDipindah = rows.reduce(function(sum, row) { return sum + parseNumber_(row.labaSudahLC); }, 0);
  const sisaLaba = rows.reduce(function(sum, row) { return sum + parseNumber_(row.sisaLaba); }, 0);
  const tagihanBelumHC = rows.reduce(function(sum, row) {
    return sum + (row.hc ? 0 : parseNumber_(row.penjualan));
  }, 0);
  const saldo = saldoAwal + pemasukanTotal - pengeluaran;

  return {
    penjualan: totalPenjualan,
    pemasukan: pemasukanCair,
    pemasukanCair: pemasukanCair,
    modalMasuk: modalMasuk,
    pemasukanTotal: pemasukanTotal,
    pengeluaranUsaha: pengeluaranUsaha,
    pengambilanPemilik: pengambilanPemilik,
    pengeluaran: pengeluaran,
    saldoAwal: saldoAwal,
    saldo: saldo,
    totalLabaPenjualan: totalLabaPenjualan,
    labaTotal: totalLabaPenjualan,
    labaSudahHC: labaSudahHC,
    labaBelumHC: labaBelumHC,
    // Alias lama: labaMasuk sekarang berarti laba yang sudah H.C.
    labaMasuk: labaSudahHC,
    labaDipindah: labaDipindah,
    sisaLaba: sisaLaba,
    tagihanBelumHC: tagihanBelumHC,
    rows: rows
  };
}

function apiGetNotaHistory_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.NOTA_PENJUALAN);
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const cashflowSh = ss.getSheetByName(CABE_SHEETS.CASHFLOW);
  const cashflowRows = cashflowSh ? cashflowSh.getRange('A6:I36').getValues() : [];
  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, CABE_HEADERS[CABE_SHEETS.NOTA_PENJUALAN].length).getValues();

  return values
    .filter(function(row) { return row[0]; })
    .map(function(row) {
      const startDate = parseDateInput_(row[1]);
      const endDate = parseDateInput_(row[2] || row[1]);
      const storedStatus = String(row[4] || '').trim().toUpperCase();
      let hc = storedStatus === 'SUDAH H.C' || storedStatus === 'SUDAH HC' || storedStatus === 'TRUE' || row[4] === true;

      if (startDate && endDate && cashflowRows.length) {
        const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
        const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
        const matched = cashflowRows.filter(function(cashRow) {
          const date = parseDateInput_(cashRow[0]);
          if (!date) return false;
          const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
          return time >= startTime && time <= endTime;
        });
        if (matched.length) hc = matched.every(function(cashRow) { return cashRow[7] === true; });
      }

      return {
        noNota: String(row[0] || ''),
        tanggalAwal: formatDateApi_(row[1]),
        tanggalAkhir: formatDateApi_(row[2] || row[1]),
        tanggalLabel: formatNotaHistoryRange_(row[1], row[2] || row[1]),
        total: parseNumber_(row[3]),
        hc: hc,
        fileUrl: String(row[6] || ''),
        createdAt: formatDateTimeApi_(row[8]),
        sortTime: row[8] instanceof Date
          ? row[8].getTime()
          : ((endDate || startDate) ? (endDate || startDate).getTime() : 0)
      };
    })
    .sort(function(a, b) { return b.sortTime - a.sortTime; })
    .map(function(item) {
      delete item.sortTime;
      return item;
    });
}

function formatNotaHistoryRange_(startValue, endValue) {
  const startDate = parseDateInput_(startValue);
  const endDate = parseDateInput_(endValue || startValue);
  if (!startDate || !endDate) return '';

  const startDay = Number(Utilities.formatDate(startDate, CABE_TZ, 'd'));
  const endDay = Number(Utilities.formatDate(endDate, CABE_TZ, 'd'));
  const sameMonth = Utilities.formatDate(startDate, CABE_TZ, 'yyyyMM') === Utilities.formatDate(endDate, CABE_TZ, 'yyyyMM');

  if (sameMonth) {
    return startDay + ' - ' + endDay + ' ' + Utilities.formatDate(endDate, CABE_TZ, 'MMM yyyy');
  }
  return Utilities.formatDate(startDate, CABE_TZ, 'd MMM yyyy') + ' - ' + Utilities.formatDate(endDate, CABE_TZ, 'd MMM yyyy');
}

function apiUpdateNotaHC_(ss, payload) {
  const noNota = String(payload.noNota || payload.nota || '').trim();
  if (!noNota) throw new Error('Nomor nota wajib dipilih.');

  const notaSh = ss.getSheetByName(CABE_SHEETS.NOTA_PENJUALAN);
  if (!notaSh) throw new Error('Sheet NOTA PENJUALAN tidak ditemukan.');

  const last = notaSh.getLastRow();
  if (last < CABE_START_ROW) throw new Error('Riwayat nota belum tersedia.');

  const notaValues = notaSh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 3).getValues();
  let notaRow = 0;
  let startDate = null;
  let endDate = null;

  for (let i = 0; i < notaValues.length; i++) {
    if (String(notaValues[i][0] || '').trim() === noNota) {
      notaRow = CABE_START_ROW + i;
      startDate = parseDateInput_(notaValues[i][1]);
      endDate = parseDateInput_(notaValues[i][2] || notaValues[i][1]);
      break;
    }
  }

  if (!notaRow) throw new Error('Nomor nota tidak ditemukan: ' + noNota);
  if (!startDate || !endDate) throw new Error('Periode nota tidak valid.');
  assertFinanceDateOpen_(ss, endDate, 'Perubahan H.C nota');

  const checked = parseBooleanApi_(payload.checked);
  const cashflowSh = ss.getSheetByName(CABE_SHEETS.CASHFLOW);
  if (!cashflowSh) throw new Error('Sheet CASHFLOW BISNIS tidak ditemukan.');

  const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
  const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  const cashflowValues = cashflowSh.getRange('A6:I36').getValues();
  const hcValues = cashflowValues.map(function(row) { return [row[7] === true]; });
  let updatedCount = 0;

  cashflowValues.forEach(function(row, index) {
    const date = parseDateInput_(row[0]);
    if (!date) return;
    const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    if (time < startTime || time > endTime) return;
    hcValues[index][0] = checked;
    updatedCount++;
  });

  if (!updatedCount) {
    throw new Error('Tanggal nota tidak ditemukan pada Cashflow bulan aktif.');
  }

  cashflowSh.getRange(6, 8, hcValues.length, 1).setValues(hcValues);
  notaSh.getRange(notaRow, 5).setValue(checked ? 'SUDAH H.C' : 'BELUM H.C');
  notaSh.getRange(notaRow, 10).setValue(new Date());
  SpreadsheetApp.flush();

  buildDashboard_(ss);
  clearCABEBootstrapCache_();

  return {
    message: checked
      ? 'H.C nota dicentang untuk ' + updatedCount + ' tanggal.'
      : 'H.C nota dibatalkan untuk ' + updatedCount + ' tanggal.',
    noNota: noNota,
    checked: checked,
    updatedDates: updatedCount,
    tanggalAwal: formatDateApi_(startDate),
    tanggalAkhir: formatDateApi_(endDate)
  };
}



/***********************
 * KONTROL KEUANGAN V21
 ***********************/
function ensureFinanceControlSheets_(ss) {
  [CABE_SHEETS.MUTASI_MODAL, CABE_SHEETS.REKONSILIASI_BANK, CABE_SHEETS.TUTUP_PERIODE].forEach(function(name) {
    if (!ss.getSheetByName(name)) prepareSheet_(ss, name, false);
  });
}

function getSetupValue_(ss, key, fallback) {
  const sh = ss.getSheetByName(CABE_SHEETS.SETUP);
  if (!sh || sh.getLastRow() < CABE_START_ROW) return fallback;
  const values = sh.getRange(CABE_START_ROW, 1, sh.getLastRow() - CABE_START_ROW + 1, 2).getValues();
  const target = normalize_(key);
  for (let i = 0; i < values.length; i++) {
    if (normalize_(values[i][0]) === target) return values[i][1] === '' ? fallback : values[i][1];
  }
  return fallback;
}

function setSetupValue_(ss, key, value, note) {
  const sh = ss.getSheetByName(CABE_SHEETS.SETUP) || prepareSheet_(ss, CABE_SHEETS.SETUP, false);
  const last = sh.getLastRow();
  let row = 0;
  if (last >= CABE_START_ROW) {
    const keys = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 1).getDisplayValues();
    for (let i = 0; i < keys.length; i++) {
      if (normalize_(keys[i][0]) === normalize_(key)) { row = CABE_START_ROW + i; break; }
    }
  }
  if (!row) row = getNextEmptyRow_(sh, CABE_START_ROW, 1);
  sh.getRange(row, 1, 1, 3).setValues([[key, value, note || 'Pengaturan dari Web/PWA']]);
}

function getActiveCashflowPeriod_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.CASHFLOW);
  const now = new Date();
  const year = sh ? (parseNumber_(sh.getRange('B3').getValue()) || now.getFullYear()) : now.getFullYear();
  const month = sh ? (parseNumber_(sh.getRange('D3').getValue()) || (now.getMonth() + 1)) : (now.getMonth() + 1);
  const period = String(year) + '-' + String(month).padStart(2, '0');
  return { year: year, month: month, period: period, label: formatPeriodLabel_(period) };
}

function parsePeriod_(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || month < 1 || month > 12) return null;
  return {
    year: year,
    month: month,
    period: String(year) + '-' + String(month).padStart(2, '0'),
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 0, 23, 59, 59, 999)
  };
}

function formatPeriodLabel_(period) {
  const parsed = parsePeriod_(period);
  if (!parsed) return String(period || '');
  return Utilities.formatDate(parsed.start, CABE_TZ, 'MMMM yyyy');
}

function dateInPeriod_(value, parsedPeriod) {
  const date = parseDateInput_(value);
  if (!date || !parsedPeriod) return false;
  return date >= parsedPeriod.start && date <= parsedPeriod.end;
}

function getCapitalMovementMapByDate_(ss) {
  ensureFinanceControlSheets_(ss);
  const sh = ss.getSheetByName(CABE_SHEETS.MUTASI_MODAL);
  const map = {};
  if (!sh || sh.getLastRow() < CABE_START_ROW) return map;
  const values = sh.getRange(CABE_START_ROW, 1, sh.getLastRow() - CABE_START_ROW + 1, 8).getValues();
  values.forEach(function(row) {
    const key = formatCashflowKey_(row[1]);
    if (!key) return;
    if (!map[key]) map[key] = { modalMasuk: 0, prive: 0, pengambilanLaba: 0 };
    const type = normalize_(row[2]);
    const amount = parseNumber_(row[3]);
    if (type === 'tambahan modal') map[key].modalMasuk += amount;
    if (type === 'prive pemilik') map[key].prive += amount;
    if (type === 'pengambilan laba') map[key].pengambilanLaba += amount;
  });
  return map;
}

function getCapitalMovementHistory_(ss, limit) {
  ensureFinanceControlSheets_(ss);
  const sh = ss.getSheetByName(CABE_SHEETS.MUTASI_MODAL);
  if (!sh || sh.getLastRow() < CABE_START_ROW) return [];
  const values = sh.getRange(CABE_START_ROW, 1, sh.getLastRow() - CABE_START_ROW + 1, 8).getValues();
  return values.filter(function(row) { return row[0] && row[1] && row[2] && parseNumber_(row[3]) > 0; })
    .map(function(row) {
      const date = parseDateInput_(row[1]);
      return { id:String(row[0]), tanggal:formatDateApi_(date), tanggalIso:date ? Utilities.formatDate(date,CABE_TZ,'yyyy-MM-dd') : '', tanggalRaw:date, jenis:String(row[2]), jumlah:parseNumber_(row[3]), metode:String(row[4] || ''), keterangan:String(row[5] || '') };
    })
    .sort(function(a,b){ return (b.tanggalRaw ? b.tanggalRaw.getTime() : 0) - (a.tanggalRaw ? a.tanggalRaw.getTime() : 0); })
    .slice(0, limit || 100)
    .map(function(item){ delete item.tanggalRaw; return item; });
}

function getReconciliationHistory_(ss, limit) {
  ensureFinanceControlSheets_(ss);
  const sh = ss.getSheetByName(CABE_SHEETS.REKONSILIASI_BANK);
  if (!sh || sh.getLastRow() < CABE_START_ROW) return [];
  const values = sh.getRange(CABE_START_ROW, 1, sh.getLastRow() - CABE_START_ROW + 1, 8).getValues();
  return values.filter(function(row){ return row[0] && row[1]; })
    .map(function(row){
      const date = parseDateInput_(row[1]);
      const createdAt = row[6] instanceof Date ? row[6] : date;
      return { id:String(row[0]), tanggal:formatDateApi_(date), tanggalIso:date ? Utilities.formatDate(date,CABE_TZ,'yyyy-MM-dd'):'', tanggalRaw:date, createdRaw:createdAt, saldoSystem:parseNumber_(row[2]), saldoBankAktual:parseNumber_(row[3]), selisih:parseNumber_(row[4]), keterangan:String(row[5]||'') };
    })
    .sort(function(a,b){ return (b.createdRaw ? b.createdRaw.getTime() : 0) - (a.createdRaw ? a.createdRaw.getTime() : 0); })
    .slice(0, limit || 100)
    .map(function(item){ delete item.tanggalRaw; delete item.createdRaw; return item; });
}

function getCloseHistory_(ss, limit) {
  ensureFinanceControlSheets_(ss);
  const sh = ss.getSheetByName(CABE_SHEETS.TUTUP_PERIODE);
  if (!sh || sh.getLastRow() < CABE_START_ROW) return [];
  const width = CABE_HEADERS[CABE_SHEETS.TUTUP_PERIODE].length;
  const values = sh.getRange(CABE_START_ROW, 1, sh.getLastRow() - CABE_START_ROW + 1, width).getValues();
  return values.filter(function(row){ return row[0] && row[1]; })
    .map(function(row){ return {
      id:String(row[0]), period:String(row[1]), label:formatPeriodLabel_(row[1]), tanggalTutup:formatDateTimeApi_(row[2]),
      saldoSystem:parseNumber_(row[3]), saldoBankAktual:parseNumber_(row[4]), selisih:parseNumber_(row[5]), status:String(row[19] || 'DITUTUP')
    }; })
    .sort(function(a,b){ return String(b.period).localeCompare(String(a.period)); })
    .slice(0, limit || 100);
}

function getClosedPeriodRecord_(ss, period) {
  ensureFinanceControlSheets_(ss);
  const sh = ss.getSheetByName(CABE_SHEETS.TUTUP_PERIODE);
  if (!sh || sh.getLastRow() < CABE_START_ROW) return null;
  const width = CABE_HEADERS[CABE_SHEETS.TUTUP_PERIODE].length;
  const values = sh.getRange(CABE_START_ROW, 1, sh.getLastRow() - CABE_START_ROW + 1, width).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (String(values[i][1] || '') === period && normalize_(values[i][19]) === 'ditutup') return { row:CABE_START_ROW+i, values:values[i] };
  }
  return null;
}

function getLatestClosedEndDate_(ss) {
  const history = getCloseHistory_(ss, 500).filter(function(item){ return normalize_(item.status) === 'ditutup'; });
  let latest = null;
  history.forEach(function(item){
    const parsed = parsePeriod_(item.period);
    if (parsed && (!latest || parsed.end > latest)) latest = parsed.end;
  });
  return latest;
}

function assertFinanceDateOpen_(ss, value, actionLabel) {
  const date = parseDateInput_(value);
  if (!date) return;
  const closedEnd = getLatestClosedEndDate_(ss);
  if (!closedEnd) return;
  const check = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const end = new Date(closedEnd.getFullYear(), closedEnd.getMonth(), closedEnd.getDate()).getTime();
  if (check <= end) throw new Error((actionLabel || 'Transaksi') + ' ditolak karena periode sampai ' + formatDateApi_(closedEnd) + ' sudah ditutup.');
}

function getPriorityDebt_(hutangRows) {
  const today = todayDate_();
  const horizon = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59, 59, 999);
  return (hutangRows || []).reduce(function(sum, item){
    const remaining = parseNumber_(item.sisaHutang);
    if (remaining <= 0) return sum;
    const due = parseDateInput_(item.jatuhTempo);
    if (!due || due <= horizon || normalize_(item.status) === 'jatuh tempo') return sum + remaining;
    return sum;
  }, 0);
}

function apiGetFinanceControl_(ss, payload) {
  ensureFinanceControlSheets_(ss);
  payload = payload || {};
  const context = payload._context || {};
  const active = getActiveCashflowPeriod_(ss);
  const cashflow = context.cashflow || apiGetCashflow_(ss);
  const hutang = context.hutang || apiGetHutang_(ss);
  const stok = context.stok || apiGetStokBarang_(ss);
  const reconciliations = getReconciliationHistory_(ss, 30);
  const currentReconciliation = reconciliations.find(function(item){ return String(item.tanggalIso || '').slice(0,7) === active.period; }) || null;
  const modalMinimum = parseNumber_(getSetupValue_(ss, 'MODAL_STOK_MINIMUM', 0));
  const batasPiutangHari = Math.max(1, parseNumber_(getSetupValue_(ss, 'BATAS_PIUTANG_HARI', 7)) || 7);
  const hutangPrioritas = getPriorityDebt_(hutang);
  const saldoBankAktual = currentReconciliation ? parseNumber_(currentReconciliation.saldoBankAktual) : null;
  const saldoSystem = parseNumber_(cashflow.saldo);
  const todayIso = Utilities.formatDate(todayDate_(), CABE_TZ, 'yyyy-MM-dd');
  const rekonsiliasiFresh = Boolean(currentReconciliation && currentReconciliation.tanggalIso === todayIso);
  const saldoAcuan = rekonsiliasiFresh ? saldoBankAktual : saldoSystem;
  const sisaLaba = parseNumber_(cashflow.sisaLaba);
  // Demi keamanan, laba aman baru tersedia setelah saldo bank diperiksa pada hari yang sama.
  const labaAman = rekonsiliasiFresh ? Math.max(0, Math.min(sisaLaba, saldoAcuan - hutangPrioritas - modalMinimum)) : 0;
  const summary = {
    saldoSystem: saldoSystem,
    saldoBankAktual: saldoBankAktual,
    tanggalRekonsiliasi: currentReconciliation ? currentReconciliation.tanggal : '',
    tanggalRekonsiliasiIso: currentReconciliation ? currentReconciliation.tanggalIso : '',
    rekonsiliasiFresh: rekonsiliasiFresh,
    selisih: currentReconciliation ? parseNumber_(currentReconciliation.selisih) : 0,
    sisaLaba: sisaLaba,
    labaAmanDipindahkan: labaAman,
    hutangPrioritas: hutangPrioritas,
    modalMinimum: modalMinimum,
    batasPiutangHari: batasPiutangHari,
    saldoAcuanSource: rekonsiliasiFresh ? 'Saldo bank aktual hari ini' : (saldoBankAktual === null ? 'Rekonsiliasi saldo bank diperlukan' : 'Saldo bank perlu diperbarui hari ini')
  };
  return {
    activePeriod: active.period,
    activePeriodLabel: active.label,
    summary: summary,
    reconciliationHistory: reconciliations,
    capitalHistory: getCapitalMovementHistory_(ss, 100),
    closeHistory: getCloseHistory_(ss, 100),
    anomalies: getFinanceAnomalies_(ss, { active:active, cashflow:cashflow, hutang:hutang, stok:stok, summary:summary })
  };
}

function apiSaveBankReconciliation_(ss, payload) {
  ensureFinanceControlSheets_(ss);
  const tanggal = parseDateInput_(payload.tanggal) || todayDate_();
  if (tanggal > todayDate_()) throw new Error('Tanggal rekonsiliasi tidak boleh melebihi hari ini.');
  assertFinanceDateOpen_(ss, tanggal, 'Rekonsiliasi bank');
  const saldoBankRaw = payload.saldoBankAktual !== undefined ? payload.saldoBankAktual : (payload.saldoBank !== undefined ? payload.saldoBank : payload.balance);
  if (saldoBankRaw === undefined || saldoBankRaw === null || String(saldoBankRaw).trim() === '') throw new Error('Saldo bank aktual wajib diisi.');
  const saldoBank = parseNumber_(saldoBankRaw);
  if (saldoBank < 0) throw new Error('Saldo bank aktual tidak boleh kurang dari 0.');
  const cashflow = apiGetCashflow_(ss);
  const saldoSystem = parseNumber_(cashflow.saldo);
  const selisih = saldoBank - saldoSystem;
  const sh = ss.getSheetByName(CABE_SHEETS.REKONSILIASI_BANK);
  const row = getNextEmptyRow_(sh, CABE_START_ROW, 1);
  const now = new Date();
  const id = 'RB-' + Utilities.formatDate(now, CABE_TZ, 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().substring(0,6).toUpperCase();
  sh.getRange(row,1,1,8).setValues([[id,tanggal,saldoSystem,saldoBank,selisih,String(payload.keterangan||''),now,now]]);
  sh.getRange(row,2).setNumberFormat('dd/mm/yyyy');
  sh.getRange(row,3,1,3).setNumberFormat('"Rp"#,##0');
  quickAfterWrite_(ss);
  return { message:Math.abs(selisih)<1 ? 'Saldo bank cocok dengan sistem.' : 'Rekonsiliasi tersimpan. Ada selisih ' + formatRupiah_(selisih) + '.', saldoSystem:saldoSystem, saldoBankAktual:saldoBank, selisih:selisih };
}

function apiSaveFinanceSettings_(ss, payload) {
  const modalMinimum = parseNumber_(payload.modalMinimum || payload.modalStokMinimum);
  const batasPiutangHari = Math.round(parseNumber_(payload.batasPiutangHari || payload.receivableDays));
  if (modalMinimum < 0) throw new Error('Modal stok minimum tidak boleh kurang dari 0.');
  if (batasPiutangHari < 1 || batasPiutangHari > 365) throw new Error('Batas nota belum bayar harus 1 sampai 365 hari.');
  setSetupValue_(ss, 'MODAL_STOK_MINIMUM', modalMinimum, 'Cadangan belanja untuk laba aman dipindahkan');
  setSetupValue_(ss, 'BATAS_PIUTANG_HARI', batasPiutangHari, 'Batas hari nota belum H.C');
  quickAfterWrite_(ss);
  return { message:'Pengaturan keuangan tersimpan.', modalMinimum:modalMinimum, batasPiutangHari:batasPiutangHari };
}

function apiAddCapitalMovement_(ss, payload) {
  ensureFinanceControlSheets_(ss);
  const tanggal = parseDateInput_(payload.tanggal) || todayDate_();
  assertFinanceDateOpen_(ss, tanggal, 'Mutasi modal/pemilik');
  const jenis = String(payload.jenis || '').trim().toUpperCase();
  const allowed = ['TAMBAHAN MODAL','PRIVE PEMILIK','PENGAMBILAN LABA'];
  if (allowed.indexOf(jenis) < 0) throw new Error('Jenis mutasi tidak valid.');
  const jumlah = parseNumber_(payload.jumlah);
  if (jumlah <= 0) throw new Error('Jumlah mutasi wajib lebih dari 0.');
  if (jenis === 'PENGAMBILAN LABA') {
    const finance = apiGetFinanceControl_(ss, {});
    const safeProfit = parseNumber_(finance.summary && finance.summary.labaAmanDipindahkan);
    if (jumlah > safeProfit + 0.001) throw new Error('Pengambilan laba melebihi laba aman. Maksimal saat ini ' + formatRupiah_(safeProfit) + '. Gunakan Prive Pemilik jika tetap ingin menarik dana di luar laba aman.');
  }
  const metode = String(payload.metode || payload.metodeBayar || 'TRANSFER').trim().toUpperCase();
  const sh = ss.getSheetByName(CABE_SHEETS.MUTASI_MODAL);
  const row = getNextEmptyRow_(sh, CABE_START_ROW, 1);
  const now = new Date();
  const id = 'MM-' + Utilities.formatDate(now,CABE_TZ,'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().substring(0,6).toUpperCase();
  sh.getRange(row,1,1,8).setValues([[id,tanggal,jenis,jumlah,metode,String(payload.keterangan||''),now,now]]);
  sh.getRange(row,2).setNumberFormat('dd/mm/yyyy');
  sh.getRange(row,4).setNumberFormat('"Rp"#,##0');
  buildCashflowBisnis_(ss);
  buildDashboard_(ss);
  quickAfterWrite_(ss);
  return { message:'Mutasi tersimpan: ' + jenis + ' ' + formatRupiah_(jumlah), id:id };
}

function sumSheetByPeriod_(ss, sheetName, dateColIndex, amountCols, period) {
  const sh = ss.getSheetByName(sheetName);
  const result = {};
  amountCols.forEach(function(col){ result[col.key] = 0; });
  if (!sh || sh.getLastRow() < CABE_START_ROW) return result;
  const width = Math.max.apply(null, [dateColIndex].concat(amountCols.map(function(c){return c.index;})));
  const rows = sh.getRange(CABE_START_ROW,1,sh.getLastRow()-CABE_START_ROW+1,width).getValues();
  rows.forEach(function(row){
    if (!dateInPeriod_(row[dateColIndex-1], period)) return;
    amountCols.forEach(function(col){ result[col.key] += parseNumber_(row[col.index-1]); });
  });
  return result;
}

function apiGetMonthlyReport_(ss, payload) {
  ensureFinanceControlSheets_(ss);
  payload = payload || {};
  const context = payload._context || {};
  const active = getActiveCashflowPeriod_(ss);
  const period = parsePeriod_((payload && (payload.period || payload.periode)) || active.period);
  if (!period) throw new Error('Periode laporan tidak valid.');
  const closed = getClosedPeriodRecord_(ss, period.period);
  if (closed) {
    const r = closed.values;
    return {
      period:period.period, label:formatPeriodLabel_(period.period), source:'Snapshot periode tertutup',
      penjualan:parseNumber_(r[6]), hpp:parseNumber_(r[7]), labaKotor:parseNumber_(r[8]), pengeluaranUsaha:parseNumber_(r[9]), labaBersih:parseNumber_(r[10]),
      pemasukanKas:parseNumber_(r[11]), uangKeluar:parseNumber_(r[12]), saldo:parseNumber_(r[4]), nilaiStokAkhir:parseNumber_(r[13]), piutang:parseNumber_(r[14]), hutang:parseNumber_(r[15]),
      tambahanModal:parseNumber_(r[16]), pengambilanPemilik:parseNumber_(r[17]), mutasiPemilikBersih:parseNumber_(r[16])-parseNumber_(r[17]),
      note:'Snapshot permanen disimpan saat periode ditutup pada ' + formatDateTimeApi_(r[2]) + '.'
    };
  }

  const sales = sumSheetByPeriod_(ss, CABE_SHEETS.BARANG_TERJUAL, 2, [
    {key:'penjualan',index:12},{key:'hpp',index:10},{key:'laba',index:11}
  ], period);
  const expense = sumSheetByPeriod_(ss, CABE_SHEETS.PENGELUARAN, 2, [{key:'jumlah',index:4}], period);
  let tambahanModal = 0;
  let pengambilanPemilik = 0;
  const movementRows = getCapitalMovementHistory_(ss, 10000);
  movementRows.forEach(function(item){
    if (!dateInPeriod_(item.tanggalIso || item.tanggal, period)) return;
    if (normalize_(item.jenis) === 'tambahan modal') tambahanModal += parseNumber_(item.jumlah);
    else pengambilanPemilik += parseNumber_(item.jumlah);
  });

  const isActive = period.period === active.period;
  const cashflow = isActive ? (context.cashflow || apiGetCashflow_(ss)) : null;
  const stok = isActive ? (context.stok || apiGetStokBarang_(ss)) : [];
  const hutang = isActive ? (context.hutang || apiGetHutang_(ss)) : [];
  const reconciliations = getReconciliationHistory_(ss, 1000);
  const rec = reconciliations.find(function(item){ return String(item.tanggalIso||'').slice(0,7) === period.period; });
  const stockValue = stok.reduce(function(sum,item){ return sum + parseNumber_(item.nilaiStok); },0);
  const debtValue = hutang.reduce(function(sum,item){ return sum + parseNumber_(item.sisaHutang); },0);
  const saldo = rec ? parseNumber_(rec.saldoBankAktual) : (cashflow ? parseNumber_(cashflow.saldo) : 0);
  return {
    period:period.period, label:formatPeriodLabel_(period.period), source:isActive ? (rec ? 'Periode aktif · saldo bank aktual' : 'Periode aktif · saldo sistem') : 'Transaksi historis (kas/H.C belum ditutup)',
    penjualan:parseNumber_(sales.penjualan), hpp:parseNumber_(sales.hpp), labaKotor:parseNumber_(sales.laba),
    pengeluaranUsaha:parseNumber_(expense.jumlah), labaBersih:parseNumber_(sales.laba)-parseNumber_(expense.jumlah),
    pemasukanKas:cashflow ? parseNumber_(cashflow.pemasukanTotal) : 0,
    uangKeluar:cashflow ? parseNumber_(cashflow.pengeluaran) : 0,
    saldo:saldo, nilaiStokAkhir:stockValue,
    piutang:cashflow ? parseNumber_(cashflow.tagihanBelumHC) : 0,
    hutang:debtValue, tambahanModal:tambahanModal, pengambilanPemilik:pengambilanPemilik,
    mutasiPemilikBersih:tambahanModal-pengambilanPemilik,
    note:isActive ? 'Data aktif akan menjadi snapshot permanen setelah Tutup Periode.' : 'Untuk kas, piutang, stok akhir, dan hutang historis yang pasti, gunakan snapshot Tutup Periode.'
  };
}

function apiClosePeriod_(ss, payload) {
  ensureFinanceControlSheets_(ss);
  if (!parseBooleanApi_(payload.confirmed)) throw new Error('Konfirmasi penutupan periode wajib dicentang.');
  const active = getActiveCashflowPeriod_(ss);
  const period = parsePeriod_(payload.periode || payload.period || active.period);
  if (!period) throw new Error('Periode tidak valid.');
  if (period.period !== active.period) throw new Error('Hanya periode aktif ' + active.label + ' yang dapat ditutup.');
  if (getClosedPeriodRecord_(ss, period.period)) throw new Error('Periode ' + formatPeriodLabel_(period.period) + ' sudah ditutup.');
  const saldoBankRaw = payload.saldoBankAktual !== undefined ? payload.saldoBankAktual : payload.saldoBank;
  if (saldoBankRaw === undefined || saldoBankRaw === null || String(saldoBankRaw).trim() === '') throw new Error('Saldo bank akhir wajib diisi.');
  const saldoBank = parseNumber_(saldoBankRaw);
  if (saldoBank < 0) throw new Error('Saldo bank akhir tidak boleh kurang dari 0.');
  const report = apiGetMonthlyReport_(ss, {period:period.period});
  const cashflow = apiGetCashflow_(ss);
  const saldoSystem = parseNumber_(cashflow.saldo);
  const selisih = saldoBank - saldoSystem;
  const sh = ss.getSheetByName(CABE_SHEETS.TUTUP_PERIODE);
  const row = getNextEmptyRow_(sh,CABE_START_ROW,1);
  const now = new Date();
  const id = 'TP-' + period.period.replace('-','') + '-' + Utilities.formatDate(now,CABE_TZ,'HHmmss');
  sh.getRange(row,1,1,21).setValues([[
    id,period.period,now,saldoSystem,saldoBank,selisih,report.penjualan,report.hpp,report.labaKotor,report.pengeluaranUsaha,report.labaBersih,
    report.pemasukanKas,report.uangKeluar,report.nilaiStokAkhir,report.piutang,report.hutang,report.tambahanModal,report.pengambilanPemilik,
    String(payload.catatan||''),'DITUTUP',now
  ]]);
  sh.getRange(row,3).setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange(row,4,1,15).setNumberFormat('"Rp"#,##0');

  // Simpan rekonsiliasi penutupan juga agar jejak saldo bank lengkap.
  const recSh = ss.getSheetByName(CABE_SHEETS.REKONSILIASI_BANK);
  const recRow = getNextEmptyRow_(recSh,CABE_START_ROW,1);
  const recId = 'RB-CLOSE-' + Utilities.formatDate(now,CABE_TZ,'yyyyMMdd-HHmmss');
  recSh.getRange(recRow,1,1,8).setValues([[recId,period.end,saldoSystem,saldoBank,selisih,'Rekonsiliasi otomatis saat tutup periode',now,now]]);
  recSh.getRange(recRow,2).setNumberFormat('dd/mm/yyyy');
  recSh.getRange(recRow,3,1,3).setNumberFormat('"Rp"#,##0');

  // Buka bulan berikutnya dengan saldo bank aktual sebagai saldo awal.
  const next = new Date(period.year, period.month, 1);
  const cashSh = ss.getSheetByName(CABE_SHEETS.CASHFLOW);
  cashSh.getRange('B3').setValue(next.getFullYear());
  cashSh.getRange('D3').setValue(next.getMonth()+1);
  cashSh.getRange('G3').setValue(saldoBank);
  cashSh.getRange('H6:I36').setValues(Array.from({length:31},function(){return [false,false];}));
  SpreadsheetApp.flush();
  buildDashboard_(ss);
  clearCABEBootstrapCache_();
  return { message:'Periode ' + formatPeriodLabel_(period.period) + ' ditutup. Periode baru ' + Utilities.formatDate(next,CABE_TZ,'MMMM yyyy') + ' sudah dibuka.', period:period.period, nextPeriod:Utilities.formatDate(next,CABE_TZ,'yyyy-MM'), saldoAwalBaru:saldoBank };
}

function getFinanceAnomalies_(ss, context) {
  context = context || {};
  const anomalies = [];
  const stok = context.stok || apiGetStokBarang_(ss);
  const hutang = context.hutang || apiGetHutang_(ss);
  const summary = context.summary || {};
  const active = context.active || getActiveCashflowPeriod_(ss);
  const batasPiutangHari = parseNumber_(summary.batasPiutangHari || 7);
  const today = todayDate_();

  stok.forEach(function(item){
    if (parseNumber_(item.stok) < 0) anomalies.push({level:'critical',code:'NEGATIVE_STOCK',title:'Stok negatif: ' + item.nama,message:'Stok tercatat ' + formatQty_(item.stok) + ' ' + (item.satuan||'Kg') + '. Periksa penjualan atau koreksi transaksi.'});
    else if (String(item.status||'').toUpperCase() !== 'AMAN') anomalies.push({level:'warning',code:'LOW_STOCK',title:'Stok perlu dicek: ' + item.nama,message:'Stok ' + formatQty_(item.stok) + ' ' + (item.satuan||'Kg') + ', minimum ' + formatQty_(item.minimum) + '.'});
  });

  hutang.forEach(function(item){
    if (parseNumber_(item.totalBayar) > parseNumber_(item.totalHutang) + 0.001 || parseNumber_(item.sisaHutang) < -0.001) anomalies.push({level:'critical',code:'OVERPAID_DEBT',title:'Pembayaran hutang berlebih',message:'Nota ' + item.noNota + ' memiliki pembayaran melebihi total hutang.'});
    const due = parseDateInput_(item.jatuhTempo);
    if (parseNumber_(item.sisaHutang) > 0 && due && due < today) anomalies.push({level:'critical',code:'OVERDUE_DEBT',title:'Hutang jatuh tempo',message:'Nota ' + item.noNota + ' · ' + item.supplier + ' masih tersisa ' + formatRupiah_(item.sisaHutang) + '.'});
  });

  if (summary.saldoBankAktual === null || summary.saldoBankAktual === undefined) anomalies.push({level:'info',code:'NO_RECONCILIATION',title:'Saldo bank belum direkonsiliasi',message:'Masukkan saldo rekening aktual untuk periode ' + active.label + '.'});
  else if (!summary.rekonsiliasiFresh) anomalies.push({level:'warning',code:'STALE_RECONCILIATION',title:'Saldo bank perlu diperbarui hari ini',message:'Pemeriksaan terakhir ' + (summary.tanggalRekonsiliasi || '-') + '. Laba aman ditahan Rp0 sampai saldo bank dicek ulang.'});
  else if (Math.abs(parseNumber_(summary.selisih)) >= 1) anomalies.push({level:'critical',code:'BALANCE_MISMATCH',title:'Saldo bank berbeda dengan sistem',message:'Selisih saat ini ' + formatRupiah_(summary.selisih) + '. Cari transaksi yang belum tercatat.'});

  const movementRows = getCapitalMovementHistory_(ss, 10000);
  const actualProfitWithdrawal = movementRows.reduce(function(sum, item) {
    if (normalize_(item.jenis) !== 'pengambilan laba' || !dateInPeriod_(item.tanggalIso || item.tanggal, parsePeriod_(active.period))) return sum;
    return sum + parseNumber_(item.jumlah);
  }, 0);
  const markedProfitMoved = parseNumber_((context.cashflow || {}).labaDipindah);
  if (Math.abs(actualProfitWithdrawal - markedProfitMoved) >= 1) {
    const message = actualProfitWithdrawal > markedProfitMoved
      ? 'Pengambilan laba di bank ' + formatRupiah_(actualProfitWithdrawal) + ', tetapi laba bertanda L.C baru ' + formatRupiah_(markedProfitMoved) + '.'
      : 'Laba bertanda L.C ' + formatRupiah_(markedProfitMoved) + ', tetapi mutasi Pengambilan Laba baru ' + formatRupiah_(actualProfitWithdrawal) + '.';
    anomalies.push({level:'warning',code:'PROFIT_TRANSFER_MISMATCH',title:'Status L.C dan pengambilan laba belum cocok',message:message});
  }

  const nota = apiGetNotaHistory_(ss);
  nota.forEach(function(item){
    if (item.hc) return;
    const end = parseDateInput_(item.tanggalAkhir);
    if (!end) return;
    const age = Math.floor((today.getTime() - end.getTime()) / 86400000);
    if (age > batasPiutangHari) anomalies.push({level:'warning',code:'RECEIVABLE_AGE',title:'Nota belum H.C lebih dari ' + batasPiutangHari + ' hari',message:item.noNota + ' · periode ' + item.tanggalLabel + ' · umur ' + age + ' hari.'});
  });

  const salesSh = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  if (salesSh && salesSh.getLastRow() >= CABE_START_ROW) {
    const rows = salesSh.getRange(CABE_START_ROW,1,salesSh.getLastRow()-CABE_START_ROW+1,17).getValues();
    rows.forEach(function(row){
      if (!row[0]) return;
      const hpp = parseNumber_(row[6]);
      const sell = parseNumber_(row[8]);
      if (sell + 0.001 < hpp) anomalies.push({level:'critical',code:'SELL_BELOW_HPP',title:'Harga jual di bawah HPP',message:formatDateApi_(row[1]) + ' · ' + row[3] + ' dijual ' + formatRupiah_(sell) + '/Kg, HPP ' + formatRupiah_(hpp) + '/Kg.'});
    });
  }
  return anomalies.slice(0,80);
}

function apiGetTransactionSummary_(ss) {
  const masuk = apiGetRecentBarangMasuk_(ss, 5);
  const keluar = apiGetRecentBarangTerjual_(ss, 5);
  const hargaLabaTerakhir = apiGetLatestSalePrices_(ss);

  return {
    masuk: masuk,
    keluar: keluar,
    hargaLabaTerakhir: hargaLabaTerakhir,
    lastInputDate: masuk.length ? masuk[0].tanggal : '',
    lastSellDate: keluar.length ? keluar[0].tanggal : ''
  };
}

function apiGetRecentBarangMasuk_(ss, limit) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, CABE_HEADERS[CABE_SHEETS.BARANG_MASUK].length).getValues();
  return values.map((row, index) => ({
      rowIndex: CABE_START_ROW + index,
      tanggalRaw: row[1],
      tanggal: formatDateApi_(row[1]),
      kode: row[2] || '',
      nama: row[3] || '',
      qty: parseNumber_(row[4]),
      satuan: row[5] || 'Kg',
      harga: parseNumber_(row[6]),
      total: parseNumber_(row[7]),
      supplier: row[8] || '',
      noNota: row[9] || '',
      statusBayar: row[10] || ''
    }))
    .filter(item => item.tanggalRaw instanceof Date && item.nama && item.qty > 0)
    .sort((a, b) => b.tanggalRaw - a.tanggalRaw || b.rowIndex - a.rowIndex)
    .slice(0, limit || 5)
    .map(item => ({
      tanggal: item.tanggal,
      kode: item.kode,
      nama: item.nama,
      qty: item.qty,
      satuan: item.satuan,
      harga: item.harga,
      total: item.total || item.qty * item.harga,
      supplier: item.supplier,
      noNota: item.noNota,
      statusBayar: item.statusBayar
    }));
}

function apiGetRecentBarangTerjual_(ss, limit) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, CABE_HEADERS[CABE_SHEETS.BARANG_TERJUAL].length).getValues();
  return values.map((row, index) => ({
      rowIndex: CABE_START_ROW + index,
      tanggalRaw: row[1],
      tanggal: formatDateApi_(row[1]),
      kode: row[2] || '',
      nama: row[3] || '',
      qty: parseNumber_(row[4]),
      satuan: row[5] || 'Kg',
      hpp: parseNumber_(row[6]),
      laba: parseNumber_(row[7]),
      harga: parseNumber_(row[8]),
      total: parseNumber_(row[11]),
      keterangan: row[14] || ''
    }))
    .filter(item => item.tanggalRaw instanceof Date && item.nama && item.qty > 0)
    .sort((a, b) => b.tanggalRaw - a.tanggalRaw || b.rowIndex - a.rowIndex)
    .slice(0, limit || 5)
    .map(item => ({
      tanggal: item.tanggal,
      kode: item.kode,
      nama: item.nama,
      qty: item.qty,
      satuan: item.satuan,
      hpp: item.hpp,
      laba: item.laba,
      harga: item.harga,
      total: item.total || item.qty * item.harga,
      keterangan: item.keterangan
    }));
}

function apiGetLatestSalePrices_(ss, limit) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const values = sh.getRange(
    CABE_START_ROW,
    1,
    last - CABE_START_ROW + 1,
    CABE_HEADERS[CABE_SHEETS.BARANG_TERJUAL].length
  ).getValues();

  const sorted = values.map((row, index) => ({
      rowIndex: CABE_START_ROW + index,
      tanggalRaw: row[1],
      tanggal: formatDateApi_(row[1]),
      kode: String(row[2] || '').trim(),
      nama: String(row[3] || '').trim(),
      hpp: parseNumber_(row[6]),
      laba: parseNumber_(row[7])
    }))
    .filter(item => item.tanggalRaw instanceof Date && item.nama)
    .sort((a, b) => b.tanggalRaw - a.tanggalRaw || b.rowIndex - a.rowIndex);

  const seen = {};
  const result = [];
  const max = Math.max(parseInt(limit, 10) || sorted.length, 1);

  for (let i = 0; i < sorted.length && result.length < max; i++) {
    const item = sorted[i];
    const key = normalize_(item.kode || item.nama);
    if (!key || seen[key]) continue;
    seen[key] = true;
    result.push({
      tanggal: item.tanggal,
      kode: item.kode,
      nama: item.nama,
      hpp: item.hpp,
      laba: item.laba
    });
  }

  return result;
}



/***********************
 * KOREKSI TRANSAKSI BERBASIS TANGGAL
 ***********************/
function normalizeCorrectionType_(value) {
  const type = String(value || '').trim().toUpperCase();
  if (type !== 'MASUK' && type !== 'TERJUAL') throw new Error('Jenis koreksi harus MASUK atau TERJUAL.');
  return type;
}

function dateKeyCorrection_(value) {
  const date = parseDateInput_(value);
  return date ? Utilities.formatDate(date, CABE_TZ, 'yyyy-MM-dd') : '';
}

function apiGetKoreksiTransaksi_(ss, payload) {
  payload = payload || {};
  const type = normalizeCorrectionType_(payload.type || payload.jenis);
  const tanggal = parseDateInput_(payload.tanggal || payload.date);
  if (!tanggal) throw new Error('Tanggal koreksi wajib dipilih.');

  const targetKey = dateKeyCorrection_(tanggal);
  const sheetName = type === 'MASUK' ? CABE_SHEETS.BARANG_MASUK : CABE_SHEETS.BARANG_TERJUAL;
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');

  const last = sh.getLastRow();
  const width = CABE_HEADERS[sheetName].length;
  const rows = last < CABE_START_ROW ? [] : sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, width).getValues();
  const result = [];

  rows.forEach(function(row) {
    if (!row[0] || dateKeyCorrection_(row[1]) !== targetKey) return;
    if (type === 'MASUK') {
      result.push({
        id: String(row[0] || '').trim(),
        tanggal: formatDateApi_(row[1]),
        kode: String(row[2] || '').trim(),
        nama: String(row[3] || '').trim(),
        qty: parseNumber_(row[4]),
        satuan: String(row[5] || 'Kg').trim(),
        harga: parseNumber_(row[6]),
        totalModal: parseNumber_(row[7]),
        supplier: String(row[8] || '').trim(),
        noNota: String(row[9] || '').trim(),
        statusBayar: String(row[10] || 'TUNAI').trim().toUpperCase(),
        jatuhTempo: formatDateApi_(row[11]),
        keterangan: String(row[12] || '').trim(),
        updatedAt: formatDateTimeApi_(row[14])
      });
    } else {
      result.push({
        id: String(row[0] || '').trim(),
        tanggal: formatDateApi_(row[1]),
        kode: String(row[2] || '').trim(),
        nama: String(row[3] || '').trim(),
        qty: parseNumber_(row[4]),
        satuan: String(row[5] || 'Kg').trim(),
        hpp: parseNumber_(row[6]),
        laba: parseNumber_(row[7]),
        hargaJual: parseNumber_(row[8]),
        totalHpp: parseNumber_(row[9]),
        totalLaba: parseNumber_(row[10]),
        totalJual: parseNumber_(row[11]),
        keterangan: String(row[14] || '').trim(),
        updatedAt: formatDateTimeApi_(row[16])
      });
    }
  });

  return {
    type: type,
    tanggal: targetKey,
    tanggalLabel: formatDateApi_(tanggal),
    rows: result,
    notaInfo: type === 'TERJUAL' ? getCorrectionNotaInfo_(ss, tanggal) : []
  };
}

function getCorrectionNotaInfo_(ss, tanggal) {
  const sh = ss.getSheetByName(CABE_SHEETS.NOTA_PENJUALAN);
  if (!sh || sh.getLastRow() < CABE_START_ROW) return [];
  const target = parseDateInput_(tanggal);
  if (!target) return [];
  target.setHours(0, 0, 0, 0);

  const values = sh.getRange(CABE_START_ROW, 1, sh.getLastRow() - CABE_START_ROW + 1, 10).getValues();
  return values.filter(function(row) {
    const start = parseDateInput_(row[1]);
    const end = parseDateInput_(row[2]);
    if (!row[0] || !start || !end) return false;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return target >= start && target <= end;
  }).map(function(row) {
    const hcText = normalize_(row[4]);
    const lcText = normalize_(row[5]);
    return {
      noNota: String(row[0] || '').trim(),
      hc: hcText === 'sudah h.c' || hcText === 'sudah hc' || hcText === 'true' || hcText === '1',
      lc: lcText === 'sudah l.c' || lcText === 'sudah lc' || lcText === 'true' || lcText === '1',
      tanggalAwal: formatDateApi_(row[1]),
      tanggalAkhir: formatDateApi_(row[2])
    };
  });
}

function apiSaveKoreksiTransaksi_(ss, payload) {
  payload = payload || {};
  const type = normalizeCorrectionType_(payload.type || payload.jenis);
  const targetDate = parseDateInput_(payload.tanggal || payload.date);
  const targetKey = dateKeyCorrection_(targetDate);
  const alasan = String(payload.alasan || payload.reason || '').trim();
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!targetDate) throw new Error('Tanggal koreksi wajib dipilih.');
  assertFinanceDateOpen_(ss, targetDate, 'Koreksi transaksi');
  if (!alasan) throw new Error('Alasan koreksi wajib diisi.');
  if (!items.length) throw new Error('Tidak ada data koreksi yang dikirim.');

  const sheetName = type === 'MASUK' ? CABE_SHEETS.BARANG_MASUK : CABE_SHEETS.BARANG_TERJUAL;
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet ' + sheetName + ' tidak ditemukan.');
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) throw new Error('Belum ada transaksi yang dapat dikoreksi.');

  const width = CABE_HEADERS[sheetName].length;
  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, width).getValues();
  const rowMap = {};
  values.forEach(function(row, index) {
    const id = String(row[0] || '').trim();
    if (id) rowMap[normalize_(id)] = { rowIndex: CABE_START_ROW + index, values: row };
  });

  const changes = [];
  items.forEach(function(item) {
    const id = String(item.id || item.ID || '').trim();
    const found = rowMap[normalize_(id)];
    if (!id || !found) throw new Error('Transaksi tidak ditemukan atau sudah berubah: ' + (id || '-'));
    if (dateKeyCorrection_(found.values[1]) !== targetKey) throw new Error('Tanggal transaksi ' + id + ' tidak sesuai tanggal koreksi. Muat ulang data.');

    const cancelled = parseBooleanApi_(item.cancelled || item.dibatalkan);
    const newQty = cancelled ? 0 : parseNumber_(item.qty);
    if (newQty < 0) throw new Error('Qty tidak boleh kurang dari 0 untuk ' + found.values[3] + '.');
    if (!cancelled && newQty <= 0) throw new Error('Qty harus lebih dari 0 untuk ' + found.values[3] + ', atau pilih Batalkan transaksi.');

    if (type === 'MASUK') {
      const oldData = {
        qty: parseNumber_(found.values[4]),
        harga: parseNumber_(found.values[6]),
        supplier: String(found.values[8] || '').trim(),
        statusBayar: String(found.values[10] || 'TUNAI').trim().toUpperCase(),
        keterangan: String(found.values[12] || '').trim(),
        noNota: String(found.values[9] || '').trim()
      };
      const newData = {
        qty: newQty,
        harga: parseNumber_(item.harga),
        supplier: String(item.supplier || '').trim(),
        statusBayar: normalizeStatusBayarApi_({ statusBayar: item.statusBayar || oldData.statusBayar }),
        keterangan: normalizeCorrectionNote_(item.keterangan, cancelled),
        cancelled: cancelled
      };
      if (newData.harga < 0) throw new Error('Harga tidak boleh kurang dari 0 untuk ' + found.values[3] + '.');
      if (correctionDataChanged_(type, oldData, newData)) {
        changes.push({ type: type, id: id, rowIndex: found.rowIndex, kode: found.values[2], nama: found.values[3], noNota: oldData.noNota, oldData: oldData, newData: newData });
      }
    } else {
      const oldData = {
        qty: parseNumber_(found.values[4]),
        hpp: parseNumber_(found.values[6]),
        laba: parseNumber_(found.values[7]),
        keterangan: String(found.values[14] || '').trim()
      };
      const newData = {
        qty: newQty,
        hpp: parseNumber_(item.hpp),
        laba: parseNumber_(item.laba),
        keterangan: normalizeCorrectionNote_(item.keterangan, cancelled),
        cancelled: cancelled
      };
      if (newData.hpp < 0 || newData.laba < 0) throw new Error('HPP dan laba tidak boleh kurang dari 0 untuk ' + found.values[3] + '.');
      if (correctionDataChanged_(type, oldData, newData)) {
        changes.push({ type: type, id: id, rowIndex: found.rowIndex, kode: found.values[2], nama: found.values[3], oldData: oldData, newData: newData });
      }
    }
  });

  if (!changes.length) return { message: 'Tidak ada angka yang berubah.', changed: 0, cancelled: 0 };

  validateCorrectionStock_(ss, type, changes);
  if (type === 'MASUK') validateCorrectionDebt_(ss, values, changes);

  changes.forEach(function(change) {
    const row = change.rowIndex;
    if (type === 'MASUK') {
      sh.getRange(row, 5).setValue(change.newData.qty);
      sh.getRange(row, 7).setValue(change.newData.harga);
      sh.getRange(row, 9).setValue(change.newData.supplier);
      sh.getRange(row, 11).setValue(change.newData.statusBayar);
      sh.getRange(row, 13).setValue(change.newData.keterangan);
      const autoCol = normalize_(change.oldData.statusBayar) !== normalize_(change.newData.statusBayar) ? 11 :
        (normalize_(change.oldData.supplier) !== normalize_(change.newData.supplier) ? 9 : 5);
      autoBarangMasuk_(ss, sh, row, autoCol);
      change.newData.noNota = String(sh.getRange(row, 10).getValue() || '').trim();
      change.newData.totalModal = parseNumber_(change.newData.qty) * parseNumber_(change.newData.harga);
    } else {
      sh.getRange(row, 5).setValue(change.newData.qty);
      sh.getRange(row, 7).setValue(change.newData.hpp);
      sh.getRange(row, 8).setValue(change.newData.laba);
      sh.getRange(row, 15).setValue(change.newData.keterangan);
      autoBarangTerjual_(ss, sh, row, 8);
      change.newData.hargaJual = parseNumber_(change.newData.hpp) + parseNumber_(change.newData.laba);
      change.newData.totalJual = parseNumber_(change.newData.qty) * change.newData.hargaJual;
    }
    appendCorrectionAudit_(ss, type, targetDate, change, alasan);
  });

  quickAfterWrite_(ss);
  const cancelledCount = changes.filter(function(change) { return change.newData.cancelled; }).length;
  return {
    message: changes.length + ' transaksi berhasil dikoreksi' + (cancelledCount ? ', termasuk ' + cancelledCount + ' dibatalkan.' : '.'),
    changed: changes.length,
    cancelled: cancelledCount,
    tanggal: targetKey
  };
}

function normalizeCorrectionNote_(value, cancelled) {
  let note = String(value || '').trim().replace(/^\[DIBATALKAN WEB\]\s*/i, '');
  if (cancelled) note = '[DIBATALKAN WEB] ' + (note || 'Dibatalkan melalui menu koreksi.');
  return note;
}

function correctionDataChanged_(type, oldData, newData) {
  const diff = function(a, b) { return Math.abs(parseNumber_(a) - parseNumber_(b)) > 0.000001; };
  if (diff(oldData.qty, newData.qty) || String(oldData.keterangan || '') !== String(newData.keterangan || '')) return true;
  if (type === 'MASUK') {
    return diff(oldData.harga, newData.harga) || normalize_(oldData.supplier) !== normalize_(newData.supplier) || normalize_(oldData.statusBayar) !== normalize_(newData.statusBayar);
  }
  return diff(oldData.hpp, newData.hpp) || diff(oldData.laba, newData.laba);
}

function validateCorrectionStock_(ss, type, changes) {
  const stockRows = apiGetStokBarang_(ss);
  const stockMap = {};
  stockRows.forEach(function(item) {
    const key = normalize_(item.kode || item.nama);
    if (key) stockMap[key] = parseNumber_(item.stok);
    if (item.nama) stockMap['nama:' + normalize_(item.nama)] = parseNumber_(item.stok);
  });

  const deltaMap = {};
  const labelMap = {};
  changes.forEach(function(change) {
    const key = normalize_(change.kode) || 'nama:' + normalize_(change.nama);
    const oldQty = parseNumber_(change.oldData.qty);
    const newQty = parseNumber_(change.newData.qty);
    const delta = type === 'MASUK' ? (newQty - oldQty) : (oldQty - newQty);
    deltaMap[key] = (deltaMap[key] || 0) + delta;
    labelMap[key] = change.nama;
  });

  Object.keys(deltaMap).forEach(function(key) {
    const current = Object.prototype.hasOwnProperty.call(stockMap, key) ? stockMap[key] : (stockMap['nama:' + normalize_(labelMap[key])] || 0);
    const proposed = current + deltaMap[key];
    // Koreksi yang memperbaiki stok negatif tetap boleh. Yang membuatnya makin negatif ditolak.
    if (proposed < -0.000001 && proposed < current - 0.000001) {
      throw new Error('Koreksi membuat stok ' + labelMap[key] + ' menjadi ' + formatQty_(proposed) + ' Kg. Periksa qty terlebih dahulu.');
    }
  });
}

function validateCorrectionDebt_(ss, allMasukRows, changes) {
  const paymentSheet = ss.getSheetByName(CABE_SHEETS.BAYAR_HUTANG);
  if (!paymentSheet || paymentSheet.getLastRow() < CABE_START_ROW) return;
  const paymentRows = paymentSheet.getRange(CABE_START_ROW, 1, paymentSheet.getLastRow() - CABE_START_ROW + 1, 10).getValues();
  const paidByNota = {};
  paymentRows.forEach(function(row) {
    const note = String(row[3] || '').trim();
    if (note) paidByNota[normalize_(note)] = (paidByNota[normalize_(note)] || 0) + parseNumber_(row[5]);
  });

  const changeById = {};
  const affectedNotes = {};
  changes.forEach(function(change) {
    changeById[normalize_(change.id)] = change;
    if (change.noNota) affectedNotes[normalize_(change.noNota)] = change.noNota;
  });

  Object.keys(affectedNotes).forEach(function(noteKey) {
    const paid = paidByNota[noteKey] || 0;
    if (paid <= 0) return;

    changes.filter(function(change) { return normalize_(change.noNota) === noteKey; }).forEach(function(change) {
      if (normalize_(change.oldData.supplier) !== normalize_(change.newData.supplier) || normalize_(change.oldData.statusBayar) !== normalize_(change.newData.statusBayar)) {
        throw new Error('Supplier atau status nota ' + affectedNotes[noteKey] + ' tidak dapat diubah karena sudah memiliki riwayat pembayaran.');
      }
    });

    let projectedTotal = 0;
    allMasukRows.forEach(function(row) {
      if (normalize_(row[9]) !== noteKey) return;
      const change = changeById[normalize_(row[0])];
      if (change) {
        if (normalize_(change.newData.statusBayar) === 'hutang') projectedTotal += parseNumber_(change.newData.qty) * parseNumber_(change.newData.harga);
      } else if (normalize_(row[10]) === 'hutang') {
        projectedTotal += parseNumber_(row[4]) * parseNumber_(row[6]);
      }
    });

    if (projectedTotal + 0.000001 < paid) {
      throw new Error('Total koreksi nota ' + affectedNotes[noteKey] + ' menjadi ' + formatRupiah_(projectedTotal) + ', lebih kecil dari pembayaran yang sudah tercatat ' + formatRupiah_(paid) + '.');
    }
  });
}

function appendCorrectionAudit_(ss, type, tanggal, change, alasan) {
  let sh = ss.getSheetByName(CABE_SHEETS.KOREKSI_TRANSAKSI);
  if (!sh) sh = prepareSheet_(ss, CABE_SHEETS.KOREKSI_TRANSAKSI, false);
  const row = getNextEmptyRow_(sh, CABE_START_ROW, 1);
  const action = change.newData.cancelled ? 'DIBATALKAN' : 'DIKOREKSI';
  sh.getRange(row, 1, 1, 12).setValues([[
    makeId_('KR'),
    new Date(),
    type === 'MASUK' ? 'BARANG MASUK' : 'BARANG TERJUAL',
    tanggal,
    change.id,
    change.kode || '',
    change.nama || '',
    JSON.stringify(change.oldData),
    JSON.stringify(change.newData),
    parseNumber_(change.newData.qty) - parseNumber_(change.oldData.qty),
    alasan,
    action
  ]]);
  sh.getRange(row, 2).setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange(row, 4).setNumberFormat('dd/mm/yyyy');
  sh.getRange(row, 10).setNumberFormat('#,##0.##');
}


function apiAddBarangMasuk_(ss, payload) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  const items = payload.items || [];
  if (!items.length) throw new Error('Items barang masuk kosong.');

  // Status wajib dibaca dan dinormalisasi sekali di awal.
  // Ini mencegah pilihan STOK AWAL berubah diam-diam menjadi TUNAI
  // saat payload dari web kosong/berbeda penamaan.
  const statusBayar = normalizeStatusBayarApi_(payload);
  const tanggal = parseDateInput_(payload.tanggal) || todayDate_();
  assertFinanceDateOpen_(ss, tanggal, 'Barang masuk');

  items.forEach(item => {
    const row = getNextEmptyRow_(sh, CABE_START_ROW, 4);
    sh.getRange(row, 2).setValue(tanggal);
    sh.getRange(row, 4).setValue(item.namaBarang || item.nama || '');
    sh.getRange(row, 5).setValue(parseNumber_(item.qty));
    sh.getRange(row, 7).setValue(parseNumber_(item.harga));
    sh.getRange(row, 9).setValue(payload.supplier || '');
    sh.getRange(row, 11).setValue(statusBayar);
    sh.getRange(row, 13).setValue(payload.keterangan || 'Input dari Web/PWA');
    autoBarangMasuk_(ss, sh, row, 11);
  });
  quickAfterWrite_(ss);
  return { message: items.length + ' barang masuk tersimpan sebagai ' + statusBayar };
}

function apiAddBarangTerjual_(ss, payload) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  const items = payload.items || [];
  if (!items.length) throw new Error('Items barang terjual kosong.');

  const tanggal = parseDateInput_(payload.tanggal) || todayDate_();
  assertFinanceDateOpen_(ss, tanggal, 'Barang terjual');

  items.forEach(item => {
    const row = getNextEmptyRow_(sh, CABE_START_ROW, 4);

    const namaBarang = String(item.namaBarang || item.nama || '').trim();
    const kodeBarang = String(item.kodeBarang || item.kode || '').trim();
    const qty = parseNumber_(item.qty);

    // FIX: data penjualan dari web harus memakai angka yang tampil di web.
    // Sebelumnya backend mengambil ulang HPP dari sheet HPP, sehingga angka bisa berubah
    // ketika cache/form web dan rumus sheet sedang tidak sama. Sekarang HPP, Laba,
    // dan Harga Jual dikunci dari payload web. Kalau payload kosong, baru fallback ke sheet.
    let hppWeb = parseNumber_(item.hpp || item.hppKg || item.hargaPokok);
    const hargaJualWeb = parseNumber_(item.hargaJual || item.harga || item.sellingPrice);
    const labaDiisi = Object.prototype.hasOwnProperty.call(item, 'laba') ||
      Object.prototype.hasOwnProperty.call(item, 'labaKg') ||
      Object.prototype.hasOwnProperty.call(item, 'profit');
    let labaWeb = parseNumber_(
      Object.prototype.hasOwnProperty.call(item, 'laba') ? item.laba :
      Object.prototype.hasOwnProperty.call(item, 'labaKg') ? item.labaKg : item.profit
    );

    sh.getRange(row, 2).setValue(tanggal);
    if (kodeBarang) sh.getRange(row, 3).setValue(kodeBarang);
    sh.getRange(row, 4).setValue(namaBarang);
    sh.getRange(row, 5).setValue(qty);

    // Lengkapi kode dari nama dulu agar fallback HPP tetap bisa berjalan bila diperlukan.
    syncCodeName_(ss, sh.getRange(row, 3), sh.getRange(row, 4));

    const kodeFinal = sh.getRange(row, 3).getValue();
    if (!hppWeb && kodeFinal) hppWeb = lookupHPP_(ss, kodeFinal);
    if (!labaDiisi && hargaJualWeb && hppWeb) labaWeb = hargaJualWeb - hppWeb;

    if (kodeFinal) {
      const satuan = lookupMaster_(ss, kodeFinal, 4);
      if (satuan) sh.getRange(row, 6).setValue(satuan);
    }

    sh.getRange(row, 7).setValue(hppWeb || 0);
    sh.getRange(row, 8).setValue(labaWeb || 0);
    sh.getRange(row, 15).setValue(payload.keterangan || 'Input dari Web/PWA');

    // Pasang ID, rumus total, markup, margin, dan timestamp.
    // Karena kolom HPP/Laba sudah terisi, autoBarangTerjual_ tidak akan menimpa HPP dari sheet.
    autoBarangTerjual_(ss, sh, row, 8);
  });

  quickAfterWrite_(ss);
  return { message: items.length + ' barang terjual tersimpan sesuai HPP dan harga di web.' };
}

function apiAddStokOpname_(ss, payload) {
  payload = payload || {};
  const sh = ss.getSheetByName(CABE_SHEETS.STOK_OPNAME);
  if (!sh) throw new Error('Sheet STOK OPNAME tidak ditemukan. Jalankan setupCABE() dulu.');

  const namaBarang = String(payload.namaBarang || payload.nama || '').trim();
  const kodeBarang = String(payload.kodeBarang || payload.kode || '').trim();
  const stokFisik = parseNumber_(payload.stokFisik);
  const hasStokSistemWeb = payload.stokSistem !== undefined && payload.stokSistem !== null && payload.stokSistem !== '';
  const stokSistemWeb = parseNumber_(payload.stokSistem);
  let hppWeb = parseNumber_(payload.hpp || payload.hppKg || payload.hargaKg || payload.hargaPokok);
  const petugas = String(payload.petugas || '').trim();
  const tanggalOpname = parseDateInput_(payload.tanggal) || todayDate_();
  assertFinanceDateOpen_(ss, tanggalOpname, 'Stok opname');
  if (!namaBarang && !kodeBarang) throw new Error('Barang wajib dipilih.');
  if (stokFisik < 0) throw new Error('Stok fisik tidak boleh kurang dari 0.');
  if (!petugas) throw new Error('Nama petugas wajib diisi.');

  const row = getNextEmptyRow_(sh, CABE_START_ROW, 4);
  sh.getRange(row, 2).setValue(tanggalOpname);
  if (kodeBarang) sh.getRange(row, 3).setValue(kodeBarang);
  if (namaBarang) sh.getRange(row, 4).setValue(namaBarang);

  // Samakan kode dan nama sebelum mengambil fallback HPP/stok.
  syncCodeName_(ss, sh.getRange(row, 3), sh.getRange(row, 4));
  const kodeFinal = sh.getRange(row, 3).getValue();

  // Snapshot stok sistem dan Harga/Kg dari tampilan web agar angka transaksi tidak berubah
  // setelah rumus HPP/STOK dihitung ulang. Ini mengikuti pola penyimpanan BARANG TERJUAL.
  if (hasStokSistemWeb) sh.getRange(row, 5).setValue(stokSistemWeb);
  if (!hppWeb && kodeFinal) hppWeb = lookupHPP_(ss, kodeFinal);
  sh.getRange(row, 6).setValue(stokFisik);
  sh.getRange(row, 8).setValue(hppWeb || 0);
  sh.getRange(row, 10).setValue(petugas);
  sh.getRange(row, 11).setValue(payload.keterangan || 'Stok opname dari Web/PWA');
  autoStokOpname_(ss, sh, row, 8);

  SpreadsheetApp.flush();
  quickAfterWrite_(ss);
  return {
    message: 'Stok opname tersimpan untuk ' + (namaBarang || kodeBarang),
    stokSistem: parseNumber_(sh.getRange(row, 5).getValue()),
    stokFisik: stokFisik,
    selisih: parseNumber_(sh.getRange(row, 7).getValue()),
    hpp: parseNumber_(sh.getRange(row, 8).getValue()),
    nilaiSelisih: parseNumber_(sh.getRange(row, 9).getValue())
  };
}

function apiAddBayarHutang_(ss, payload) {
  payload = payload || {};
  const sh = ss.getSheetByName(CABE_SHEETS.BAYAR_HUTANG);
  const noNota = String(payload.noNota || payload.nota || payload.noNotaHutang || '').trim();
  const jumlahBayar = parseNumber_(payload.jumlahBayar);
  const metodeBayar = String(payload.metodeBayar || payload.metode || 'TRANSFER').trim().toUpperCase();
  const tanggalBayar = parseDateInput_(payload.tanggalBayar) || todayDate_();
  assertFinanceDateOpen_(ss, tanggalBayar, 'Pembayaran hutang');

  if (!noNota) throw new Error('No Nota hutang wajib dipilih.');
  if (jumlahBayar <= 0) throw new Error('Jumlah bayar wajib lebih dari 0.');

  const debt = lookupDebtByNota_(ss, noNota);
  if (!debt.supplier) throw new Error('No Nota hutang tidak ditemukan: ' + noNota);
  if (normalize_(debt.status) === 'LUNAS' || parseNumber_(debt.sisaHutang) <= 0) {
    throw new Error('No Nota ini sudah lunas: ' + noNota);
  }
  if (jumlahBayar > parseNumber_(debt.sisaHutang)) {
    throw new Error('Jumlah bayar tidak boleh melebihi sisa hutang Rp. ' + parseNumber_(debt.sisaHutang).toLocaleString('id-ID') + '.');
  }

  const row = getNextEmptyRow_(sh, CABE_START_ROW, 3);
  sh.getRange(row, 2).setValue(tanggalBayar);
  sh.getRange(row, 3).setValue(debt.supplier);
  sh.getRange(row, 4).setValue(noNota);
  sh.getRange(row, 5).setValue(parseNumber_(debt.sisaHutang));
  sh.getRange(row, 6).setValue(jumlahBayar);
  sh.getRange(row, 7).setValue(metodeBayar || 'TRANSFER');
  sh.getRange(row, 8).setValue(payload.keterangan || 'Input dari Web/PWA');
  autoBayarHutang_(ss, sh, row, 4);
  quickAfterWrite_(ss);
  return { message: 'Pembayaran hutang tersimpan untuk ' + noNota };
}

function apiGetPengeluaranHistory_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.PENGELUARAN);
  if (!sh) return [];

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return [];

  const width = CABE_HEADERS[CABE_SHEETS.PENGELUARAN].length;
  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, width).getValues();

  return values.map(function(row, index) {
      const rowNumber = CABE_START_ROW + index;
      const tanggalRaw = row[1] instanceof Date ? row[1] : parseDateInput_(row[1]);
      const id = String(row[0] || ('ROW-' + rowNumber)).trim();
      return {
        rowNumber: rowNumber,
        tanggalRaw: tanggalRaw,
        id: id,
        tanggal: tanggalRaw ? formatDateApi_(tanggalRaw) : String(row[1] || ''),
        tanggalIso: tanggalRaw ? Utilities.formatDate(tanggalRaw, CABE_TZ, 'yyyy-MM-dd') : '',
        kategori: String(row[2] || '').trim(),
        jumlah: parseNumber_(row[3]),
        metodeBayar: String(row[4] || 'CASH').trim().toUpperCase(),
        keterangan: String(row[5] || '').trim(),
        createdAt: formatDateTimeApi_(row[6]),
        updatedAt: formatDateTimeApi_(row[7])
      };
    })
    .filter(function(item) {
      return item.kategori && item.jumlah > 0;
    })
    .sort(function(a, b) {
      const aTime = a.tanggalRaw ? a.tanggalRaw.getTime() : 0;
      const bTime = b.tanggalRaw ? b.tanggalRaw.getTime() : 0;
      return bTime - aTime || b.rowNumber - a.rowNumber;
    })
    .map(function(item) {
      delete item.rowNumber;
      delete item.tanggalRaw;
      return item;
    });
}

function findPengeluaranRowById_(sh, id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) return 0;

  const rowMatch = cleanId.match(/^ROW-(\d+)$/i);
  if (rowMatch) {
    const rowNumber = Number(rowMatch[1]);
    if (rowNumber >= CABE_START_ROW && rowNumber <= sh.getLastRow()) {
      const values = sh.getRange(rowNumber, 2, 1, 5).getValues()[0];
      const hasData = values.some(function(value) { return value !== '' && value !== null; });
      if (hasData) return rowNumber;
    }
  }

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return 0;
  const ids = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 1).getDisplayValues();
  const target = normalize_(cleanId);
  for (let i = 0; i < ids.length; i++) {
    if (normalize_(ids[i][0]) === target) return CABE_START_ROW + i;
  }
  return 0;
}

function apiAddPengeluaran_(ss, payload) {
  payload = payload || {};
  const sh = ss.getSheetByName(CABE_SHEETS.PENGELUARAN);
  if (!sh) throw new Error('Sheet PENGELUARAN tidak ditemukan. Jalankan setupCABE() dulu.');

  const tanggal = parseDateInput_(payload.tanggal || payload.tanggalPengeluaran) || todayDate_();
  assertFinanceDateOpen_(ss, tanggal, 'Pengeluaran');
  const kategori = String(payload.kategori || payload.kategoriPengeluaran || '').trim();
  const jumlah = parseNumber_(payload.jumlah || payload.nominal || payload.total);
  const metodeBayar = String(payload.metodeBayar || payload.metode || 'CASH').trim().toUpperCase();
  const keterangan = String(payload.keterangan || payload.catatan || 'Input dari Web/PWA').trim();

  if (!kategori) throw new Error('Kategori pengeluaran wajib diisi.');
  if (jumlah <= 0) throw new Error('Jumlah pengeluaran wajib lebih dari 0.');

  const row = getNextEmptyRow_(sh, CABE_START_ROW, 3);
  sh.getRange(row, 2).setValue(tanggal);
  sh.getRange(row, 3).setValue(kategori);
  sh.getRange(row, 4).setValue(jumlah);
  sh.getRange(row, 5).setValue(metodeBayar || 'CASH');
  sh.getRange(row, 6).setValue(keterangan || 'Input dari Web/PWA');
  autoPengeluaran_(ss, sh, row, 4);

  quickAfterWrite_(ss);
  return { message: 'Pengeluaran tersimpan: ' + kategori + ' ' + formatRupiah_(jumlah) };
}


function apiUpdatePengeluaran_(ss, payload) {
  payload = payload || {};
  const sh = ss.getSheetByName(CABE_SHEETS.PENGELUARAN);
  if (!sh) throw new Error('Sheet PENGELUARAN tidak ditemukan.');

  const id = String(payload.id || payload.ID || payload.key || '').trim();
  const row = findPengeluaranRowById_(sh, id);
  if (!row) throw new Error('Data pengeluaran tidak ditemukan: ' + id);

  const tanggal = parseDateInput_(payload.tanggal || payload.tanggalPengeluaran);
  const kategori = String(payload.kategori || payload.kategoriPengeluaran || '').trim();
  const jumlah = parseNumber_(payload.jumlah || payload.nominal || payload.total);
  const metodeBayar = String(payload.metodeBayar || payload.metode || 'CASH').trim().toUpperCase();
  const keterangan = String(payload.keterangan || payload.catatan || '').trim();

  if (!tanggal) throw new Error('Tanggal pengeluaran tidak valid.');
  const tanggalLama = parseDateInput_(sh.getRange(row, 2).getValue());
  assertFinanceDateOpen_(ss, tanggalLama, 'Edit pengeluaran');
  assertFinanceDateOpen_(ss, tanggal, 'Edit pengeluaran');
  if (!kategori) throw new Error('Kategori pengeluaran wajib diisi.');
  if (jumlah <= 0) throw new Error('Jumlah pengeluaran wajib lebih dari 0.');
  if (['CASH', 'TRANSFER', 'QRIS'].indexOf(metodeBayar) === -1) {
    throw new Error('Metode bayar tidak valid: ' + metodeBayar);
  }

  sh.getRange(row, 2, 1, 5).setValues([[
    tanggal,
    kategori,
    jumlah,
    metodeBayar,
    keterangan || 'Input dari Web/PWA'
  ]]);
  autoPengeluaran_(ss, sh, row, 4);

  quickAfterWrite_(ss);
  return {
    id: String(sh.getRange(row, 1).getValue() || id),
    message: 'Pengeluaran berhasil diperbaiki: ' + kategori + ' ' + formatRupiah_(jumlah)
  };
}

function apiDeletePengeluaran_(ss, payload) {
  payload = payload || {};
  const sh = ss.getSheetByName(CABE_SHEETS.PENGELUARAN);
  if (!sh) throw new Error('Sheet PENGELUARAN tidak ditemukan.');

  const id = String(payload.id || payload.ID || payload.key || '').trim();
  const row = findPengeluaranRowById_(sh, id);
  if (!row) throw new Error('Data pengeluaran tidak ditemukan: ' + id);

  const tanggalLama = parseDateInput_(sh.getRange(row, 2).getValue());
  assertFinanceDateOpen_(ss, tanggalLama, 'Hapus pengeluaran');
  const kategori = String(sh.getRange(row, 3).getValue() || 'Pengeluaran').trim();
  const jumlah = parseNumber_(sh.getRange(row, 4).getValue());
  sh.getRange(row, 1, 1, CABE_HEADERS[CABE_SHEETS.PENGELUARAN].length).clearContent();

  quickAfterWrite_(ss);
  return {
    id: id,
    message: 'Pengeluaran dihapus: ' + kategori + ' ' + formatRupiah_(jumlah)
  };
}


function apiUpdateCashflowFlag_(ss, payload, flagType) {
  const key = payload.key || payload.id || payload.tanggal || payload.date || '';
  const targetDate = parseDateInput_(key);
  if (!targetDate) throw new Error('Tanggal cashflow tidak valid: ' + key);
  assertFinanceDateOpen_(ss, targetDate, 'Perubahan status Cashflow');

  const sh = ss.getSheetByName(CABE_SHEETS.CASHFLOW);
  if (!sh) throw new Error('Sheet CASHFLOW BISNIS tidak ditemukan.');

  const row = findCashflowRowByDate_(sh, targetDate);
  const col = flagType === 'HC' ? 8 : 9;
  const checked = parseBooleanApi_(payload.checked);

  sh.getRange(row, col).setValue(checked);
  SpreadsheetApp.flush();

  // Dashboard saja yang dibangun ulang. Cashflow tidak di-clear agar checkbox tetap aman.
  buildDashboard_(ss);
  clearCABEBootstrapCache_();

  return {
    message: 'Status ' + (flagType === 'HC' ? 'H.C' : 'L.C') + ' diperbarui',
    tanggal: formatDateApi_(targetDate),
    checked: checked
  };
}

function apiGenerateNotaPenjualan_(ss, payload) {
  const start = payload.tanggalAwal || payload.start || payload.startDate;
  const end = payload.tanggalAkhir || payload.end || payload.endDate || start;

  const result = generateNotaPenjualanCABE(start, end);

  clearCABEBootstrapCache_();

  return {
    message: 'Nota penjualan berhasil dibuat',
    url: result.url,
    fileUrl: result.url,
    fileId: result.fileId,
    name: result.name,
    total: result.total,
    waText: result.pesanWA,
    pesanWA: result.pesanWA
  };
}

function findCashflowRowByDate_(sh, targetDate) {
  const targetKey = formatCashflowKey_(targetDate);
  const values = sh.getRange('A6:A36').getValues();

  for (let i = 0; i < values.length; i++) {
    const rowKey = formatCashflowKey_(values[i][0]);
    if (rowKey && rowKey === targetKey) return 6 + i;
  }

  throw new Error('Tanggal cashflow tidak ditemukan di bulan aktif: ' + formatDateApi_(targetDate));
}

function readCashflowFlagsFromSheet_(sh) {
  const flags = {};
  if (!sh) return flags;

  try {
    const values = sh.getRange('A6:I36').getValues();
    values.forEach(row => {
      const key = formatCashflowKey_(row[0]);
      if (!key) return;
      flags[key] = {
        hc: row[7] === true,
        lc: row[8] === true
      };
    });
  } catch (err) {
    // Saat sheet belum pernah dibuat, abaikan.
  }

  return flags;
}

function restoreCashflowFlagsToSheet_(sh, flags) {
  if (!flags) flags = {};

  const dates = sh.getRange('A6:A36').getValues();
  const hcValues = [];
  const lcValues = [];

  dates.forEach(row => {
    const key = formatCashflowKey_(row[0]);
    const saved = key ? flags[key] : null;
    hcValues.push([saved ? saved.hc === true : false]);
    lcValues.push([saved ? saved.lc === true : false]);
  });

  sh.getRange('H6:H36').setValues(hcValues);
  sh.getRange('I6:I36').setValues(lcValues);
}

function formatCashflowKey_(value) {
  const d = parseDateInput_(value);
  if (!d) return '';
  d.setHours(0, 0, 0, 0);
  return Utilities.formatDate(d, CABE_TZ, 'yyyy-MM-dd');
}

function getSalesProfitMapByDate_(ss) {
  const map = {};
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_TERJUAL);
  if (!sh) return map;

  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return map;

  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, CABE_HEADERS[CABE_SHEETS.BARANG_TERJUAL].length).getValues();
  values.forEach(row => {
    const key = formatCashflowKey_(row[1]);
    if (!key) return;

    if (!map[key]) map[key] = { penjualan: 0, laba: 0 };
    map[key].penjualan += parseNumber_(row[11]);
    map[key].laba += parseNumber_(row[10]);
  });

  return map;
}

function parseBooleanApi_(value) {
  if (value === true) return true;
  if (value === false) return false;

  const text = normalize_(value);
  return text === 'true' || text === '1' || text === 'ya' || text === 'yes' || text === 'y' || text === 'checked';
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDateApi_(value) {
  return value instanceof Date ? Utilities.formatDate(value, CABE_TZ, 'dd/MM/yyyy') : (value || '');
}

function formatDateTimeApi_(value) {
  return value instanceof Date ? Utilities.formatDate(value, CABE_TZ, 'dd/MM/yyyy HH:mm') : (value || '');
}

/***********************
 * UTILITY
 ***********************/
function seedInitialMasterIfEmpty_(ss) {
  const sh = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  if (sh.getRange(3, 2).getValue()) return;

  const now = new Date();
  const rows = [
    ['CI', 'Cabe Ijo', 'Cabe', 'Kg', 5, 'AKTIF', '', '', '', now, now],
    ['RP', 'Rawit Putih', 'Cabe', 'Kg', 5, 'AKTIF', '', '', '', now, now],
    ['TI', 'Tomat Ijo', 'Sayur', 'Kg', 5, 'AKTIF', '', '', '', now, now],
    ['JP', 'Jeruk Peras', 'Buah', 'Kg', 5, 'AKTIF', '', '', '', now, now]
  ];
  sh.getRange(3, 1, rows.length, rows[0].length).setValues(rows);
}

function clearViewBody_(sh, lastCol) {
  const rows = Math.max(sh.getMaxRows() - 2, 1);
  sh.getRange(3, 1, rows, lastCol).clearContent();
}

function setTimestamps_(sh, row, createdCol, updatedCol) {
  const now = new Date();
  if (!sh.getRange(row, createdCol).getValue()) sh.getRange(row, createdCol).setValue(now);
  sh.getRange(row, updatedCol).setValue(now);
}

function makeId_(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), CABE_TZ, 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
}

function todayDate_() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function generateNotaNumber_(ss, tanggal, currentRow, statusBayar, supplier) {
  const sh = ss.getSheetByName(CABE_SHEETS.BARANG_MASUK);
  const ymd = notaDateKey_(tanggal || todayDate_());
  const prefix = getNotaPrefixByStatus_(statusBayar) + '-' + ymd + '-';
  const targetSupplier = normalize_(supplier || 'TANPA SUPPLIER');
  const targetStatus = normalize_(statusBayar || 'TUNAI');

  const last = sh.getLastRow();
  let maxNum = 0;

  if (last >= CABE_START_ROW) {
    // B:K = Tanggal, Kode, Nama, Qty, Satuan, Harga, Total, Supplier, No Nota, Status Bayar.
    const values = sh.getRange(CABE_START_ROW, 2, last - CABE_START_ROW + 1, 10).getValues();

    // Pakai ulang No Nota jika tanggal + supplier + status sama.
    for (let i = 0; i < values.length; i++) {
      const rowNumber = CABE_START_ROW + i;
      if (currentRow && rowNumber === currentRow) continue;

      const rowTanggal = values[i][0];
      const rowSupplier = values[i][7] || 'TANPA SUPPLIER';
      const rowNota = values[i][8];
      const rowStatus = values[i][9] || 'TUNAI';
      const rowNotaText = rowNota ? rowNota.toString().trim().toUpperCase() : '';

      if (!rowNotaText || !rowNotaText.startsWith(prefix)) continue;
      if (notaDateKey_(rowTanggal) !== ymd) continue;
      if (normalize_(rowSupplier || 'TANPA SUPPLIER') !== targetSupplier) continue;
      if (normalize_(rowStatus || 'TUNAI') !== targetStatus) continue;

      return rowNotaText;
    }

    // Kalau belum ada grup yang sama, buat urutan baru untuk prefix + tanggal tersebut.
    values.forEach((r, i) => {
      const rowNumber = CABE_START_ROW + i;
      if (currentRow && rowNumber === currentRow) return;
      const value = r[8] ? r[8].toString().trim().toUpperCase() : '';
      if (!value.startsWith(prefix)) return;
      const match = value.match(/-(\d+)$/);
      if (match) maxNum = Math.max(maxNum, Number(match[1]));
    });
  }

  const next = maxNum + 1;
  return prefix + String(next).padStart(3, '0');
}

function notaDateKey_(value) {
  let dateObj = value instanceof Date ? new Date(value) : parseDateInput_(value);
  if (!dateObj) dateObj = new Date(value || new Date());
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return '';
  return Utilities.formatDate(dateObj, CABE_TZ, 'yyyyMMdd');
}

function getNotaPrefixByStatus_(statusBayar) {
  const status = normalize_(statusBayar).toUpperCase();
  if (status === 'STOK AWAL') return 'SA';
  if (status === 'BONUS') return 'BN';
  if (status === 'KOREKSI MASUK') return 'KM';
  return 'NT';
}

function isAutoNotaNumber_(value) {
  if (!value) return false;
  return /^(NT|SA|BN|KM)-\d{8}-\d{3,}$/i.test(value.toString().trim());
}

function generateBarangCode_(ss, nama, currentRow) {
  const sh = ss.getSheetByName(CABE_SHEETS.MASTER_BARANG);
  const words = nama.toString().trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  let base = '';
  if (words.length >= 2) base = words[0].charAt(0) + words[1].charAt(0);
  else base = words.join('').substring(0, 2);
  if (!base) base = 'BR';

  const last = sh.getLastRow();
  const existing = last >= CABE_START_ROW
    ? sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 1).getValues().map((r, i) => ({ code: r[0], row: CABE_START_ROW + i }))
    : [];

  let code = base;
  let n = 2;
  while (existing.some(x => normalize_(x.code) === normalize_(code) && x.row !== currentRow)) {
    code = base + n;
    n++;
  }
  return code;
}

function generateSupplierCode_(ss, currentRow) {
  const sh = ss.getSheetByName(CABE_SHEETS.SUPPLIER);
  const last = sh.getLastRow();
  if (last < CABE_START_ROW) return 'SUP001';

  const values = sh.getRange(CABE_START_ROW, 1, last - CABE_START_ROW + 1, 1).getValues();
  let maxNum = 0;
  values.forEach((r, i) => {
    const rowNumber = CABE_START_ROW + i;
    if (currentRow && rowNumber === currentRow) return;
    const code = r[0] ? r[0].toString().trim().toUpperCase() : '';
    const match = code.match(/^SUP(\d+)$/);
    if (match) maxNum = Math.max(maxNum, Number(match[1]));
  });

  let next = maxNum + 1;
  let code = 'SUP' + String(next).padStart(3, '0');
  while (values.some((r, i) => {
    const rowNumber = CABE_START_ROW + i;
    return (!currentRow || rowNumber !== currentRow) && normalize_(r[0]) === normalize_(code);
  })) {
    next++;
    code = 'SUP' + String(next).padStart(3, '0');
  }
  return code;
}

function getNextEmptyRow_(sh, startRow, checkCol) {
  const last = Math.max(sh.getLastRow(), startRow);
  const values = sh.getRange(startRow, checkCol, last - startRow + 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (!values[i][0]) return startRow + i;
  }
  return last + 1;
}


function rowHasAnyData_(sh, row, cols) {
  return cols.some(col => {
    const value = sh.getRange(row, col).getValue();
    return value !== '' && value !== null;
  });
}

function clearTransactionAutoFields_(sh, row, cols) {
  cols.forEach(col => sh.getRange(row, col).clearContent());
}

function parseDateInput_(value) {
  if (value instanceof Date) return new Date(value);
  if (!value) return null;

  const text = value.toString().trim();
  let m;

  // yyyy-mm-dd
  m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  // dd/mm/yyyy or dd-mm-yyyy
  m = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d;
}

function formatRupiah_(value) {
  return 'Rp' + Number(value || 0).toLocaleString('id-ID');
}

function formatQty_(value) {
  return Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

function escapeHtml_(value) {
  return value === null || value === undefined ? '' : value.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getOrCreateFolder_(parentFolder, name) {
  const folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parentFolder.createFolder(name);
}

function parseNumber_(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  return Number(
    value.toString()
      .replace(/Rp/gi, '')
      .replace(/Kg/gi, '')
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '')
  ) || 0;
}

function normalize_(value) {
  return value === null || value === undefined ? '' : value.toString().trim().toLowerCase();
}

function setValidationRange_(target, source, allowInvalid) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(source, true)
    .setAllowInvalid(allowInvalid)
    .build();
  target.setDataValidation(rule);
}

function safeCreateFilter_(sh, lastCol) {
  try {
    if (sh.getFilter()) sh.getFilter().remove();
    sh.getRange(CABE_HEADER_ROW, 1, Math.max(sh.getMaxRows() - 1, 10), lastCol).createFilter();
  } catch (err) {
    // Abaikan kalau filter tidak bisa dibuat karena kondisi sheet tertentu.
  }
}

function setColumnWidths_(sh, name) {
  const widths = {
    'MASTER BARANG': [100, 180, 120, 80, 110, 100, 120, 150, 220, 140, 140],
    'SUPPLIER': [120, 180, 130, 220, 100, 220, 140, 140],
    'BARANG MASUK': [170, 110, 100, 180, 90, 80, 120, 130, 160, 130, 120, 120, 220, 140, 140],
    'BARANG TERJUAL': [170, 110, 100, 180, 90, 80, 120, 120, 130, 130, 130, 130, 90, 90, 220, 140, 140],
    'STOK OPNAME': [170, 110, 100, 180, 110, 110, 90, 120, 130, 130, 220, 140, 140],
    'STOK BARANG': [100, 180, 120, 80, 110, 110, 120, 120, 130, 150, 150],
    'HPP': [100, 180, 80, 110, 130, 110, 120, 110, 130, 120, 150, 130],
    'HUTANG': [130, 110, 180, 130, 130, 130, 130, 120, 260],
    'HUTANG AWAL': [130, 110, 180, 140, 120, 260, 140, 140],
    'BAYAR HUTANG': [170, 120, 180, 130, 130, 130, 130, 220, 140, 140],
    'PENGELUARAN': [170, 120, 150, 130, 130, 260, 140, 140],
    'NOTA PENJUALAN': [160, 120, 120, 140, 120, 120, 260, 260, 140, 140],
    'CASHFLOW BISNIS': [110, 120, 120, 120, 120, 120, 120, 55, 55],
    'AKSES PERANGKAT': [150, 160, 180, 230, 360, 110, 100, 150, 150, 260],
    'KOREKSI TRANSAKSI': [170, 150, 150, 120, 180, 110, 180, 320, 320, 110, 260, 120],
    'MUTASI MODAL': [180, 110, 170, 130, 110, 260, 150, 150],
    'REKONSILIASI BANK': [190, 110, 140, 150, 130, 260, 150, 150],
    'TUTUP PERIODE': [160, 100, 150, 130, 140, 130, 130, 130, 130, 150, 130, 140, 140, 150, 130, 130, 140, 160, 260, 100, 150],
    'SETUP': [160, 180, 280]
  };
  const arr = widths[name] || [];
  arr.forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

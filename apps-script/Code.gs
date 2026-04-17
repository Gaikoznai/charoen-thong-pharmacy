// =============================================
//  เจริญทองเภสัช - POS ร้านขายยา
//  Google Apps Script Backend
// =============================================

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('เจริญทองเภสัช - ระบบขายยา')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ===== SHEET SETUP =====

function ensureSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const defs = [
    { name: 'Products',  headers: ['id','name','genericName','barcode','categoryId','price','costPrice','stock','unit','minStock','expiryDate','supplierId','description','requirePrescription','status','createdAt','updatedAt'] },
    { name: 'Members',   headers: ['id','code','name','phone','email','address','birthDate','points','totalSpent','joinDate','status','notes','createdAt'] },
    { name: 'Categories',headers: ['id','name','description'] },
    { name: 'Suppliers', headers: ['id','name','phone','email','address','notes'] },
    { name: 'Sales',     headers: ['id','invoiceNo','memberId','memberName','subtotal','discount','finalAmount','paymentMethod','cashReceived','change','pointsEarned','pointsUsed','notes','status','createdAt'] },
    { name: 'SaleItems', headers: ['id','saleId','productId','productName','barcode','quantity','unitPrice','discount','totalPrice'] },
  ];
  for (const def of defs) {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.appendRow(def.headers);
      sheet.getRange(1, 1, 1, def.headers.length)
        .setFontWeight('bold').setBackground('#c7d2fe').setFontColor('#1e1b4b');
      sheet.setFrozenRows(1);
    }
  }
  return { success: true };
}

// ===== PRIVATE HELPERS =====

function getRows_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(String);
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const obj = {};
    headers.forEach((h, j) => { obj[h] = data[i][j] != null ? String(data[i][j]) : ''; });
    rows.push(obj);
  }
  return rows;
}

function findRowIdx_(sheetName, id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return -1;
  const col = sheet.getRange('A:A').getValues();
  for (let i = 1; i < col.length; i++) {
    if (String(col[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function genId_() { return Utilities.getUuid().replace(/-/g,'').slice(0,12); }
function now_()   { return new Date().toISOString(); }
function invoiceNo_() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return 'INV' + y + m + day + (Math.floor(Math.random()*9000)+1000);
}

// ===== PRODUCTS =====

function getProducts(search) {
  const products = getRows_('Products');
  const catMap = {}, supMap = {};
  getRows_('Categories').forEach(c => catMap[c.id] = c.name);
  getRows_('Suppliers').forEach(s => supMap[s.id] = s.name);
  let result = products.map(p => ({
    ...p,
    categoryName: catMap[p.categoryId] || '',
    supplierName: supMap[p.supplierId] || '',
  }));
  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    result = result.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.genericName.toLowerCase().includes(s) ||
      p.barcode.toLowerCase().includes(s)
    );
  }
  return result;
}

function saveProduct(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  const H = ['id','name','genericName','barcode','categoryId','price','costPrice','stock','unit','minStock','expiryDate','supplierId','description','requirePrescription','status','createdAt','updatedAt'];
  if (data.id) {
    const idx = findRowIdx_('Products', data.id);
    if (idx === -1) throw new Error('ไม่พบสินค้า');
    data.updatedAt = now_();
    sheet.getRange(idx, 1, 1, H.length).setValues([H.map(h => data[h] != null ? data[h] : '')]);
  } else {
    data.id = genId_(); data.createdAt = now_(); data.updatedAt = now_();
    sheet.appendRow(H.map(h => data[h] != null ? data[h] : ''));
  }
  return { success: true, id: data.id };
}

function deleteProduct(id) {
  const idx = findRowIdx_('Products', id);
  if (idx === -1) throw new Error('ไม่พบสินค้า');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products').deleteRow(idx);
  return { success: true };
}

// ===== MEMBERS =====

function getMembers(search) {
  let rows = getRows_('Members');
  if (search && search.trim()) {
    const s = search.toLowerCase().trim();
    rows = rows.filter(m => m.name.toLowerCase().includes(s) || m.phone.includes(s) || m.code.toLowerCase().includes(s));
  }
  return rows;
}

function saveMember(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members');
  const H = ['id','code','name','phone','email','address','birthDate','points','totalSpent','joinDate','status','notes','createdAt'];
  if (data.id) {
    const idx = findRowIdx_('Members', data.id);
    if (idx === -1) throw new Error('ไม่พบสมาชิก');
    sheet.getRange(idx, 1, 1, H.length).setValues([H.map(h => data[h] != null ? data[h] : '')]);
  } else {
    const count = getRows_('Members').length;
    data.id = genId_();
    data.code = data.code || ('M' + String(count + 1).padStart(5,'0'));
    data.points = 0; data.totalSpent = 0;
    data.joinDate = now_().split('T')[0];
    data.status = 'active'; data.createdAt = now_();
    sheet.appendRow(H.map(h => data[h] != null ? data[h] : ''));
  }
  return { success: true, id: data.id };
}

function deleteMember(id) {
  const idx = findRowIdx_('Members', id);
  if (idx === -1) throw new Error('ไม่พบสมาชิก');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members').deleteRow(idx);
  return { success: true };
}

// ===== CATEGORIES =====

function getCategories() { return getRows_('Categories'); }

function saveCategory(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  if (data.id) {
    const idx = findRowIdx_('Categories', data.id);
    if (idx === -1) throw new Error('ไม่พบหมวดหมู่');
    sheet.getRange(idx, 1, 1, 3).setValues([[data.id, data.name||'', data.description||'']]);
  } else {
    data.id = genId_();
    sheet.appendRow([data.id, data.name||'', data.description||'']);
  }
  return { success: true, id: data.id };
}

function deleteCategory(id) {
  const idx = findRowIdx_('Categories', id);
  if (idx === -1) throw new Error('ไม่พบหมวดหมู่');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories').deleteRow(idx);
  return { success: true };
}

// ===== SUPPLIERS =====

function getSuppliers() { return getRows_('Suppliers'); }

function saveSupplier(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Suppliers');
  const H = ['id','name','phone','email','address','notes'];
  if (data.id) {
    const idx = findRowIdx_('Suppliers', data.id);
    if (idx === -1) throw new Error('ไม่พบผู้จัดจำหน่าย');
    sheet.getRange(idx, 1, 1, 6).setValues([H.map(h => data[h]||'')]);
  } else {
    data.id = genId_();
    sheet.appendRow(H.map(h => data[h]||''));
  }
  return { success: true, id: data.id };
}

function deleteSupplier(id) {
  const idx = findRowIdx_('Suppliers', id);
  if (idx === -1) throw new Error('ไม่พบผู้จัดจำหน่าย');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Suppliers').deleteRow(idx);
  return { success: true };
}

// ===== SALES =====

function getSales(dateFrom, dateTo) {
  let rows = getRows_('Sales');
  if (dateFrom) rows = rows.filter(s => s.createdAt >= dateFrom);
  if (dateTo)   rows = rows.filter(s => s.createdAt <= dateTo + 'T23:59:59');
  return rows.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}

function getSaleDetail(saleId) {
  const sale = getRows_('Sales').find(s => s.id === saleId);
  if (!sale) throw new Error('ไม่พบบิล');
  sale.items = getRows_('SaleItems').filter(i => i.saleId === saleId);
  return sale;
}

function createSale(saleData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet   = ss.getSheetByName('Sales');
  const itemsSheet   = ss.getSheetByName('SaleItems');
  const productsSheet = ss.getSheetByName('Products');
  const membersSheet  = ss.getSheetByName('Members');

  const items       = saleData.items || [];
  const subtotal    = items.reduce((s,i) => s + parseFloat(i.totalPrice), 0);
  const discount    = parseFloat(saleData.discount) || 0;
  const finalAmount = Math.max(0, subtotal - discount);
  const cashReceived = parseFloat(saleData.cashReceived) || 0;
  const change      = Math.max(0, cashReceived - finalAmount);
  const pointsEarned = Math.floor(finalAmount / 100);
  const pointsUsed  = parseInt(saleData.pointsUsed) || 0;

  let memberName = '';
  if (saleData.memberId) {
    const m = getRows_('Members').find(m => m.id === saleData.memberId);
    if (m) memberName = m.name;
  }

  const saleId = genId_();
  const SH = ['id','invoiceNo','memberId','memberName','subtotal','discount','finalAmount','paymentMethod','cashReceived','change','pointsEarned','pointsUsed','notes','status','createdAt'];
  const sale = { id: saleId, invoiceNo: invoiceNo_(), memberId: saleData.memberId||'', memberName, subtotal, discount, finalAmount, paymentMethod: saleData.paymentMethod||'cash', cashReceived, change, pointsEarned, pointsUsed, notes: saleData.notes||'', status:'completed', createdAt: now_() };
  salesSheet.appendRow(SH.map(h => sale[h]));

  // Items + stock update
  const allProducts = getRows_('Products');
  for (const item of items) {
    itemsSheet.appendRow([genId_(), saleId, item.productId, item.productName, item.barcode||'', item.quantity, item.unitPrice, item.discount||0, item.totalPrice]);
    const pIdx = findRowIdx_('Products', item.productId);
    if (pIdx !== -1) {
      const p = allProducts.find(p => p.id === item.productId);
      if (p) productsSheet.getRange(pIdx, 8).setValue(Math.max(0, parseInt(p.stock) - parseInt(item.quantity)));
    }
  }

  // Member points
  if (saleData.memberId) {
    const mIdx = findRowIdx_('Members', saleData.memberId);
    if (mIdx !== -1) {
      const m = getRows_('Members').find(m => m.id === saleData.memberId);
      if (m) {
        membersSheet.getRange(mIdx, 8).setValue(Math.max(0, parseInt(m.points) + pointsEarned - pointsUsed));
        membersSheet.getRange(mIdx, 9).setValue(parseFloat(m.totalSpent) + finalAmount);
      }
    }
  }
  return sale;
}

function voidSale(id) {
  const idx = findRowIdx_('Sales', id);
  if (idx === -1) throw new Error('ไม่พบบิล');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sales').getRange(idx, 14).setValue('voided');
  return { success: true };
}

function updateStock(id, newStock) {
  const idx = findRowIdx_('Products', id);
  if (idx === -1) throw new Error('ไม่พบสินค้า');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products').getRange(idx, 8).setValue(parseInt(newStock));
  return { success: true };
}

// ===== REPORTS =====

function getReportSummary(dateFrom, dateTo) {
  let sales = getRows_('Sales').filter(s => s.status !== 'voided');
  if (dateFrom) sales = sales.filter(s => s.createdAt >= dateFrom);
  if (dateTo)   sales = sales.filter(s => s.createdAt <= dateTo + 'T23:59:59');

  const totalRevenue     = sales.reduce((s,r) => s + parseFloat(r.finalAmount), 0);
  const totalDiscount    = sales.reduce((s,r) => s + parseFloat(r.discount), 0);
  const totalTransactions = sales.length;
  const saleIds          = new Set(sales.map(s => s.id));
  const allItems         = getRows_('SaleItems').filter(i => saleIds.has(i.saleId));
  const totalItemsSold   = allItems.reduce((s,i) => s + parseInt(i.quantity), 0);

  const costMap = {};
  getRows_('Products').forEach(p => costMap[p.id] = parseFloat(p.costPrice)||0);
  const totalCost  = allItems.reduce((s,i) => s + ((costMap[i.productId]||0) * parseInt(i.quantity)), 0);
  const grossProfit = totalRevenue - totalCost;

  const dailyMap = {};
  sales.forEach(s => {
    const day = s.createdAt.split('T')[0];
    if (!dailyMap[day]) dailyMap[day] = { revenue:0, transactions:0 };
    dailyMap[day].revenue     += parseFloat(s.finalAmount);
    dailyMap[day].transactions++;
  });
  const daily = Object.entries(dailyMap).map(([date,v]) => ({date,...v})).sort((a,b) => a.date.localeCompare(b.date));

  const pSales = {};
  allItems.forEach(i => {
    if (!pSales[i.productId]) pSales[i.productId] = { name: i.productName, quantity:0, revenue:0 };
    pSales[i.productId].quantity += parseInt(i.quantity);
    pSales[i.productId].revenue  += parseFloat(i.totalPrice);
  });
  const topProducts = Object.entries(pSales).map(([id,v]) => ({id,...v})).sort((a,b) => b.revenue - a.revenue).slice(0,10);

  const products = getRows_('Products');
  const lowStock = products.filter(p => parseInt(p.stock) <= parseInt(p.minStock||5))
    .map(p => ({id:p.id, name:p.name, stock:parseInt(p.stock), minStock:parseInt(p.minStock||5)}));

  return { totalRevenue, totalDiscount, totalTransactions, totalItemsSold, grossProfit,
           totalMembers: getRows_('Members').length, daily, topProducts, lowStock };
}

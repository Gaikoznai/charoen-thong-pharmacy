// =============================================
//  เจริญทองเภสัช - POS ร้านขายยา
//  Google Apps Script Backend v1.20
// =============================================

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function doGet(e) {
  var action = e && e.parameter && e.parameter.action;
  if (!action) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('เจริญทองเภสัช - ระบบขายยา')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  try {
    var result;
    var p = e.parameter;
    switch (action) {
      case 'getProducts':      result = getProducts(p.search); break;
      case 'getMembers':       result = getMembers(p.search); break;
      case 'getCategories':    result = getCategories(); break;
      case 'getSuppliers':     result = getSuppliers(); break;
      case 'getSales':         result = getSales(p.dateFrom, p.dateTo); break;
      case 'getSaleDetail':    result = getSaleDetail(p.id); break;
      case 'getReportSummary': result = getReportSummary(p.dateFrom, p.dateTo); break;
      case 'getParkedBills':   result = getParkedBills(); break;
      case 'ensureSheets':     result = ensureSheets(); break;
      default: throw new Error('Unknown action: ' + action);
    }
    return jsonOut({ ok: true, data: result });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result;
    switch (action) {
      case 'createSale':          result = createSale(payload); break;
      case 'voidSale':            result = voidSale(payload.id); break;
      case 'saveProduct':         result = saveProduct(payload); break;
      case 'deleteProduct':       result = deleteProduct(payload.id); break;
      case 'saveMember':          result = saveMember(payload); break;
      case 'deleteMember':        result = deleteMember(payload.id); break;
      case 'saveCategory':        result = saveCategory(payload); break;
      case 'deleteCategory':      result = deleteCategory(payload.id); break;
      case 'saveSupplier':        result = saveSupplier(payload); break;
      case 'deleteSupplier':      result = deleteSupplier(payload.id); break;
      case 'updateStock':         result = updateStock(payload.id, payload.stock); break;
      case 'parkBill':            result = parkBill(payload); break;
      case 'updateParkedBill':    result = updateParkedBill(payload.id, payload.status); break;
      case 'ensureSheets':        result = ensureSheets(); break;
      default: throw new Error('Unknown action: ' + action);
    }
    return jsonOut({ ok: true, data: result });
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== SHEET SETUP =====

function ensureSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var defs = [
    { name: 'Products',    headers: ['id','name','genericName','barcode','categoryId','price','costPrice','stock','unit','minStock','expiryDate','supplierId','description','requirePrescription','status','createdAt','updatedAt'] },
    { name: 'Members',     headers: ['id','code','name','phone','email','address','birthDate','points','totalSpent','joinDate','status','notes','createdAt','chronicDisease','drugAllergy'] },
    { name: 'Categories',  headers: ['id','name','description'] },
    { name: 'Suppliers',   headers: ['id','name','phone','email','address','notes'] },
    { name: 'Sales',       headers: ['id','invoiceNo','memberId','memberName','subtotal','discount','finalAmount','paymentMethod','cashReceived','change','pointsEarned','pointsUsed','notes','status','createdAt'] },
    { name: 'SaleItems',   headers: ['id','saleId','productId','productName','barcode','quantity','unitPrice','discount','totalPrice'] },
    { name: 'ParkedBills', headers: ['id','billNo','memberId','memberName','itemsJson','subtotal','discount','notes','status','createdAt','updatedAt'] },
  ];
  for (var i = 0; i < defs.length; i++) {
    var def = defs[i];
    var sheet = ss.getSheetByName(def.name);
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
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0].map(String);
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    var obj = {};
    headers.forEach(function(h, j) { obj[h] = data[i][j] != null ? String(data[i][j]) : ''; });
    rows.push(obj);
  }
  return rows;
}

function findRowIdx_(sheetName, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return -1;
  var col = sheet.getRange('A:A').getValues();
  for (var i = 1; i < col.length; i++) {
    if (String(col[i][0]) === String(id)) return i + 1;
  }
  return -1;
}

function genId_() { return Utilities.getUuid().replace(/-/g,'').slice(0,12); }
function now_()   { return new Date().toISOString(); }

function invoiceNo_() {
  var d = new Date();
  var y = String(d.getFullYear()).slice(-2);
  var m = String(d.getMonth()+1).padStart(2,'0');
  var rand = Math.floor(Math.random()*9000)+1000;
  return 'ORR-' + y + '-' + m + '-' + rand;
}

// ===== PRODUCTS =====

function getProducts(search) {
  var products = getRows_('Products');
  var catMap = {}, supMap = {};
  getRows_('Categories').forEach(function(c) { catMap[c.id] = c.name; });
  getRows_('Suppliers').forEach(function(s) { supMap[s.id] = s.name; });
  var result = products.map(function(p) {
    return Object.assign({}, p, { categoryName: catMap[p.categoryId]||'', supplierName: supMap[p.supplierId]||'' });
  });
  if (search && search.trim()) {
    var s = search.toLowerCase().trim();
    result = result.filter(function(p) {
      return p.name.toLowerCase().includes(s) ||
             (p.genericName||'').toLowerCase().includes(s) ||
             (p.barcode||'').toLowerCase().includes(s);
    });
  }
  return result;
}

function saveProduct(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products');
  var H = ['id','name','genericName','barcode','categoryId','price','costPrice','stock','unit','minStock','expiryDate','supplierId','description','requirePrescription','status','createdAt','updatedAt'];
  if (data.id) {
    var idx = findRowIdx_('Products', data.id);
    if (idx === -1) throw new Error('ไม่พบสินค้า');
    data.updatedAt = now_();
    sheet.getRange(idx, 1, 1, H.length).setValues([H.map(function(h) { return data[h] != null ? data[h] : ''; })]);
  } else {
    data.id = genId_(); data.createdAt = now_(); data.updatedAt = now_();
    sheet.appendRow(H.map(function(h) { return data[h] != null ? data[h] : ''; }));
  }
  return { success: true, id: data.id };
}

function deleteProduct(id) {
  var idx = findRowIdx_('Products', id);
  if (idx === -1) throw new Error('ไม่พบสินค้า');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products').deleteRow(idx);
  return { success: true };
}

// ===== MEMBERS =====

function getMembers(search) {
  var rows = getRows_('Members');
  if (search && search.trim()) {
    var s = search.toLowerCase().trim();
    rows = rows.filter(function(m) {
      return m.name.toLowerCase().includes(s) || m.phone.includes(s) || (m.code||'').toLowerCase().includes(s);
    });
  }
  return rows;
}

function saveMember(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members');
  var H = ['id','code','name','phone','email','address','birthDate','points','totalSpent','joinDate','status','notes','createdAt','chronicDisease','drugAllergy'];
  if (data.id) {
    var idx = findRowIdx_('Members', data.id);
    if (idx === -1) throw new Error('ไม่พบสมาชิก');
    sheet.getRange(idx, 1, 1, H.length).setValues([H.map(function(h) { return data[h] != null ? data[h] : ''; })]);
  } else {
    var count = getRows_('Members').length;
    data.id    = genId_();
    data.code  = data.phone || ('M' + String(count+1).padStart(5,'0'));
    data.points = 0; data.totalSpent = 0;
    data.joinDate = now_().split('T')[0];
    data.status = 'active'; data.createdAt = now_();
    sheet.appendRow(H.map(function(h) { return data[h] != null ? data[h] : ''; }));
  }
  return { success: true, id: data.id, code: data.code };
}

function deleteMember(id) {
  var idx = findRowIdx_('Members', id);
  if (idx === -1) throw new Error('ไม่พบสมาชิก');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Members').deleteRow(idx);
  return { success: true };
}

// ===== CATEGORIES =====

function getCategories() { return getRows_('Categories'); }

function saveCategory(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories');
  if (data.id) {
    var idx = findRowIdx_('Categories', data.id);
    if (idx === -1) throw new Error('ไม่พบหมวดหมู่');
    sheet.getRange(idx, 1, 1, 3).setValues([[data.id, data.name||'', data.description||'']]);
  } else {
    data.id = genId_();
    sheet.appendRow([data.id, data.name||'', data.description||'']);
  }
  return { success: true, id: data.id };
}

function deleteCategory(id) {
  var idx = findRowIdx_('Categories', id);
  if (idx === -1) throw new Error('ไม่พบหมวดหมู่');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Categories').deleteRow(idx);
  return { success: true };
}

// ===== SUPPLIERS =====

function getSuppliers() { return getRows_('Suppliers'); }

function saveSupplier(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Suppliers');
  var H = ['id','name','phone','email','address','notes'];
  if (data.id) {
    var idx = findRowIdx_('Suppliers', data.id);
    if (idx === -1) throw new Error('ไม่พบผู้จัดจำหน่าย');
    sheet.getRange(idx, 1, 1, 6).setValues([H.map(function(h) { return data[h]||''; })]);
  } else {
    data.id = genId_();
    sheet.appendRow(H.map(function(h) { return data[h]||''; }));
  }
  return { success: true, id: data.id };
}

function deleteSupplier(id) {
  var idx = findRowIdx_('Suppliers', id);
  if (idx === -1) throw new Error('ไม่พบผู้จัดจำหน่าย');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Suppliers').deleteRow(idx);
  return { success: true };
}

// ===== SALES =====

function getSales(dateFrom, dateTo) {
  var rows = getRows_('Sales');
  if (dateFrom) rows = rows.filter(function(s) { return s.createdAt >= dateFrom; });
  if (dateTo)   rows = rows.filter(function(s) { return s.createdAt <= dateTo + 'T23:59:59'; });
  return rows.sort(function(a,b) { return b.createdAt.localeCompare(a.createdAt); });
}

function getSaleDetail(saleId) {
  var sale = getRows_('Sales').find(function(s) { return s.id === saleId; });
  if (!sale) throw new Error('ไม่พบบิล');
  sale.items = getRows_('SaleItems').filter(function(i) { return i.saleId === saleId; });
  return sale;
}

function createSale(saleData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var salesSheet    = ss.getSheetByName('Sales');
  var itemsSheet    = ss.getSheetByName('SaleItems');
  var productsSheet = ss.getSheetByName('Products');
  var membersSheet  = ss.getSheetByName('Members');

  var items       = saleData.items || [];
  var subtotal    = items.reduce(function(s,i) { return s + parseFloat(i.totalPrice); }, 0);
  var discount    = parseFloat(saleData.discount) || 0;
  var finalAmount = Math.max(0, subtotal - discount);
  var cashReceived = parseFloat(saleData.cashReceived) || 0;
  var change      = Math.max(0, cashReceived - finalAmount);
  var pointsEarned = Math.floor(finalAmount / 100);
  var pointsUsed  = parseInt(saleData.pointsUsed) || 0;

  var memberName = '';
  if (saleData.memberId) {
    var m0 = getRows_('Members').find(function(m) { return m.id === saleData.memberId; });
    if (m0) memberName = m0.name;
  }

  var saleId = genId_();
  var SH = ['id','invoiceNo','memberId','memberName','subtotal','discount','finalAmount','paymentMethod','cashReceived','change','pointsEarned','pointsUsed','notes','status','createdAt'];
  var sale = {
    id: saleId, invoiceNo: invoiceNo_(),
    memberId: saleData.memberId||'', memberName: memberName,
    subtotal: subtotal, discount: discount, finalAmount: finalAmount,
    paymentMethod: saleData.paymentMethod||'cash',
    cashReceived: cashReceived, change: change,
    pointsEarned: pointsEarned, pointsUsed: pointsUsed,
    notes: saleData.notes||'', status: 'completed', createdAt: now_()
  };
  salesSheet.appendRow(SH.map(function(h) { return sale[h]; }));

  var allProducts = getRows_('Products');
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    itemsSheet.appendRow([genId_(), saleId, item.productId, item.productName, item.barcode||'', item.quantity, item.unitPrice, item.discount||0, item.totalPrice]);
    var pIdx = findRowIdx_('Products', item.productId);
    if (pIdx !== -1) {
      var p = allProducts.find(function(pr) { return pr.id === item.productId; });
      if (p) productsSheet.getRange(pIdx, 8).setValue(Math.max(0, parseInt(p.stock) - parseInt(item.quantity)));
    }
  }

  if (saleData.memberId) {
    var mIdx = findRowIdx_('Members', saleData.memberId);
    if (mIdx !== -1) {
      var mRow = getRows_('Members').find(function(m) { return m.id === saleData.memberId; });
      if (mRow) {
        membersSheet.getRange(mIdx, 8).setValue(Math.max(0, parseInt(mRow.points) + pointsEarned - pointsUsed));
        membersSheet.getRange(mIdx, 9).setValue(parseFloat(mRow.totalSpent) + finalAmount);
      }
    }
  }

  // If sale was from a parked bill, mark it completed
  if (saleData.parkedBillId) {
    updateParkedBill(saleData.parkedBillId, 'completed');
  }

  return sale;
}

function voidSale(id) {
  var idx = findRowIdx_('Sales', id);
  if (idx === -1) throw new Error('ไม่พบบิล');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sales').getRange(idx, 14).setValue('voided');
  return { success: true };
}

function updateStock(id, newStock) {
  var idx = findRowIdx_('Products', id);
  if (idx === -1) throw new Error('ไม่พบสินค้า');
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Products').getRange(idx, 8).setValue(parseInt(newStock));
  return { success: true };
}

// ===== PARKED BILLS =====

function getParkedBills() {
  return getRows_('ParkedBills').filter(function(b) { return b.status === 'parked' || b.status === 'recalled'; });
}

function parkBill(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ParkedBills');
  if (!sheet) { ensureSheets(); sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ParkedBills'); }
  var id = data.id || genId_();
  var now = now_();
  var H = ['id','billNo','memberId','memberName','itemsJson','subtotal','discount','notes','status','createdAt','updatedAt'];
  var row = {
    id: id,
    billNo: data.billNo || '',
    memberId: data.memberId || '',
    memberName: data.memberName || '',
    itemsJson: JSON.stringify(data.items || []),
    subtotal: data.subtotal || 0,
    discount: data.discount || 0,
    notes: data.notes || '',
    status: 'parked',
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
  sheet.appendRow(H.map(function(h) { return row[h]; }));
  return { success: true, id: id };
}

function updateParkedBill(id, status) {
  var idx = findRowIdx_('ParkedBills', id);
  if (idx === -1) throw new Error('ไม่พบบิลค้าง');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ParkedBills');
  // status is column 9, updatedAt is column 11
  sheet.getRange(idx, 9).setValue(status);
  sheet.getRange(idx, 11).setValue(now_());
  return { success: true };
}

// ===== REPORTS =====

function getReportSummary(dateFrom, dateTo) {
  var sales = getRows_('Sales').filter(function(s) { return s.status !== 'voided'; });
  if (dateFrom) sales = sales.filter(function(s) { return s.createdAt >= dateFrom; });
  if (dateTo)   sales = sales.filter(function(s) { return s.createdAt <= dateTo + 'T23:59:59'; });

  var totalRevenue     = sales.reduce(function(s,r) { return s + parseFloat(r.finalAmount); }, 0);
  var totalDiscount    = sales.reduce(function(s,r) { return s + parseFloat(r.discount); }, 0);
  var totalTransactions = sales.length;
  var saleIds          = {};
  sales.forEach(function(s) { saleIds[s.id] = true; });
  var allItems = getRows_('SaleItems').filter(function(i) { return saleIds[i.saleId]; });
  var totalItemsSold = allItems.reduce(function(s,i) { return s + parseInt(i.quantity); }, 0);

  var costMap = {};
  getRows_('Products').forEach(function(p) { costMap[p.id] = parseFloat(p.costPrice)||0; });
  var totalCost   = allItems.reduce(function(s,i) { return s + ((costMap[i.productId]||0) * parseInt(i.quantity)); }, 0);
  var grossProfit = totalRevenue - totalCost;

  var dailyMap = {};
  sales.forEach(function(s) {
    var day = s.createdAt.split('T')[0];
    if (!dailyMap[day]) dailyMap[day] = { revenue:0, transactions:0 };
    dailyMap[day].revenue     += parseFloat(s.finalAmount);
    dailyMap[day].transactions++;
  });
  var daily = Object.entries(dailyMap).map(function(e) { return Object.assign({date:e[0]},e[1]); })
    .sort(function(a,b) { return a.date.localeCompare(b.date); });

  var pSales = {};
  allItems.forEach(function(i) {
    if (!pSales[i.productId]) pSales[i.productId] = { name:i.productName, quantity:0, revenue:0 };
    pSales[i.productId].quantity += parseInt(i.quantity);
    pSales[i.productId].revenue  += parseFloat(i.totalPrice);
  });
  var topProducts = Object.entries(pSales).map(function(e) { return Object.assign({id:e[0]},e[1]); })
    .sort(function(a,b) { return b.revenue - a.revenue; }).slice(0,10);

  var products = getRows_('Products');
  var lowStock = products.filter(function(p) { return parseInt(p.stock) <= parseInt(p.minStock||5); })
    .map(function(p) { return { id:p.id, name:p.name, stock:parseInt(p.stock), minStock:parseInt(p.minStock||5) }; });

  return {
    totalRevenue: totalRevenue, totalDiscount: totalDiscount,
    totalTransactions: totalTransactions, totalItemsSold: totalItemsSold,
    grossProfit: grossProfit, totalMembers: getRows_('Members').length,
    daily: daily, topProducts: topProducts, lowStock: lowStock,
  };
}

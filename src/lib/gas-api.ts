const GAS_URL = 'https://script.google.com/macros/s/AKfycbyJwEujUeigNQjp0SbZnZebHR5Js6zgZCHWzwgEHRe0jDk1Eq6qWoAilMLskquvXZqE/exec';

interface GasResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

async function gasGet<T>(action: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ action, ...params });
  const res = await fetch(`${GAS_URL}?${qs}`, { redirect: 'follow' });
  const json: GasResponse<T> = await res.json();
  if (!json.ok) throw new Error(json.error || 'GAS error');
  return json.data as T;
}

async function gasPost<T>(action: string, payload: object = {}): Promise<T> {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action, ...payload }),
  });
  const json: GasResponse<T> = await res.json();
  if (!json.ok) throw new Error(json.error || 'GAS error');
  return json.data as T;
}

export const gasApi = {
  getProducts: (search = '') => gasGet<object[]>('getProducts', search ? { search } : {}),
  saveProduct: (data: object) => gasPost('saveProduct', data),
  deleteProduct: (id: string) => gasPost('deleteProduct', { id }),

  getMembers: (search = '') => gasGet<object[]>('getMembers', search ? { search } : {}),
  saveMember: (data: object) => gasPost('saveMember', data),
  deleteMember: (id: string) => gasPost('deleteMember', { id }),

  getCategories: () => gasGet<object[]>('getCategories'),
  saveCategory: (data: object) => gasPost('saveCategory', data),
  deleteCategory: (id: string) => gasPost('deleteCategory', { id }),

  getSuppliers: () => gasGet<object[]>('getSuppliers'),
  saveSupplier: (data: object) => gasPost('saveSupplier', data),
  deleteSupplier: (id: string) => gasPost('deleteSupplier', { id }),

  getSales: (dateFrom?: string, dateTo?: string) => {
    const p: Record<string, string> = {};
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    return gasGet<object[]>('getSales', p);
  },
  getSaleDetail: (id: string) => gasGet<object>('getSaleDetail', { id }),
  createSale: (data: object) => gasPost('createSale', data),
  voidSale: (id: string) => gasPost('voidSale', { id }),

  getReportSummary: (dateFrom?: string, dateTo?: string) => {
    const p: Record<string, string> = {};
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo) p.dateTo = dateTo;
    return gasGet<object>('getReportSummary', p);
  },

  getParkedBills: () => gasGet<object[]>('getParkedBills'),
  parkBill: (data: object) => gasPost('parkBill', data),
  updateParkedBill: (id: string, status: string) => gasPost('updateParkedBill', { id, status }),

  updateStock: (id: string, stock: number) => gasPost('updateStock', { id, stock }),
  ensureSheets: () => gasPost('ensureSheets', {}),
};

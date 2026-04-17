import { NextRequest, NextResponse } from 'next/server';
import { readSheet } from '@/lib/google-sheets';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];

    const salesRows = await readSheet('Sales!A2:O');
    const sales = salesRows
      .filter((r) => r[0] && r[13] !== 'voided')
      .filter((r) => r[14] >= dateFrom && r[14] <= dateTo + 'T23:59:59');

    const totalRevenue = sales.reduce((s, r) => s + (parseFloat(r[6]) || 0), 0);
    const totalDiscount = sales.reduce((s, r) => s + (parseFloat(r[5]) || 0), 0);
    const totalTransactions = sales.length;

    const itemRows = await readSheet('SaleItems!A2:I');
    const saleIds = new Set(sales.map((r) => r[0]));
    const relevantItems = itemRows.filter((r) => r[1] && saleIds.has(r[1]));
    const totalItemsSold = relevantItems.reduce((s, r) => s + (parseInt(r[5]) || 0), 0);

    // Cost of goods sold
    const productRows = await readSheet('Products!A2:G');
    const costMap: Record<string, number> = {};
    productRows.forEach((r) => { if (r[0]) costMap[r[0]] = parseFloat(r[6]) || 0; });
    const totalCost = relevantItems.reduce((s, r) => s + ((costMap[r[2]] || 0) * (parseInt(r[5]) || 0)), 0);
    const grossProfit = totalRevenue - totalCost;

    // Daily breakdown
    const dailyMap: Record<string, { revenue: number; transactions: number }> = {};
    sales.forEach((r) => {
      const day = r[14].split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { revenue: 0, transactions: 0 };
      dailyMap[day].revenue += parseFloat(r[6]) || 0;
      dailyMap[day].transactions += 1;
    });
    const daily = Object.entries(dailyMap)
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    relevantItems.forEach((r) => {
      const pid = r[2];
      if (!productSales[pid]) productSales[pid] = { name: r[3], quantity: 0, revenue: 0 };
      productSales[pid].quantity += parseInt(r[5]) || 0;
      productSales[pid].revenue += parseFloat(r[8]) || 0;
    });
    const topProducts = Object.entries(productSales)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Low stock
    const allProducts = productRows.filter((r) => r[0]);
    const lowStock = allProducts
      .filter((r) => (parseInt(r[7]) || 0) <= (parseInt(r[9]) || 5))
      .map((r) => ({ id: r[0], name: r[1], stock: parseInt(r[7]) || 0, minStock: parseInt(r[9]) || 5 }));

    const memberRows = await readSheet('Members!A2:A');
    const totalMembers = memberRows.filter((r) => r[0]).length;

    return NextResponse.json({
      totalRevenue,
      totalDiscount,
      totalTransactions,
      totalItemsSold,
      grossProfit,
      totalMembers,
      daily,
      topProducts,
      lowStock,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

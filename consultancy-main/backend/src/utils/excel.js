import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import Report from '../models/Report.js';
import Invoice from '../models/Invoice.js';

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function generateSalesSummaryWorkbook({ from, to }) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sales Summary');

  ws.columns = [
    { header: 'Date', key: 'date', width: 18 },
    { header: 'Invoice No', key: 'number', width: 18 },
    { header: 'Customer', key: 'customer', width: 24 },
    { header: 'Items', key: 'items', width: 8 },
    { header: 'Subtotal', key: 'subtotal', width: 12 },
    { header: 'Tax', key: 'tax', width: 10 },
    { header: 'Discount', key: 'discount', width: 12 },
    { header: 'Grand Total', key: 'total', width: 14 },
    { header: 'Payment Methods', key: 'methods', width: 22 }
  ];

  const q = {};
  if (from) q.date = { ...(q.date || {}), $gte: new Date(from) };
  if (to) q.date = { ...(q.date || {}), $lte: new Date(to) };

  const invoices = await Invoice.find(q).sort({ date: 1 }).lean();
  for (const inv of invoices) {
    ws.addRow({
      date: inv.date?.toISOString?.().slice(0, 10) || '',
      number: inv.number,
      customer: inv.customerName || 'Walk-in',
      items: inv.items?.reduce((a, i) => a + i.qty, 0) || 0,
      subtotal: inv.subtotal,
      tax: inv.tax,
      discount: inv.discount || 0,
      total: inv.total,
      methods: (inv.payments || []).map((p) => `${p.method}:${p.amount}`).join(', ')
    });
  }

  const subtotalSum = invoices.reduce((a, r) => a + (r.subtotal || 0), 0);
  const taxSum = invoices.reduce((a, r) => a + (r.tax || 0), 0);
  const discountSum = invoices.reduce((a, r) => a + (r.discount || 0), 0);
  const totalSum = invoices.reduce((a, r) => a + (r.total || 0), 0);
  const footer = ws.addRow({ date: 'TOTALS', subtotal: subtotalSum, tax: taxSum, discount: discountSum, total: totalSum });
  footer.font = { bold: true };

  return wb;
}

export async function saveWorkbookAndRecord({ wb, type, title }) {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const base = path.join(process.cwd(), 'storage', 'reports', y, m);
  ensureDirSync(base);
  const fileName = `${type}-${now.toISOString().replace(/[:.]/g, '-')}.xlsx`;
  const filePath = path.join(base, fileName);

  await wb.xlsx.writeFile(filePath);
  const size = fs.statSync(filePath).size;

  const rec = await Report.create({ type, title, params: {}, filePath, fileName, size });
  return rec;
}

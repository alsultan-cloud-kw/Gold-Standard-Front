import type { ProductAuthenticityResponse } from '../services/api';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildVerificationCertificateHtml(
  payload: ProductAuthenticityResponse,
  locale: 'ar' | 'en',
): string {
  const isAr = locale === 'ar';
  const product = payload.product;
  const title = isAr ? 'شهادة تحقق المنتج' : 'Product Verification Certificate';
  const verified = payload.verified;
  const statusLine = isAr ? payload.message_ar : payload.message_en;
  const rows = product
    ? [
        [isAr ? 'المنتج' : 'Product', isAr ? product.name_ar : product.name_en],
        [isAr ? 'الرقم التسلسلي' : 'Serial', product.serial_number || product.sku],
        [isAr ? 'رمز المنتج' : 'SKU', product.sku],
        [isAr ? 'العيار' : 'Karat', product.carat_value ? `${product.carat_value}K` : '—'],
        [isAr ? 'الوزن' : 'Weight', `${product.weight_grams} g`],
        [isAr ? 'سنة التسجيل' : 'Registered', String(product.registered_year || '—')],
        [isAr ? 'رمز QR' : 'QR value', product.qr_value],
        [isAr ? 'تاريخ التحقق' : 'Verified at', new Date(payload.verified_at).toLocaleString(isAr ? 'ar-KW' : 'en-KW')],
      ]
    : [];

  const rowHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${esc(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;color:#111827;">${esc(String(value))}</td></tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${isAr ? 'ar' : 'en'}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f8fafc; color: #111827; }
    .page { max-width: 760px; margin: 24px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .head { background: linear-gradient(135deg, #3F6F00, #85E307); color: #0B0F19; padding: 24px; }
    .badge { display:inline-block; padding:6px 12px; border-radius:999px; background:${verified ? '#ecfccb' : '#fef3c7'}; color:${verified ? '#3F6F00' : '#92400e'}; font-weight:700; font-size:12px; }
    .body { padding: 24px; }
    table { width:100%; border-collapse: collapse; margin-top: 16px; }
    .foot { padding: 16px 24px 24px; font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="page">
    <div class="head">
      <div class="badge">${verified ? (isAr ? 'موثوق' : 'Verified') : (isAr ? 'غير مؤكد' : 'Not verified')}</div>
      <h1 style="margin:12px 0 6px;font-size:24px;">${esc(title)}</h1>
      <p style="margin:0;opacity:.85;">Gold Standard · goldstandardkw.com</p>
    </div>
    <div class="body">
      <p>${esc(statusLine)}</p>
      ${product?.primary_image_url ? `<img src="${esc(product.primary_image_url)}" alt="" style="width:220px;height:220px;object-fit:cover;border-radius:12px;border:1px solid #e5e7eb;margin:12px 0;" />` : ''}
      <table>${rowHtml}</table>
    </div>
    <div class="foot">${isAr ? 'هذه الشهادة تؤكد مطابقة المنتج مع سجل Gold Standard وقت إصدارها.' : 'This certificate confirms registry match at the time of issue.'}</div>
  </div>
</body>
</html>`;
}

export function downloadVerificationCertificate(
  payload: ProductAuthenticityResponse,
  locale: 'ar' | 'en',
): void {
  const html = buildVerificationCertificateHtml(payload, locale);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const serial = payload.product?.serial_number || payload.product?.sku || 'product';
  const a = document.createElement('a');
  a.href = url;
  a.download = `gold-standard-verification-${serial}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function printVerificationCertificate(
  payload: ProductAuthenticityResponse,
  locale: 'ar' | 'en',
): void {
  const html = buildVerificationCertificateHtml(payload, locale);
  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}

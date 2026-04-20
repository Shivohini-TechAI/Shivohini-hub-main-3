import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const API = "http://localhost:5000";

interface GeneratePDFOptions {
  invoiceNumber: string;
  clientName: string;
  currency: string;
  invoiceId?: string;
}

// 🔥 FIXED: skip fetch if already base64
async function loadImageAsBase64(url: string): Promise<string> {
  // If already base64, return as-is
  if (url.startsWith('data:')) {
    return url;
  }

  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

async function uploadPDF(invoiceId: string, blob: Blob) {
  const formData = new FormData();
  formData.append("pdf", blob, "invoice.pdf");

  const res = await fetch(`${API}/invoice-pdf/${invoiceId}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Failed to upload PDF");
  }

  return res.json();
}

export async function generateInvoicePDF(options: GeneratePDFOptions): Promise<void> {
  const { invoiceNumber, clientName, currency, invoiceId } = options;

  const invoiceElement = document.getElementById('invoice-preview');
  if (!invoiceElement) {
    throw new Error('Invoice preview element not found');
  }

  // 🔥 FIXED: only fetch images that are actual URLs, skip base64
  const images = invoiceElement.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map(async (img) => {
      if (img instanceof HTMLImageElement) {
        try {
          const src = img.src;

          // Skip if already base64
          if (src.startsWith('data:')) return;

          // Skip if empty
          if (!src) return;

          let imgUrl = src;
          if (!imgUrl.startsWith('http')) {
            imgUrl = `${window.location.origin}${imgUrl}`;
          }

          const base64 = await loadImageAsBase64(imgUrl);
          img.src = base64;
        } catch (error) {
          console.error('Failed to load image:', img.src, error);
          // Don't throw — just skip this image
        }
      }
    })
  );

  const canvas = await html2canvas(invoiceElement, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: invoiceElement.scrollWidth,
    windowHeight: invoiceElement.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');

  const pdfWidth = 210;
  const pdfHeight = 297;

  const imgWidthMm = (canvas.width / 2) * 0.264583;
  const imgHeightMm = (canvas.height / 2) * 0.264583;

  const ratio = Math.min(pdfWidth / imgWidthMm, pdfHeight / imgHeightMm);
  const scaledWidth = imgWidthMm * ratio;
  const scaledHeight = imgHeightMm * ratio;
  const x = (pdfWidth - scaledWidth) / 2;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  pdf.setProperties({
    title: invoiceNumber,
    subject: `Invoice for ${clientName}`,
    author: 'Shivohini TechAI',
    creator: 'Shivohini-Hub Invoice System',
  });

  // 🔥 Multi-page support
  let yOffset = 0;
  let page = 0;
  while (yOffset < scaledHeight) {
    if (page > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', x, -yOffset, scaledWidth, scaledHeight);
    yOffset += pdfHeight;
    page++;
  }

  const safeClientName = (clientName || 'client')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();

  const filename = `${invoiceNumber}-${safeClientName}-${currency}.pdf`;

  const pdfBlob = pdf.output("blob");

  if (invoiceId) {
    try {
      await uploadPDF(invoiceId, pdfBlob);
      console.log("✅ PDF uploaded successfully");
    } catch (err) {
      console.error("❌ PDF upload failed:", err);
    }
  }

  pdf.save(filename);
}
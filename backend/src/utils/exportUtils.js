const PDFDocument = require('pdfkit');

function generateCSV(res, filename, data, fields) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  
  if (data.length === 0) {
    return res.end();
  }

  const header = fields.map(f => `"${f.label.replace(/"/g, '""')}"`).join(',');
  const rows = data.map(item => fields.map(f => {
    let val = item[f.key];
    if (val === null || val === undefined) val = '';
    
    // Formatting date
    if (val instanceof Date) {
      val = val.toISOString().split('T')[0];
    }
    
    val = String(val).replace(/"/g, '""');
    // Prevent CSV formula injection (matches handleDownloadReport sanitization)
    if (/^[=+\-@\t\r\n]/.test(val)) {
      val = "'" + val;
    }
    return `"${val}"`;
  }).join(','));
  
  const csvStr = [header, ...rows].join('\n');
  res.send(csvStr);
}

function generatePDF(res, title, filename, data, fields) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

  const doc = new PDFDocument({ margin: 30, size: 'A4' });
  doc.pipe(res);
  
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(10);
  const columnWidth = 530 / fields.length;
  
  // Draw Headers
  const headerY = doc.y;
  fields.forEach((f, i) => {
      doc.text(f.label, 30 + (i * columnWidth), headerY, { width: columnWidth - 10, align: 'left', oblique: true });
  });
  
  doc.moveDown(0.5);
  doc.moveTo(30, doc.y).lineTo(560, doc.y).stroke();
  doc.moveDown(0.5);
  
  // Draw Rows
  data.forEach(item => {
      // Add page if near bottom
      if (doc.y > 770) {
        doc.addPage();
      }
      
      const startY = doc.y;
      let maxContentY = startY;
      
      fields.forEach((f, i) => {
          let val = item[f.key];
          if (val === null || val === undefined) val = '';
          else if (val instanceof Date) val = val.toISOString().split('T')[0];
          else val = String(val);

          doc.text(val, 30 + (i * columnWidth), startY, { width: columnWidth - 10, align: 'left' });
          if (doc.y > maxContentY) maxContentY = doc.y; 
      });
      
      doc.y = maxContentY + 8; // Row padding
  });
  
  // Footer - positioned relative to page height to avoid overflow
  doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, 30, doc.page.height - 30, { align: 'center' });

  doc.end();
}

module.exports = {
  generateCSV,
  generatePDF,
};

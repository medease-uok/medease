const PDFDocument = require('pdfkit');

const COLORS = {
  primary: '#1e40af',
  text: '#1e293b',
  muted: '#64748b',
  border: '#cbd5e1',
  headerBg: '#f1f5f9',
  severeMild: '#16a34a',
  severeMod: '#d97706',
  severeSevere: '#dc2626',
};

function formatDate(val) {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function severityColor(sev) {
  if (sev === 'severe') return COLORS.severeSevere;
  if (sev === 'moderate') return COLORS.severeMod;
  return COLORS.severeMild;
}

function addPageHeader(doc, patientName) {
  doc.fontSize(8).fillColor(COLORS.muted)
    .text(`MedEase - Medical Record for ${patientName}`, 50, 20, { align: 'right' });
  doc.moveTo(50, 35).lineTo(doc.page.width - 50, 35).strokeColor(COLORS.border).lineWidth(0.5).stroke();
}

function checkPageSpace(doc, needed, patientName) {
  if (doc.y + needed > doc.page.height - 60) {
    doc.addPage();
    addPageHeader(doc, patientName);
    doc.y = 50;
  }
}

function drawSectionTitle(doc, title, patientName) {
  checkPageSpace(doc, 40, patientName);
  doc.moveDown(0.8);
  doc.fontSize(13).fillColor(COLORS.primary).text(title);
  doc.moveTo(50, doc.y + 2).lineTo(doc.page.width - 50, doc.y + 2)
    .strokeColor(COLORS.primary).lineWidth(1).stroke();
  doc.moveDown(0.4);
}

/**
 * Generate a PDF buffer containing the patient's complete medical history.
 *
 * @param {object} data
 * @param {object} data.patient - Patient profile
 * @param {object[]} data.allergies - Allergy list
 * @param {object[]} data.medicalRecords - Diagnosis/treatment records
 * @param {object[]} data.prescriptions - Prescription history
 * @param {object[]} data.labReports - Lab test results
 * @returns {Promise<Buffer>}
 */
function generateMedicalPdf(data) {
  return new Promise((resolve, reject) => {
    const { patient, allergies, medicalRecords, prescriptions, labReports } = data;
    const patientName = `${patient.firstName} ${patient.lastName}`;

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `Medical Record - ${patientName}`,
        Author: 'MedEase Hospital Management System',
        Subject: 'Medical History Export',
      },
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // === COVER / HEADER ===
    doc.fontSize(22).fillColor(COLORS.primary).text('MedEase', { align: 'center' });
    doc.fontSize(10).fillColor(COLORS.muted).text('Hospital Management System', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(16).fillColor(COLORS.text).text('Medical History Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(COLORS.muted)
      .text(`Generated on ${formatDate(new Date())}`, { align: 'center' });
    doc.moveDown(1.5);

    // === PATIENT INFO ===
    drawSectionTitle(doc, 'Patient Information', patientName);

    const info = [
      ['Name', patientName],
      ['Date of Birth', formatDate(patient.dateOfBirth)],
      ['Gender', patient.gender || '-'],
      ['Blood Type', patient.bloodType || '-'],
      ['Phone', patient.phone || '-'],
      ['Address', patient.address || '-'],
    ];

    if (patient.emergencyContact) {
      info.push(['Emergency Contact', `${patient.emergencyContact} (${patient.emergencyRelationship || '-'}) - ${patient.emergencyPhone || '-'}`]);
    }
    if (patient.insuranceProvider) {
      info.push(['Insurance', `${patient.insuranceProvider} - ${patient.insurancePolicyNumber || '-'} (${patient.insurancePlanType || '-'})`]);
    }
    if (patient.organDonor) {
      const organs = patient.organsToDonate?.length ? patient.organsToDonate.join(', ') : 'Not specified';
      info.push(['Organ Donor', `Yes - ${organs}`]);
    }

    for (const [label, value] of info) {
      checkPageSpace(doc, 16, patientName);
      doc.fontSize(9).fillColor(COLORS.muted).text(`${label}: `, { continued: true });
      doc.fillColor(COLORS.text).text(value);
    }

    // === ALLERGIES ===
    drawSectionTitle(doc, `Allergies (${allergies.length})`, patientName);

    if (allergies.length === 0) {
      doc.fontSize(9).fillColor(COLORS.muted).text('No known allergies.');
    } else {
      for (const a of allergies) {
        checkPageSpace(doc, 20, patientName);
        doc.fontSize(9).fillColor(severityColor(a.severity))
          .text(`[${a.severity.toUpperCase()}] `, { continued: true });
        doc.fillColor(COLORS.text).text(`${a.allergen}`, { continued: true });
        if (a.reaction) {
          doc.fillColor(COLORS.muted).text(` - ${a.reaction}`);
        } else {
          doc.text('');
        }
      }
    }

    // === MEDICAL RECORDS ===
    drawSectionTitle(doc, `Medical Records (${medicalRecords.length})`, patientName);

    if (medicalRecords.length === 0) {
      doc.fontSize(9).fillColor(COLORS.muted).text('No medical records.');
    } else {
      for (const r of medicalRecords) {
        checkPageSpace(doc, 45, patientName);
        doc.fontSize(9).fillColor(COLORS.text).text(r.diagnosis || 'Medical Record', { underline: true });
        if (r.doctorName) {
          doc.fontSize(8).fillColor(COLORS.muted).text(`${r.doctorName} | ${formatDate(r.createdAt)}`);
        }
        if (r.treatment) {
          doc.fontSize(8).fillColor(COLORS.text).text(`Treatment: ${r.treatment}`);
        }
        if (r.notes) {
          doc.fontSize(8).fillColor(COLORS.muted).text(`Notes: ${r.notes}`);
        }
        doc.moveDown(0.3);
      }
    }

    // === PRESCRIPTIONS ===
    drawSectionTitle(doc, `Prescriptions (${prescriptions.length})`, patientName);

    if (prescriptions.length === 0) {
      doc.fontSize(9).fillColor(COLORS.muted).text('No prescriptions.');
    } else {
      for (const rx of prescriptions) {
        checkPageSpace(doc, 35, patientName);
        const statusStr = rx.status ? ` [${rx.status.toUpperCase()}]` : '';
        doc.fontSize(9).fillColor(COLORS.text)
          .text(`${rx.medication}${statusStr}`, { underline: true });
        doc.fontSize(8).fillColor(COLORS.muted)
          .text(`${rx.dosage} | ${rx.frequency}${rx.duration ? ` | ${rx.duration}` : ''}`);
        if (rx.doctorName) {
          doc.fontSize(8).fillColor(COLORS.muted).text(`Prescribed by ${rx.doctorName} on ${formatDate(rx.createdAt)}`);
        }
        doc.moveDown(0.3);
      }
    }

    // === LAB REPORTS ===
    drawSectionTitle(doc, `Lab Reports (${labReports.length})`, patientName);

    if (labReports.length === 0) {
      doc.fontSize(9).fillColor(COLORS.muted).text('No lab reports.');
    } else {
      for (const lr of labReports) {
        checkPageSpace(doc, 35, patientName);
        doc.fontSize(9).fillColor(COLORS.text).text(lr.testName || 'Lab Test', { underline: true });
        doc.fontSize(8).fillColor(COLORS.muted).text(`Date: ${formatDate(lr.reportDate)}`);
        if (lr.result) {
          doc.fontSize(8).fillColor(COLORS.text).text(`Result: ${lr.result}`);
        }
        if (lr.notes) {
          doc.fontSize(8).fillColor(COLORS.muted).text(`Notes: ${lr.notes}`);
        }
        if (lr.technicianName) {
          doc.fontSize(8).fillColor(COLORS.muted).text(`Technician: ${lr.technicianName}`);
        }
        doc.moveDown(0.3);
      }
    }

    // === FOOTER ===
    doc.moveDown(1);
    doc.fontSize(7).fillColor(COLORS.muted)
      .text('This document is confidential and intended only for the authorized recipient.', { align: 'center' })
      .text('Generated by MedEase Hospital Management System.', { align: 'center' });

    doc.end();
  });
}

module.exports = generateMedicalPdf;

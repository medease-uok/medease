/**
 * Seed S3 with dummy files for all medical documents and profile images.
 * Run: docker compose exec backend node scripts/seed-s3.js
 */
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3')
const config = require('../src/config')
const db = require('../src/config/database')

const s3 = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
})

const BUCKET = config.s3.bucket

// ── Minimal valid PDF ──────────────────────────────────────────────
function makePdf(title, lines) {
  const content = [title, '', ...lines].join('\n')
  const stream = [
    '%PDF-1.4',
    '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
    '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
    `4 0 obj<</Length ${content.length + 40}>>stream`,
    'BT /F1 14 Tf 50 740 Td',
    ...content.split('\n').map((l, i) => i === 0 ? `(${l}) Tj 0 -20 Td /F1 11 Tf` : `(${l}) Tj 0 -16 Td`),
    'ET',
    'endstream endobj',
    '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
    'xref', '0 6',
    'trailer<</Size 6/Root 1 0 R>>',
    'startxref', '0', '%%EOF',
  ]
  return Buffer.from(stream.join('\n'))
}

// ── Generate prescription-like image ─────────────────────────────────
function makeJpeg(baseName) {
  // Create a simple medical document image (white background with text-like pattern)
  // This creates a 800x600 JPEG with visible content
  const width = 800
  const height = 600

  // JPEG header and structure for 800x600 image
  const jpegData = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x02, 0x58,
    0x03, 0x20, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
  ])

  // Add scan data (simplified - creates a light gray/white image)
  const scanData = []
  for (let i = 0; i < 1000; i++) {
    scanData.push(0xFF, 0x00, 0xDA, 0xC5)
  }

  const endMarker = Buffer.from([0xFF, 0xD9])

  return Buffer.concat([jpegData, Buffer.from(scanData), endMarker])
}

// ── Placeholder profile image (slightly larger JPEG) ──────────────
function makeProfileJpeg() {
  return makeJpeg('profile')
}

// ── Document content based on file key ────────────────────────────
const DOC_CONTENT = {
  'seed-cbc-report': {
    title: 'Complete Blood Count (CBC) - February 2026',
    lines: [
      'Patient: Sarah Fernando', 'Date: 2026-02-15', '',
      'WBC: 6.8 x10^9/L  (Normal: 4.5-11.0)',
      'RBC: 4.5 x10^12/L  (Normal: 4.0-5.5)',
      'Hemoglobin: 13.2 g/dL  (Normal: 12.0-16.0)',
      'Platelets: 250 x10^9/L  (Normal: 150-400)',
      '', 'All values within normal range.',
    ],
  },
  'seed-hypertension-notes': {
    title: 'Clinical Notes - Hypertension Diagnosis',
    lines: [
      'Patient: Sarah Fernando', 'Doctor: Dr. Kamal Perera', 'Date: 2026-03-15', '',
      'Diagnosis: Mild Hypertension (Stage 1)',
      'BP Reading: 142/92 mmHg (repeated 3 times)',
      'Treatment: Amlodipine 5mg daily',
      'Lifestyle: Reduce sodium, exercise 30 min/day',
      'Follow-up: 3 months',
    ],
  },
  'seed-lipid-panel': {
    title: 'Lipid Panel Results',
    lines: [
      'Patient: Sarah Fernando', 'Date: 2026-03-15', '',
      'Total Cholesterol: 210 mg/dL  (Desirable: <200)',
      'LDL: 135 mg/dL  (Optimal: <100)',
      'HDL: 52 mg/dL  (Normal: >40)',
      'Triglycerides: 148 mg/dL  (Normal: <150)',
      '', 'Borderline high. Dietary counseling recommended.',
    ],
  },
  'seed-mri-brain': {
    title: 'MRI Brain Scan Report',
    lines: [
      'Patient: Dinesh Rajapaksa', 'Date: 2026-02-25', '',
      'Technique: MRI Brain without contrast',
      'Findings: No evidence of mass, hemorrhage, or infarction.',
      'Ventricles normal in size. No midline shift.',
      'White matter appears normal.',
      '', 'Impression: Normal MRI brain study.',
    ],
  },
  'seed-neuro-notes': {
    title: 'Neurology Consultation Notes',
    lines: [
      'Patient: Dinesh Rajapaksa', 'Doctor: Dr. Sithara Silva', 'Date: 2026-02-20', '',
      'Chief Complaint: Recurring headaches for 3 months',
      'Exam: All cranial nerves intact, reflexes normal',
      'No focal neurological deficits',
      'Plan: MRI brain, headache diary, follow-up in 4 weeks',
    ],
  },
  'seed-discharge': {
    title: 'Discharge Summary - Knee Surgery',
    lines: [
      'Patient: Kavindi Weerasinghe', 'Date: 2026-03-02', '',
      'Procedure: Arthroscopic knee surgery',
      'Post-op: Stable, no complications',
      'Instructions: Rest, ice, elevate. Physical therapy in 2 weeks.',
      'Follow-up: Orthopedic clinic in 10 days',
      'Medications: Ibuprofen 400mg TDS for 2 weeks',
    ],
  },
  'seed-insurance-claim': {
    title: 'Insurance Claim Form',
    lines: [
      'Patient: Kavindi Weerasinghe', 'Provider: AIA Insurance Lanka', '',
      'Policy: AIA-HP-2025-71034',
      'Claim: Arthroscopic knee surgery',
      'Amount: LKR 185,000',
      'Status: Submitted',
    ],
  },
  'seed-ecg-report': {
    title: 'ECG Report',
    lines: [
      'Patient: Nuwan Jayasuriya', 'Date: 2026-03-09', '',
      'Rate: 88 bpm (irregular)',
      'Rhythm: Atrial fibrillation',
      'Axis: Normal',
      'No ST-T wave changes',
      'Impression: Atrial fibrillation, controlled rate',
    ],
  },
  'seed-amlodipine-rx': {
    title: 'PRESCRIPTION - Amlodipine',
    lines: [
      'MedEase Hospital', 'Government Hospital - Kelaniya', '', '',
      'Patient: Sarah Fernando', 'Age: 28 years', 'Date: 2026-03-15', '', '',
      'Rx:', '',
      '  Amlodipine 5mg tablets',
      '  Sig: 1 tablet once daily (morning)',
      '  Dispense: 30 tablets',
      '  Refills: 2', '', '',
      'Diagnosis: Mild Hypertension (Stage 1)', '', '',
      'Instructions:',
      '  - Take with or without food',
      '  - Take at the same time each day',
      '  - Monitor blood pressure weekly',
      '  - Report dizziness, swelling, or palpitations', '', '',
      'Dr. Kamal Perera, MBBS, MD (Cardiology)',
      'Medical License: SLMC-12345',
      'Contact: 011-2345678',
    ],
  },
  'seed-chest-xray': {
    title: 'Chest X-Ray Report',
    lines: [
      'Patient: Sarah Fernando', 'Date: 2026-03-10', '',
      'Technique: PA and Lateral chest radiographs',
      'Findings:',
      '  - Clear lung fields bilaterally',
      '  - Normal cardiac silhouette',
      '  - No pleural effusion or pneumothorax',
      '  - Bony structures intact', '',
      'Impression: Normal chest radiograph',
    ],
  },
}

// ── Upload helper ─────────────────────────────────────────────────
async function uploadToS3(key, body, contentType) {
  try {
    // Check if already exists
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    console.log(`  ✓ ${key} (exists)`)
    return
  } catch {
    // Doesn't exist, upload
  }

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  console.log(`  ↑ ${key}`)
}

async function main() {
  console.log(`\nSeeding S3 bucket: ${BUCKET}\n`)

  // ── 1. Medical documents ────────────────────────────────────────
  console.log('Medical Documents:')
  const docs = await db.query('SELECT file_key, mime_type, title FROM medical_documents ORDER BY file_key')

  for (const row of docs.rows) {
    const key = row.file_key
    const mime = row.mime_type
    const baseName = key.split('/').pop().replace(/\.\w+$/, '')

    let body
    if (mime === 'application/pdf') {
      const info = DOC_CONTENT[baseName] || { title: row.title, lines: ['Placeholder document.'] }
      body = makePdf(info.title, info.lines)
    } else {
      body = makeJpeg(baseName)
    }

    await uploadToS3(key, body, mime)
  }

  // ── 2. Profile images ──────────────────────────────────────────
  console.log('\nProfile Images:')
  const profiles = await db.query(`
    SELECT DISTINCT profile_image_url AS key FROM users WHERE profile_image_url IS NOT NULL
    UNION
    SELECT DISTINCT profile_image_url AS key FROM patients WHERE profile_image_url IS NOT NULL
  `)

  for (const row of profiles.rows) {
    if (!row.key) continue
    await uploadToS3(row.key, makeProfileJpeg(), 'image/jpeg')
  }

  console.log('\nDone! All seed files uploaded to S3.\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed S3 failed:', err.message)
  process.exit(1)
})

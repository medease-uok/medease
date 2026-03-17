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

// ── Minimal JPEG (1x1 blue pixel) ─────────────────────────────────
function makeJpeg() {
  // Minimal valid JPEG - 1x1 pixel, blue-ish
  return Buffer.from(
    'ffd8ffe000104a46494600010100000100010000' +
    'ffdb004300080606070605080707070909080a0c' +
    '140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c' +
    '20242e2720222c231c1c2837292c30313434341f' +
    '27393d38323c2e333432ffc0000b080001000101' +
    '011100ffc4001f000001050101010101010000000' +
    '0000000000102030405060708090a0bffc4002610' +
    '000201030302040305050404000001770001020311' +
    '0004210531ffda00080101000003100002004bffd9',
    'hex'
  )
}

// ── Placeholder profile image (slightly larger JPEG) ──────────────
function makeProfileJpeg() {
  return makeJpeg()
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
  'seed-migraine-assessment': {
    title: 'Migraine Assessment Report',
    lines: [
      'Patient: Dinesh Rajapaksa', 'Doctor: Dr. Sithara Silva', 'Date: 2026-03-14', '',
      'Presentation: Recurring unilateral headaches, 3-4 episodes/month',
      'Duration: 4-6 hours per episode',
      'Triggers: Stress, irregular sleep, bright lights',
      'MRI Brain: Normal, no structural abnormalities',
      'Diagnosis: Tension-type headache',
      'Plan: Paracetamol PRN, stress management',
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
  'seed-paracetamol-rx': {
    title: 'Prescription - Paracetamol',
    lines: [
      'Patient: Dinesh Rajapaksa', 'Doctor: Dr. Sithara Silva', '',
      'Rx: Paracetamol 500mg',
      'Sig: 1-2 tablets every 4-6 hours as needed',
      'Max: 4g per day',
      'Duration: 1 month', 'Refills: 2',
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
  'seed-knee-assessment': {
    title: 'Knee Assessment Report',
    lines: [
      'Patient: Kavindi Weerasinghe', 'Doctor: Dr. Ruwan Fernando', '',
      'Diagnosis: Patellofemoral pain syndrome',
      'X-ray: No fracture, mild joint space narrowing',
      'Plan: Physical therapy 2x/week, NSAIDs',
    ],
  },
  'seed-af-assessment': {
    title: 'Atrial Fibrillation Assessment',
    lines: [
      'Patient: Nuwan Jayasuriya', 'Doctor: Dr. Kamal Perera', '',
      'ECG: Irregularly irregular rhythm, AF confirmed',
      'Echocardiogram: EF 55%, normal chamber sizes',
      'CHA2DS2-VASc Score: 2',
      'Plan: Warfarin 5mg daily, monthly INR monitoring',
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
  'seed-inr-report': {
    title: 'INR Monitoring Report',
    lines: [
      'Patient: Nuwan Jayasuriya', 'Date: 2026-03-12', '',
      'INR: 2.3  (Therapeutic range: 2.0-3.0)',
      'Warfarin dose: 5mg daily',
      'Status: Within therapeutic range',
      'Next test: 4 weeks',
    ],
  },
  'seed-anemia-notes': {
    title: 'Iron Deficiency Anemia - Clinical Notes',
    lines: [
      'Patient: Hasini Abeywickrama', 'Doctor: Dr. Anjali Dissanayake', '',
      'Hemoglobin: 9.2 g/dL (Low)',
      'Serum Ferritin: 8 ng/mL (Low)',
      'Diagnosis: Iron deficiency anemia',
      'Treatment: Ferrous sulfate 200mg BD with meals',
      'Dietary counseling provided. Repeat CBC in 6 weeks.',
    ],
  },
  'seed-migraine-notes': {
    title: 'Migraine Assessment - Hasini Abeywickrama',
    lines: [
      'Patient: Hasini Abeywickrama', 'Doctor: Dr. Anjali Dissanayake', '',
      'Type: Migraine without aura, episodic',
      'Frequency: 2-3 episodes/month',
      'Abortive: Sumatriptan 50mg PRN',
      'Prophylaxis: Propranolol 40mg BD',
      'Trigger diary initiated',
    ],
  },
  'seed-ferritin-report': {
    title: 'Serum Ferritin Report',
    lines: [
      'Patient: Hasini Abeywickrama', 'Date: 2026-03-14', '',
      'Serum Ferritin: 8 ng/mL',
      'Reference Range: 12-150 ng/mL',
      'Status: LOW',
      '', 'Consistent with iron deficiency.',
    ],
  },
  'seed-cbc-hasini': {
    title: 'Complete Blood Count - Hasini Abeywickrama',
    lines: [
      'Patient: Hasini Abeywickrama', 'Date: 2026-03-13', '',
      'WBC: 6.8 x10^9/L  (Normal)',
      'RBC: 3.9 x10^12/L  (Low)',
      'Hemoglobin: 9.2 g/dL  (Low)',
      'MCV: 72 fL  (Low - microcytic)',
      'Platelets: 280 x10^9/L  (Normal)',
      '', 'Impression: Microcytic anemia, likely iron deficiency.',
    ],
  },
  'seed-derm-referral': {
    title: 'Dermatology Referral',
    lines: [
      'Patient: Hasini Abeywickrama', 'Referring: Dr. Kamal Perera', '',
      'Reason: Persistent skin rash, 3 weeks duration',
      'Location: Bilateral forearms',
      'Failed treatment: Topical hydrocortisone',
      'Please assess and advise.',
    ],
  },
  'seed-sumatriptan-rx': {
    title: 'Prescription - Sumatriptan',
    lines: [
      'Patient: Hasini Abeywickrama', 'Doctor: Dr. Anjali Dissanayake', '',
      'Rx: Sumatriptan 50mg tablets',
      'Sig: 1 tablet at onset of migraine, may repeat once after 2 hours',
      'Max: 2 tablets/day, 6 tablets/month',
    ],
  },
  'seed-acl-assessment': {
    title: 'ACL Sprain Assessment',
    lines: [
      'Patient: Lahiru Gunasekara', 'Doctor: Dr. Ruwan Fernando', '',
      'Injury: Grade 2 ACL sprain, cricket match',
      'MRI: Partial ACL tear, no meniscal involvement',
      'Plan: Knee brace, rest, ice. PT after 2 weeks.',
      'No surgery needed at this stage.',
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
      body = makeJpeg()
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

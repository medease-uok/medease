-- ICD-10 code reference table and medical_records integration

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE icd10_codes (
  code VARCHAR(10) PRIMARY KEY,
  description TEXT NOT NULL,
  category VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_icd10_description_trgm ON icd10_codes USING gin (description gin_trgm_ops);
CREATE INDEX idx_icd10_category ON icd10_codes (category);

-- Add ICD-10 code column to medical_records
ALTER TABLE medical_records
  ADD COLUMN icd_code VARCHAR(10) REFERENCES icd10_codes(code) ON DELETE SET NULL;

CREATE INDEX idx_medical_records_icd ON medical_records (icd_code);

-- Seed common ICD-10 codes used in Sri Lankan government hospitals
INSERT INTO icd10_codes (code, description, category) VALUES
  -- Infectious diseases
  ('A09', 'Infectious gastroenteritis and colitis, unspecified', 'Infectious Diseases'),
  ('A15.0', 'Tuberculosis of lung', 'Infectious Diseases'),
  ('A90', 'Dengue fever [classical dengue]', 'Infectious Diseases'),
  ('A91', 'Dengue haemorrhagic fever', 'Infectious Diseases'),
  ('B20', 'Human immunodeficiency virus [HIV] disease', 'Infectious Diseases'),
  ('B24', 'Unspecified human immunodeficiency virus [HIV] disease', 'Infectious Diseases'),
  ('B50.9', 'Plasmodium falciparum malaria, unspecified', 'Infectious Diseases'),
  ('B54', 'Unspecified malaria', 'Infectious Diseases'),
  ('B17.1', 'Acute hepatitis C', 'Infectious Diseases'),
  ('B18.1', 'Chronic viral hepatitis B without delta-agent', 'Infectious Diseases'),

  -- Neoplasms
  ('C34.9', 'Malignant neoplasm of bronchus or lung, unspecified', 'Neoplasms'),
  ('C50.9', 'Malignant neoplasm of breast, unspecified', 'Neoplasms'),
  ('C61', 'Malignant neoplasm of prostate', 'Neoplasms'),
  ('C18.9', 'Malignant neoplasm of colon, unspecified', 'Neoplasms'),
  ('C73', 'Malignant neoplasm of thyroid gland', 'Neoplasms'),
  ('D25.9', 'Leiomyoma of uterus, unspecified', 'Neoplasms'),

  -- Blood and immune disorders
  ('D50.9', 'Iron deficiency anaemia, unspecified', 'Blood Disorders'),
  ('D56.1', 'Beta thalassaemia', 'Blood Disorders'),
  ('D64.9', 'Anaemia, unspecified', 'Blood Disorders'),
  ('D69.6', 'Thrombocytopenia, unspecified', 'Blood Disorders'),

  -- Endocrine / metabolic
  ('E03.9', 'Hypothyroidism, unspecified', 'Endocrine'),
  ('E05.9', 'Thyrotoxicosis, unspecified', 'Endocrine'),
  ('E10.9', 'Type 1 diabetes mellitus without complications', 'Endocrine'),
  ('E11.0', 'Type 2 diabetes mellitus with coma', 'Endocrine'),
  ('E11.2', 'Type 2 diabetes mellitus with kidney complications', 'Endocrine'),
  ('E11.4', 'Type 2 diabetes mellitus with neurological complications', 'Endocrine'),
  ('E11.5', 'Type 2 diabetes mellitus with peripheral circulatory complications', 'Endocrine'),
  ('E11.6', 'Type 2 diabetes mellitus with other specified complications', 'Endocrine'),
  ('E11.9', 'Type 2 diabetes mellitus without complications', 'Endocrine'),
  ('E13.9', 'Other specified diabetes mellitus without complications', 'Endocrine'),
  ('E66.9', 'Obesity, unspecified', 'Endocrine'),
  ('E78.0', 'Pure hypercholesterolaemia', 'Endocrine'),
  ('E78.5', 'Hyperlipidaemia, unspecified', 'Endocrine'),
  ('E87.6', 'Hypokalaemia', 'Endocrine'),

  -- Mental and behavioural
  ('F10.2', 'Alcohol dependence syndrome', 'Mental Health'),
  ('F20.9', 'Schizophrenia, unspecified', 'Mental Health'),
  ('F32.9', 'Depressive episode, unspecified', 'Mental Health'),
  ('F33.9', 'Recurrent depressive disorder, unspecified', 'Mental Health'),
  ('F41.0', 'Panic disorder', 'Mental Health'),
  ('F41.1', 'Generalized anxiety disorder', 'Mental Health'),
  ('F41.9', 'Anxiety disorder, unspecified', 'Mental Health'),
  ('F43.1', 'Post-traumatic stress disorder', 'Mental Health'),
  ('F90.0', 'Attention-deficit hyperactivity disorder', 'Mental Health'),

  -- Nervous system
  ('G20', 'Parkinson disease', 'Nervous System'),
  ('G40.9', 'Epilepsy, unspecified', 'Nervous System'),
  ('G43.9', 'Migraine, unspecified', 'Nervous System'),
  ('G44.1', 'Tension-type headache', 'Nervous System'),
  ('G47.3', 'Sleep apnoea', 'Nervous System'),
  ('G56.0', 'Carpal tunnel syndrome', 'Nervous System'),

  -- Eye and ear
  ('H10.9', 'Conjunctivitis, unspecified', 'Eye/Ear'),
  ('H25.9', 'Senile cataract, unspecified', 'Eye/Ear'),
  ('H40.1', 'Primary open-angle glaucoma', 'Eye/Ear'),
  ('H66.9', 'Otitis media, unspecified', 'Eye/Ear'),

  -- Circulatory system
  ('I10', 'Essential (primary) hypertension', 'Cardiovascular'),
  ('I11.9', 'Hypertensive heart disease without heart failure', 'Cardiovascular'),
  ('I20.9', 'Angina pectoris, unspecified', 'Cardiovascular'),
  ('I21.9', 'Acute myocardial infarction, unspecified', 'Cardiovascular'),
  ('I25.1', 'Atherosclerotic heart disease', 'Cardiovascular'),
  ('I25.9', 'Chronic ischaemic heart disease, unspecified', 'Cardiovascular'),
  ('I42.0', 'Dilated cardiomyopathy', 'Cardiovascular'),
  ('I48', 'Atrial fibrillation and flutter', 'Cardiovascular'),
  ('I50.9', 'Heart failure, unspecified', 'Cardiovascular'),
  ('I63.9', 'Cerebral infarction, unspecified', 'Cardiovascular'),
  ('I64', 'Stroke, not specified as haemorrhage or infarction', 'Cardiovascular'),
  ('I67.9', 'Cerebrovascular disease, unspecified', 'Cardiovascular'),
  ('I70.0', 'Atherosclerosis of aorta', 'Cardiovascular'),
  ('I73.9', 'Peripheral vascular disease, unspecified', 'Cardiovascular'),
  ('I80.2', 'Phlebitis and thrombophlebitis of other deep vessels of lower extremities', 'Cardiovascular'),
  ('I83.9', 'Varicose veins of lower extremities without ulcer or inflammation', 'Cardiovascular'),

  -- Respiratory
  ('J00', 'Acute nasopharyngitis [common cold]', 'Respiratory'),
  ('J02.9', 'Acute pharyngitis, unspecified', 'Respiratory'),
  ('J03.9', 'Acute tonsillitis, unspecified', 'Respiratory'),
  ('J06.9', 'Acute upper respiratory infection, unspecified', 'Respiratory'),
  ('J18.9', 'Pneumonia, unspecified', 'Respiratory'),
  ('J20.9', 'Acute bronchitis, unspecified', 'Respiratory'),
  ('J30.1', 'Allergic rhinitis due to pollen', 'Respiratory'),
  ('J31.0', 'Chronic rhinitis', 'Respiratory'),
  ('J34.2', 'Deviated nasal septum', 'Respiratory'),
  ('J42', 'Unspecified chronic bronchitis', 'Respiratory'),
  ('J44.1', 'Chronic obstructive pulmonary disease with acute exacerbation', 'Respiratory'),
  ('J44.9', 'Chronic obstructive pulmonary disease, unspecified', 'Respiratory'),
  ('J45.9', 'Asthma, unspecified', 'Respiratory'),

  -- Digestive system
  ('K20', 'Oesophagitis', 'Digestive'),
  ('K21.0', 'Gastro-oesophageal reflux disease with oesophagitis', 'Digestive'),
  ('K25.9', 'Gastric ulcer, unspecified', 'Digestive'),
  ('K29.7', 'Gastritis, unspecified', 'Digestive'),
  ('K30', 'Functional dyspepsia', 'Digestive'),
  ('K35.8', 'Acute appendicitis, other and unspecified', 'Digestive'),
  ('K40.9', 'Unilateral inguinal hernia without obstruction or gangrene', 'Digestive'),
  ('K57.9', 'Diverticular disease of intestine, unspecified', 'Digestive'),
  ('K58.9', 'Irritable bowel syndrome without diarrhoea', 'Digestive'),
  ('K70.3', 'Alcoholic cirrhosis of liver', 'Digestive'),
  ('K74.6', 'Other and unspecified cirrhosis of liver', 'Digestive'),
  ('K76.0', 'Fatty (change of) liver, not elsewhere classified', 'Digestive'),
  ('K80.2', 'Calculus of gallbladder without cholecystitis', 'Digestive'),
  ('K85.9', 'Acute pancreatitis, unspecified', 'Digestive'),

  -- Skin
  ('L20.9', 'Atopic dermatitis, unspecified', 'Skin'),
  ('L23.9', 'Allergic contact dermatitis, unspecified cause', 'Skin'),
  ('L30.9', 'Dermatitis, unspecified', 'Skin'),
  ('L40.0', 'Psoriasis vulgaris', 'Skin'),
  ('L50.9', 'Urticaria, unspecified', 'Skin'),
  ('L70.0', 'Acne vulgaris', 'Skin'),

  -- Musculoskeletal
  ('M06.9', 'Rheumatoid arthritis, unspecified', 'Musculoskeletal'),
  ('M10.9', 'Gout, unspecified', 'Musculoskeletal'),
  ('M15.9', 'Polyosteoarthritis, unspecified', 'Musculoskeletal'),
  ('M17.9', 'Gonarthrosis [knee osteoarthritis], unspecified', 'Musculoskeletal'),
  ('M19.9', 'Osteoarthritis, unspecified', 'Musculoskeletal'),
  ('M25.5', 'Pain in joint', 'Musculoskeletal'),
  ('M47.9', 'Spondylosis, unspecified', 'Musculoskeletal'),
  ('M54.2', 'Cervicalgia', 'Musculoskeletal'),
  ('M54.5', 'Low back pain', 'Musculoskeletal'),
  ('M54.9', 'Dorsalgia, unspecified', 'Musculoskeletal'),
  ('M75.1', 'Rotator cuff syndrome', 'Musculoskeletal'),
  ('M79.3', 'Panniculitis, unspecified', 'Musculoskeletal'),
  ('M81.9', 'Osteoporosis, unspecified', 'Musculoskeletal'),

  -- Genitourinary
  ('N18.9', 'Chronic kidney disease, unspecified', 'Genitourinary'),
  ('N20.0', 'Calculus of kidney', 'Genitourinary'),
  ('N30.0', 'Acute cystitis', 'Genitourinary'),
  ('N39.0', 'Urinary tract infection, site not specified', 'Genitourinary'),
  ('N40', 'Hyperplasia of prostate', 'Genitourinary'),
  ('N76.0', 'Acute vaginitis', 'Genitourinary'),
  ('N80.9', 'Endometriosis, unspecified', 'Genitourinary'),
  ('N92.1', 'Excessive and frequent menstruation with irregular cycle', 'Genitourinary'),

  -- Pregnancy / perinatal
  ('O24.4', 'Gestational diabetes mellitus', 'Pregnancy'),
  ('O80', 'Single spontaneous delivery', 'Pregnancy'),
  ('O82', 'Single delivery by caesarean section', 'Pregnancy'),

  -- Injuries
  ('S00.9', 'Superficial injury of head, unspecified', 'Injuries'),
  ('S06.0', 'Concussion', 'Injuries'),
  ('S22.3', 'Fracture of rib', 'Injuries'),
  ('S42.0', 'Fracture of clavicle', 'Injuries'),
  ('S52.5', 'Fracture of lower end of radius', 'Injuries'),
  ('S62.6', 'Fracture of other finger', 'Injuries'),
  ('S72.0', 'Fracture of neck of femur', 'Injuries'),
  ('S82.1', 'Fracture of proximal end of tibia', 'Injuries'),
  ('S83.5', 'Sprain and strain of cruciate ligament of knee', 'Injuries'),
  ('S93.4', 'Sprain and strain of ankle', 'Injuries'),
  ('T14.0', 'Superficial injury of unspecified body region', 'Injuries'),
  ('T78.4', 'Allergy, unspecified', 'Injuries'),

  -- Symptoms / signs (R codes)
  ('R00.0', 'Tachycardia, unspecified', 'Symptoms'),
  ('R05', 'Cough', 'Symptoms'),
  ('R06.0', 'Dyspnoea', 'Symptoms'),
  ('R07.4', 'Chest pain, unspecified', 'Symptoms'),
  ('R10.4', 'Other and unspecified abdominal pain', 'Symptoms'),
  ('R11', 'Nausea and vomiting', 'Symptoms'),
  ('R42', 'Dizziness and giddiness', 'Symptoms'),
  ('R50.9', 'Fever, unspecified', 'Symptoms'),
  ('R51', 'Headache', 'Symptoms'),
  ('R53', 'Malaise and fatigue', 'Symptoms'),
  ('R55', 'Syncope and collapse', 'Symptoms'),
  ('R73.0', 'Abnormal glucose tolerance test', 'Symptoms'),

  -- External causes / factors
  ('Z00.0', 'General medical examination', 'Health Factors'),
  ('Z01.0', 'Examination of eyes and vision', 'Health Factors'),
  ('Z23', 'Need for immunization against single bacterial diseases', 'Health Factors'),
  ('Z34.9', 'Supervision of normal pregnancy, unspecified', 'Health Factors'),
  ('Z76.0', 'Issue of repeat prescription', 'Health Factors'),
  ('Z96.6', 'Presence of orthopaedic joint implants', 'Health Factors')
ON CONFLICT (code) DO NOTHING;

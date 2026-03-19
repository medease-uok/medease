-- Prescription type: digital (medicines selected in UI) or handwritten (photo upload)
ALTER TABLE prescriptions ADD COLUMN type VARCHAR(20) DEFAULT 'digital' CHECK (type IN ('digital', 'handwritten'));
ALTER TABLE prescriptions ADD COLUMN notes TEXT;
ALTER TABLE prescriptions ADD COLUMN image_key TEXT;

-- Prescription items: individual medicines in a digital prescription
-- For digital prescriptions, the main prescriptions row stores the first/primary medication
-- Additional medicines are stored here
CREATE TABLE prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  medication VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  instructions TEXT,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

-- Prescription templates: reusable prescription templates for doctors
CREATE TABLE prescription_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prescription_templates_doctor ON prescription_templates(doctor_id);

-- Template items: medicines in a template
CREATE TABLE prescription_template_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES prescription_templates(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  medication VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100),
  instructions TEXT,
  sort_order SMALLINT DEFAULT 0
);

CREATE INDEX idx_template_items_template ON prescription_template_items(template_id);

GRANT ALL ON prescription_items TO medease_app;
GRANT ALL ON prescription_templates TO medease_app;
GRANT ALL ON prescription_template_items TO medease_app;

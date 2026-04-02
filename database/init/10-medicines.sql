-- Medicines table: master list of medicines available in Sri Lankan hospitals
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generic_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  strength VARCHAR(100) NOT NULL,
  form VARCHAR(50) NOT NULL CHECK (form IN ('tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'suppository', 'patch', 'powder', 'solution', 'suspension', 'gel', 'spray', 'other')),
  manufacturer VARCHAR(255),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX idx_medicines_brand_name ON medicines(brand_name);
CREATE INDEX idx_medicines_category ON medicines(category);
CREATE INDEX idx_medicines_active ON medicines(is_active) WHERE is_active = true;

-- Full-text search index for medicine name lookups
CREATE INDEX idx_medicines_search ON medicines USING GIN (
  to_tsvector('english', generic_name || ' ' || COALESCE(brand_name, '') || ' ' || strength)
);

GRANT ALL ON medicines TO medease_app;

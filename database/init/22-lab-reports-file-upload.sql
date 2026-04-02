-- Add file storage support for lab reports

ALTER TABLE lab_reports
ADD COLUMN file_key VARCHAR(500),
ADD COLUMN file_name VARCHAR(255);

COMMENT ON COLUMN lab_reports.file_key IS 'S3 key for uploaded lab report file (PDF, image, etc.)';
COMMENT ON COLUMN lab_reports.file_name IS 'Original filename for display purposes';

CREATE INDEX idx_lab_reports_file_key ON lab_reports(file_key) WHERE file_key IS NOT NULL;

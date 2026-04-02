# File Validation & Malware Scanning

## Overview

The system implements comprehensive file validation for all uploaded files, including:
1. **File Type Validation** - Using magic bytes (not just MIME type)
2. **File Size Validation** - Type-specific size limits
3. **Malware Scanning** - ClamAV integration (optional)

## Security Features

### 1. Magic Byte Validation

Files are validated using actual file content (magic bytes), not just file extension or declared MIME type.

**How it works:**
```javascript
// User uploads "malware.exe" renamed to "report.pdf"
// Declared MIME: application/pdf
// Detected MIME: application/x-msdownload (via magic bytes)
// Result: REJECTED
```

**Prevents:**
- File extension spoofing
- MIME type manipulation
- Executable files disguised as PDFs

### 2. File Size Limits

Type-specific size limits prevent resource exhaustion:

| File Type | Max Size | Use Case |
|-----------|----------|----------|
| PDF | 25 MB | Lab reports, medical documents |
| Images (JPEG/PNG/WebP) | 10 MB | Scanned reports, x-rays |
| Documents (DOC/DOCX) | 20 MB | Text-based reports |

### 3. Malware Scanning

Optional ClamAV integration scans files for viruses and malware.

**If ClamAV is available:**
- ✅ All uploaded files are scanned
- ✅ Infected files are rejected immediately
- ✅ Scan results logged

**If ClamAV is NOT available:**
- ⚠️ Warning logged
- ✅ Upload continues (other validations still apply)
- 💡 Recommended for production

## Setup

### Option 1: Docker (Recommended)

Add ClamAV service to `docker-compose.yml`:

```yaml
clamav:
  image: clamav/clamav:stable
  container_name: medease-clamav
  ports:
    - "3310:3310"
  volumes:
    - clamav-data:/var/lib/clamav
  environment:
    - CLAMAV_NO_FRESHCLAM=false
  healthcheck:
    test: ["CMD", "clamdcheck.sh"]
    interval: 30s
    timeout: 10s
    retries: 3

volumes:
  clamav-data:
```

Then add to backend `.env`:
```env
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
```

Start services:
```bash
docker-compose up -d clamav
docker-compose restart backend
```

### Option 2: Local Installation

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install clamav clamav-daemon
sudo systemctl start clamav-daemon
sudo systemctl enable clamav-daemon
```

#### macOS:
```bash
brew install clamav
brew services start clamav
```

Backend `.env`:
```env
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

### Option 3: No ClamAV (Development Only)

Simply don't configure ClamAV. The system will:
- Log a warning on startup
- Skip malware scanning
- Continue with other validations

**⚠️ NOT recommended for production!**

## Testing

### Test File Type Validation

```bash
# Create a fake PDF (will be rejected)
echo "not a real pdf" > fake.pdf

curl -X POST http://localhost:5001/api/lab-reports \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@fake.pdf" \
  -F "patientId=$PATIENT_ID" \
  -F "testName=Blood Test"

# Expected: 400 - "Could not determine file type"
```

### Test File Size Limit

```bash
# Create a large file (26 MB, exceeds 25 MB limit)
dd if=/dev/zero of=large.pdf bs=1M count=26

curl -X POST http://localhost:5001/api/lab-reports \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@large.pdf" \
  -F "patientId=$PATIENT_ID" \
  -F "testName=Blood Test"

# Expected: 400 - "File size exceeds 25 MB limit"
```

### Test Malware Detection

```bash
# EICAR test file (safe test virus signature)
echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.pdf

curl -X POST http://localhost:5001/api/lab-reports \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@eicar.pdf" \
  -F "patientId=$PATIENT_ID" \
  -F "testName=Blood Test"

# Expected: 400 - "File rejected: malware detected"
```

### Test Valid Upload

```bash
# Create a real PDF
curl -o test-report.pdf https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf

curl -X POST http://localhost:5001/api/lab-reports \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-report.pdf" \
  -F "patientId=$PATIENT_ID" \
  -F "testName=Blood Test"

# Expected: 201 - Success
```

## Validation Flow

```
User uploads file
    ↓
[Multer] Parse multipart/form-data
    ↓
[Multer Filter] Check declared MIME type (basic)
    ↓
[Multer Limit] Check file size (basic)
    ↓
[validateUploadedFile] Comprehensive validation:
    │
    ├─→ Validate declared MIME type is allowed
    │
    ├─→ Validate file size against type-specific limit
    │
    ├─→ Read magic bytes from buffer
    │
    ├─→ Detect actual file type
    │
    ├─→ Verify detected type matches allowed types
    │
    ├─→ If mismatch: log warning, use detected type
    │
    └─→ [ClamAV] Scan for malware (if available)
            │
            ├─→ Clean: Continue
            └─→ Infected: REJECT (400 error)
    ↓
[Controller] Process upload to S3
    ↓
Success
```

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Unsupported file type declared` | MIME type not in allowed list | Use PDF, JPEG, PNG, WebP, DOC, or DOCX |
| `File size exceeds X MB limit` | File too large for its type | Reduce file size or compress |
| `Could not determine file type` | Corrupted or unrecognizable file | Use a valid file |
| `Invalid file type detected: X` | Magic bytes don't match allowed types | File content is not what it claims to be |
| `File rejected: malware detected` | ClamAV found malware | File contains malicious code |

## Logs

### Successful Validation
```
File validated successfully: report.pdf (application/pdf, 2456789 bytes)
File "report.pdf" scanned: clean
```

### MIME Type Mismatch
```
MIME type mismatch: declared=application/pdf, detected=image/jpeg, file=scan.pdf
File validated successfully: scan.pdf (image/jpeg, 1234567 bytes)
```

### Malware Detected
```
Malware detected in file "infected.pdf": ["Eicar-Test-Signature"]
```

### ClamAV Not Available
```
ClamAV not available, malware scanning disabled: connect ECONNREFUSED 127.0.0.1:3310
Malware scanning skipped (ClamAV not available)
```

## Production Checklist

- [ ] ClamAV installed and running
- [ ] Virus definitions up to date (`freshclam`)
- [ ] Environment variables configured
- [ ] Test EICAR file detection
- [ ] Monitor ClamAV logs
- [ ] Set up alerting for malware detections
- [ ] Document incident response procedure

## Maintenance

### Update Virus Definitions

**Docker:**
```bash
docker exec medease-clamav freshclam
```

**Local:**
```bash
sudo freshclam
```

**Automatic updates** are enabled by default in the Docker image.

### Monitor ClamAV Status

```bash
# Docker
docker logs medease-clamav

# Local
sudo systemctl status clamav-daemon
```

### Performance Tuning

ClamAV scanning can be resource-intensive. For high-volume systems:

1. **Increase ClamAV memory:**
   ```yaml
   clamav:
     deploy:
       resources:
         limits:
           memory: 2G
   ```

2. **Use async scanning:**
   - Current implementation is synchronous
   - Consider background job queue for large files

3. **Skip scanning for trusted sources:**
   - Add role-based exemptions if needed
   - Document security trade-offs

## Security Best Practices

1. ✅ **Defense in Depth** - Multiple validation layers
2. ✅ **Fail Secure** - Reject on validation failure
3. ✅ **Logging** - All validations logged
4. ✅ **Type-Specific Limits** - Not one-size-fits-all
5. ✅ **Magic Byte Validation** - Can't be bypassed by renaming
6. ✅ **Optional Malware Scanning** - Graceful degradation if unavailable

## Troubleshooting

### "ClamAV not available"

**Check if ClamAV is running:**
```bash
# Docker
docker ps | grep clamav

# Local
netstat -an | grep 3310
```

**Check connectivity:**
```bash
telnet localhost 3310
```

**Check environment variables:**
```bash
echo $CLAMAV_HOST
echo $CLAMAV_PORT
```

### "File validation taking too long"

- ClamAV scanning can take 1-5 seconds per file
- For large files (>10 MB), consider async processing
- Check ClamAV container resources

### "False positives"

- Update virus definitions: `freshclam`
- Check ClamAV logs for signature name
- Report false positives to ClamAV team
- Whitelist specific signatures (use with caution)

## API Response Examples

### Success
```json
{
  "status": "success",
  "data": {
    "id": "uuid-here"
  }
}
```

### Malware Detected
```json
{
  "status": "error",
  "message": "File rejected: malware detected.",
  "statusCode": 400
}
```

### Invalid File Type
```json
{
  "status": "error",
  "message": "Invalid file type detected: application/x-msdownload. File content does not match allowed types.",
  "statusCode": 400
}
```

### File Too Large
```json
{
  "status": "error",
  "message": "File size exceeds 25 MB limit for application/pdf.",
  "statusCode": 400
}
```

# File Validation & Malware Scanning

## Overview

The system implements comprehensive file validation for all uploaded files, including:
1. **File Type Validation** - Using magic bytes (not just MIME type)
2. **File Size Validation** - Type-specific size limits
3. **Malware Scanning** - VirusTotal cloud API integration (optional)

## ⚠️ HIPAA Compliance Warning

**CRITICAL for Medical Applications**: VirusTotal is a cloud service that uploads files to their servers and may share them with security research partners. This has significant implications for healthcare applications:

### Privacy Concerns
- **File Upload**: Unknown files are uploaded to VirusTotal's servers (located outside your infrastructure)
- **Data Sharing**: Per VirusTotal's terms, uploaded files may be shared with security partners and researchers
- **PHI/PII Risk**: Medical documents (lab reports, prescriptions, imaging) contain Protected Health Information
- **HIPAA Violation**: Uploading PHI to third-party services without BAA (Business Associate Agreement) violates HIPAA

### Safer Alternatives for Production

**Option 1: Hash-Only Checking (Recommended for Dev/Testing)**
- Current implementation checks SHA256 hash first (no upload if file is known)
- Unknown files trigger upload → **HIPAA risk**
- Acceptable for development/testing with sample data
- **NOT acceptable for production with real patient data**

**Option 2: Disable VirusTotal in Production**
```env
# .env.production
VIRUSTOTAL_API_KEY=  # Leave empty - disables scanning
```
- Magic byte validation and size limits still apply
- No PHI leaves your infrastructure
- Reduced security (no malware detection)

**Option 3: VirusTotal Enterprise with Private Scanning**
- Requires enterprise license ($$$)
- Files analyzed privately, not shared
- Still requires BAA from VirusTotal
- Contact: https://www.virustotal.com/gui/contact

**Option 4: Local Malware Scanning (Recommended for Production)**
- Use ClamAV, Windows Defender, or commercial AV locally
- No data leaves your infrastructure
- Requires platform-specific setup
- Higher operational complexity

**Option 5: Async Quarantine Workflow (Production Best Practice)**
```
1. Upload file → Store in quarantine S3 bucket (restricted access)
2. Scan asynchronously (local AV or hash-only VirusTotal check)
3. Move to validated bucket only after scan passes
4. Never upload unknown files to external services
```

### Current Implementation Status
- ✅ Hash checking (safe - only sends SHA256)
- ⚠️ File upload for unknown files (HIPAA risk)
- ⚠️ Synchronous scanning (UX issue - blocks 5-15 seconds)
- ❌ No quarantine workflow
- ❌ No async processing

### Recommendations
**For Development**: Current implementation is acceptable with sample/fake data
**For Production**: Implement Option 4 or 5 before handling real patient data

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

Optional VirusTotal cloud API integration scans files using 70+ antivirus engines.

**If VirusTotal API key is configured:**
- ✅ All uploaded files are scanned
- ✅ Files scanned by 70+ antivirus engines simultaneously
- ✅ Smart hash-checking (files already known to VirusTotal are instant)
- ✅ Infected files are rejected if 2+ engines flag as malicious
- ✅ Scan results logged with detailed statistics
- ✅ Works on all platforms (Linux, Windows, macOS, ARM64, x86_64)

**If VirusTotal API key is NOT configured:**
- ⚠️ Warning logged
- ✅ Upload continues (other validations still apply)
- 💡 Recommended for production (free tier: 500 requests/day)

## Setup

### Get VirusTotal API Key (Free)

1. **Create account**: Visit [https://www.virustotal.com](https://www.virustotal.com)
2. **Sign up**: Free account gives you 500 requests/day
3. **Get API key**: Go to [https://www.virustotal.com/gui/my-apikey](https://www.virustotal.com/gui/my-apikey)
4. **Copy your API key**

### Configure Backend

Add to `backend/.env.development`:
```env
# VirusTotal - Malware Scanning (Optional)
# Get a free API key at: https://www.virustotal.com/gui/my-apikey
# Works on all platforms (Linux, Windows, macOS, ARM64, x86_64)
# Leave empty to disable malware scanning
VIRUSTOTAL_API_KEY=your_api_key_here
```

### No Additional Installation Required

✅ **Works on all platforms** - No Docker containers or daemons needed
✅ **Cloud-based** - Scans happen on VirusTotal servers
✅ **ARM64 compatible** - Works on Apple Silicon Macs
✅ **Cross-platform** - Linux, Windows, macOS all supported
✅ **70+ antivirus engines** - More comprehensive than single scanner
✅ **Smart caching** - Known files are checked instantly via hash lookup

### Optional: Skip Malware Scanning (Development Only)

Simply leave `VIRUSTOTAL_API_KEY` empty in your `.env` file. The system will:
- Log a warning on startup
- Skip malware scanning
- Continue with magic byte validation and size limits

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
# EICAR test file (safe test virus signature recognized by all antivirus engines)
echo 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > eicar.pdf

curl -X POST http://localhost:5001/api/lab-reports \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@eicar.pdf" \
  -F "patientId=$PATIENT_ID" \
  -F "testName=Blood Test"

# Expected: 400 - "File rejected: X antivirus engines detected malware"
# (where X is the number of engines that flagged it, typically 50+)
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
    └─→ [VirusTotal] Scan for malware (if API key configured)
            │
            ├─→ Calculate SHA256 hash
            │
            ├─→ Check if hash already known (fast path)
            │   ├─→ Found: Use cached results (instant)
            │   └─→ Not found: Upload for scanning
            │
            ├─→ Wait for analysis (70+ engines)
            │
            ├─→ Check malicious threshold (2+ engines)
            │   ├─→ Below threshold: Continue
            │   └─→ Above threshold: REJECT (400 error)
            │
            └─→ Log results (malicious, suspicious, clean counts)
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
| `File rejected: X antivirus engines detected malware` | VirusTotal engines flagged file as malicious | File contains malicious code |

## Logs

### Successful Validation
```
Scanning file: report.pdf (SHA256: abc123...)
File found in VirusTotal database: report.pdf
Scan results: 0 malicious, 0 suspicious, 73 clean (73 engines)
File validated successfully: report.pdf (application/pdf, 2456789 bytes)
```

### MIME Type Mismatch
```
MIME type mismatch: declared=application/pdf, detected=image/jpeg, file=scan.pdf
File validated successfully: scan.pdf (image/jpeg, 1234567 bytes)
```

### Malware Detected
```
Scanning file: infected.pdf (SHA256: def456...)
Analysis complete: 52 malicious, 3 suspicious, 18 clean (73 engines)
MALWARE DETECTED: infected.pdf - File rejected: 52 antivirus engines detected malware
```

### VirusTotal Not Configured
```
VirusTotal scanning disabled (no API key configured)
Malware scanning skipped (API key not configured)
```

### VirusTotal API Error
```
VirusTotal rate limit exceeded
Malware scanning skipped (Rate limit exceeded)
Proceeding without malware scan due to scanner error
```

## Production Checklist

- [ ] VirusTotal API key obtained and configured
- [ ] VIRUSTOTAL_API_KEY set in production environment
- [ ] Test EICAR file detection
- [ ] Monitor rate limit usage (500 requests/day for free tier)
- [ ] Set up alerting for malware detections
- [ ] Document incident response procedure
- [ ] Consider paid tier if > 500 files/day (or implement queueing)
- [ ] Review VirusTotal detection threshold (default: 2 engines)

## Maintenance

### Monitor API Usage

**Check rate limit usage:**
```bash
# VirusTotal free tier: 500 requests/day
# Check your usage in VirusTotal dashboard
# https://www.virustotal.com/gui/user/[username]/apikey
```

**Rate limit handling:**
- The system automatically handles rate limit errors gracefully
- Uploads continue with other validations if rate limit exceeded
- Consider paid tier for high-volume production use

### Performance Optimization

VirusTotal scanning is optimized but network-dependent:

1. **Hash-based caching (automatic):**
   - Files already known to VirusTotal are checked instantly
   - No upload needed if hash found in database
   - Saves time and API quota

2. **File size limits:**
   - Files > 32 MB skip VirusTotal scanning (VirusTotal limit)
   - Magic byte validation still applies

3. **Async scanning (future enhancement):**
   - Current implementation is synchronous
   - Consider background job queue for better UX
   - Allows immediate upload with post-scan verification

4. **Configurable threshold:**
   - Default: 2 engines must flag as malicious
   - Adjust `MALICIOUS_THRESHOLD` in virusTotalScan.js
   - Lower = stricter, Higher = more permissive

### Upgrade to Paid Tier

If you need more than 500 requests/day:

**VirusTotal Premium:**
- 20,000+ requests/day
- Priority scanning
- Advanced API features
- Contact: https://www.virustotal.com/gui/contact

**VirusTotal Enterprise:**
- Unlimited requests
- Private scanning (files not shared)
- Custom integrations
- Contact sales team

## Security Best Practices

1. ✅ **Defense in Depth** - Multiple validation layers
2. ✅ **Fail Secure** - Reject on validation failure
3. ✅ **Logging** - All validations logged
4. ✅ **Type-Specific Limits** - Not one-size-fits-all
5. ✅ **Magic Byte Validation** - Can't be bypassed by renaming
6. ✅ **Optional Malware Scanning** - Graceful degradation if unavailable

## Troubleshooting

### "VirusTotal scanning disabled"

**Check if API key is configured:**
```bash
# Check environment variable
echo $VIRUSTOTAL_API_KEY

# Should not be empty
```

**Verify API key is valid:**
```bash
# Test with curl
curl -H "x-apikey: YOUR_API_KEY" \
  https://www.virustotal.com/api/v3/files/44d88612fea8a8f36de82e1278abb02f

# Should return 200 OK (or 404 if file not found)
# Should NOT return 401 Unauthorized
```

### "Rate limit exceeded"

**Symptoms:**
```
VirusTotal rate limit exceeded
Malware scanning skipped (Rate limit exceeded)
```

**Solutions:**
1. **Check usage:** Visit https://www.virustotal.com/gui/user/[username]/apikey
2. **Wait:** Free tier resets daily (500 requests/day)
3. **Upgrade:** Consider paid tier for high-volume production
4. **Optimize:** Most requests should use hash-checking (faster, counts toward quota)

### "File validation taking too long"

**Normal timing:**
- Hash check (file known): < 1 second
- Full scan (new file): 5-15 seconds (network + analysis time)
- Large files: May take longer depending on upload speed

**Solutions:**
1. **Check network connectivity** to VirusTotal servers
2. **Consider async scanning** for better UX (background job queue)
3. **Increase timeouts** in virusTotalScan.js if needed

### "False positives"

**Symptoms:**
- Legitimate files flagged by 1-2 engines
- Different engines disagree

**Understanding results:**
```
malicious: 2    ← Engines that found threats
suspicious: 1   ← Engines that found suspicious patterns
harmless: 60    ← Engines that found nothing
undetected: 10  ← Engines that couldn't analyze
```

**Current threshold: 2 malicious engines**

**Solutions:**
1. **Review the specific file** - Is it actually safe?
2. **Check which engines flagged it** - Some are more aggressive
3. **Adjust threshold** if needed (edit `MALICIOUS_THRESHOLD` in virusTotalScan.js)
4. **Report false positives** to antivirus vendors via VirusTotal

### "Invalid API key"

**Symptoms:**
```
VirusTotal API key invalid
Malware scanning skipped (Invalid API key)
```

**Solutions:**
1. **Regenerate key:** https://www.virustotal.com/gui/my-apikey
2. **Check for spaces:** API keys should have no leading/trailing spaces
3. **Verify environment:** Ensure correct .env file is loaded

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
  "message": "File rejected: 52 antivirus engines detected malware",
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

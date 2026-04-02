const { validateFileType, validateFileSize, ALLOWED_FILE_TYPES } = require('../../middleware/fileValidation');
const AppError = require('../../utils/AppError');

// Mock file-type module
jest.mock('file-type', () => ({
  fileTypeFromBuffer: jest.fn(),
}));

const { fileTypeFromBuffer } = require('file-type');

describe('File Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFileType', () => {
    it('should accept valid PDF file', async () => {
      const mockBuffer = Buffer.from('PDF content');
      fileTypeFromBuffer.mockResolvedValue({ mime: 'application/pdf', ext: 'pdf' });

      const result = await validateFileType(mockBuffer, ['application/pdf']);

      expect(result.mime).toBe('application/pdf');
      expect(fileTypeFromBuffer).toHaveBeenCalledWith(mockBuffer);
    });

    it('should accept valid JPEG file', async () => {
      const mockBuffer = Buffer.from('JPEG content');
      fileTypeFromBuffer.mockResolvedValue({ mime: 'image/jpeg', ext: 'jpg' });

      const result = await validateFileType(mockBuffer, ['image/jpeg', 'application/pdf']);

      expect(result.mime).toBe('image/jpeg');
    });

    it('should reject when file type cannot be determined', async () => {
      const mockBuffer = Buffer.from('unknown content');
      fileTypeFromBuffer.mockResolvedValue(null);

      await expect(validateFileType(mockBuffer, ['application/pdf'])).rejects.toThrow(
        'Could not determine file type'
      );
    });

    it('should reject disallowed file types', async () => {
      const mockBuffer = Buffer.from('EXE content');
      fileTypeFromBuffer.mockResolvedValue({ mime: 'application/x-msdownload', ext: 'exe' });

      await expect(validateFileType(mockBuffer, ['application/pdf'])).rejects.toThrow(
        'Invalid file type detected'
      );
    });

    it('should reject executable files disguised as PDFs', async () => {
      const mockBuffer = Buffer.from('MZ...'); // EXE magic bytes
      fileTypeFromBuffer.mockResolvedValue({ mime: 'application/x-msdownload', ext: 'exe' });

      await expect(validateFileType(mockBuffer, ['application/pdf'])).rejects.toThrow(
        'Invalid file type detected: application/x-msdownload'
      );
    });
  });

  describe('validateFileSize', () => {
    it('should accept file within size limit for PDF', () => {
      const size = 20 * 1024 * 1024; // 20 MB
      expect(() => validateFileSize(size, 'application/pdf')).not.toThrow();
    });

    it('should accept file within size limit for JPEG', () => {
      const size = 5 * 1024 * 1024; // 5 MB
      expect(() => validateFileSize(size, 'image/jpeg')).not.toThrow();
    });

    it('should reject PDF larger than 25 MB', () => {
      const size = 30 * 1024 * 1024; // 30 MB
      expect(() => validateFileSize(size, 'application/pdf')).toThrow(
        'File size exceeds 25 MB limit'
      );
    });

    it('should reject JPEG larger than 10 MB', () => {
      const size = 15 * 1024 * 1024; // 15 MB
      expect(() => validateFileSize(size, 'image/jpeg')).toThrow(
        'File size exceeds 10 MB limit'
      );
    });

    it('should reject unsupported file type', () => {
      const size = 1 * 1024 * 1024; // 1 MB
      expect(() => validateFileSize(size, 'application/x-executable')).toThrow(
        'Unsupported file type'
      );
    });

    it('should accept maximum allowed size exactly', () => {
      const size = 25 * 1024 * 1024; // Exactly 25 MB
      expect(() => validateFileSize(size, 'application/pdf')).not.toThrow();
    });

    it('should reject one byte over limit', () => {
      const size = 25 * 1024 * 1024 + 1; // 25 MB + 1 byte
      expect(() => validateFileSize(size, 'application/pdf')).toThrow();
    });
  });

  describe('ALLOWED_FILE_TYPES', () => {
    it('should have correct size limits', () => {
      expect(ALLOWED_FILE_TYPES['application/pdf'].maxSize).toBe(25 * 1024 * 1024);
      expect(ALLOWED_FILE_TYPES['image/jpeg'].maxSize).toBe(10 * 1024 * 1024);
      expect(ALLOWED_FILE_TYPES['image/png'].maxSize).toBe(10 * 1024 * 1024);
      expect(ALLOWED_FILE_TYPES['image/webp'].maxSize).toBe(10 * 1024 * 1024);
    });

    it('should have correct file extensions', () => {
      expect(ALLOWED_FILE_TYPES['application/pdf'].ext).toBe('pdf');
      expect(ALLOWED_FILE_TYPES['image/jpeg'].ext).toBe('jpg');
      expect(ALLOWED_FILE_TYPES['image/png'].ext).toBe('png');
    });

    it('should include all required MIME types', () => {
      const requiredTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      requiredTypes.forEach((type) => {
        expect(ALLOWED_FILE_TYPES[type]).toBeDefined();
        expect(ALLOWED_FILE_TYPES[type].maxSize).toBeGreaterThan(0);
        expect(ALLOWED_FILE_TYPES[type].ext).toBeTruthy();
      });
    });
  });
});

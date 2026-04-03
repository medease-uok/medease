import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function DocumentViewer({ isOpen, onClose, url, fileName, fileType }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [error, setError] = useState(null);

  const isPdf = fileType?.toLowerCase().includes('pdf') || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(fileType) ||
    /\.(jpg|jpeg|png|webp)$/i.test(fileName);

  // Only show loading for PDFs, images load instantly
  const [loading, setLoading] = useState(isPdf);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF. The file may be corrupted or unsupported.');
    setLoading(false);
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const handlePrevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setPageNumber((prev) => Math.min(prev + 1, numPages));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-7xl max-h-[95vh] m-4 bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 truncate">
              {fileName || 'Document Viewer'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls for PDFs and images */}
            {(isPdf || isImage) && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Zoom out"
                  title="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600 min-w-[4rem] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 3.0}
                  className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Zoom in"
                  title="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-2" />
              </>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              aria-label="Download document"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              aria-label="Close viewer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-slate-600">Loading document...</p>
            </div>
          )}

          {error && (
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-slate-900 font-medium mb-2">Unable to load document</p>
              <p className="text-sm text-slate-600 mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Download instead
              </button>
            </div>
          )}

          {/* PDF viewer */}
          {!error && isPdf && (
            <div className="flex flex-col items-center gap-4">
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading=""
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-lg"
                />
              </Document>

              {/* Page navigation */}
              {numPages > 1 && (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-md">
                  <button
                    onClick={handlePrevPage}
                    disabled={pageNumber <= 1}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-slate-700 min-w-[6rem] text-center">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={pageNumber >= numPages}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image viewer */}
          {!error && isImage && (
            <img
              src={url}
              alt={fileName}
              style={{ transform: `scale(${scale})` }}
              className="max-w-full max-h-full object-contain shadow-lg transition-transform"
              onError={() => {
                setError('Failed to load image');
              }}
            />
          )}

          {/* Fallback for other file types */}
          {!error && !isPdf && !isImage && (
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Download className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-900 font-medium mb-2">Preview not available</p>
              <p className="text-sm text-slate-600 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Download to view
              </button>
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 rounded-b-lg">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-slate-700">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

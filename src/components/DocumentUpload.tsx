import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader, Brain, Info } from 'lucide-react';
import { Document } from '../types';
import { processDocument, generateSummary } from '../utils/documentProcessor';

interface DocumentUploadProps {
  onDocumentUploaded: (document: Document) => Promise<Document>;
  onViewChange: (view: 'document', documentId: string) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentUploaded, onViewChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'analyzing' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const allowedExtensions = ['txt', 'pdf', 'doc', 'docx', 'xlsx', 'xls'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setUploadStatus('error');
      setUploadMessage('Please upload a supported file type: PDF, Word (.doc/.docx), Excel (.xlsx/.xls), or Text (.txt)');
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      setUploadStatus('error');
      setUploadMessage('File size must be less than 25MB.');
      return;
    }

    setUploading(true);
    setUploadStatus('processing');
    setUploadMessage('Extracting clean text content from document...');

    try {
      // Process document content with enhanced extraction
      const content = await processDocument(file);
      
      if (content.length < 50) {
        setUploadStatus('error');
        setUploadMessage('Document appears to be too short or empty. Please upload a document with substantial content.');
        setUploading(false);
        return;
      }
      
      setUploadStatus('analyzing');
      setUploadMessage('AceMind AI is analyzing content and generating comprehensive summary...');
      
      // Generate AI summary using Gemini
      const summary = await generateSummary(content, file.name);

      const document: Document = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
        content,
        summary
      };

      setUploadStatus('success');
      setUploadMessage('Document processed successfully! Redirecting to document summary...');
      
      // Save document and get the saved version with proper ID
      const savedDocument = await onDocumentUploaded(document);
      
      // Navigate to document view after a short delay
      setTimeout(() => {
        onViewChange('document', savedDocument.id);
        setUploading(false);
      }, 1500);

    } catch (error) {
      console.error('Document processing error:', error);
      setUploadStatus('error');
      
      // Display the specific error message from the processor
      const errorMessage = error instanceof Error ? error.message : 'Failed to process document. Please try again.';
      setUploadMessage(errorMessage);
      setUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'processing':
        return <Loader className="h-12 w-12 text-blue-600 animate-spin" />;
      case 'analyzing':
        return <Brain className="h-12 w-12 text-purple-600 animate-pulse" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-12 w-12 text-red-600" />;
      default:
        return <Upload className="h-12 w-12 text-gray-400" />;
    }
  };

  const getStatusTitle = () => {
    switch (uploadStatus) {
      case 'processing':
        return 'Extracting Document Content...';
      case 'analyzing':
        return 'AceMind AI Analysis in Progress...';
      case 'success':
        return 'Upload Successful!';
      case 'error':
        return 'Upload Failed';
      default:
        return 'Drop your file here or click to browse';
    }
  };

  const resetUploadState = () => {
    setUploadStatus('idle');
    setUploadMessage('');
    setUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Study Material</h2>
        <p className="text-gray-600">Upload documents to extract clean text and generate AI-powered summaries and practice tests with AceMind AI</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : uploadStatus === 'success'
            ? 'border-green-400 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-400 bg-red-50'
            : uploadStatus === 'analyzing'
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {getStatusTitle()}
            </h3>
            
            {uploadMessage && (
              <div className={`text-sm mb-2 ${
                uploadStatus === 'success' ? 'text-green-600' :
                uploadStatus === 'error' ? 'text-red-600' :
                uploadStatus === 'analyzing' ? 'text-purple-600' :
                'text-blue-600'
              }`}>
                <div className="whitespace-pre-line">{uploadMessage}</div>
              </div>
            )}
            
            {uploadStatus === 'idle' && (
              <p className="text-gray-500 text-sm">
                Supported formats: PDF, Word (.doc/.docx), Excel (.xlsx/.xls), Text files (Max 25MB)
              </p>
            )}

            {uploadStatus === 'analyzing' && (
              <div className="mt-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-purple-600">
                  <Brain className="h-4 w-4" />
                  <span>Powered by AceMind AI & Gemini</span>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="mt-4">
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Redirecting to document summary...</span>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="mt-4">
                <button
                  onClick={resetUploadState}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">PDF Upload Tips</h4>
            <p className="text-blue-800 text-sm">
              For best results with PDF files, ensure they contain selectable text. If you're uploading a scanned document, 
              consider using an OCR tool first or try uploading in Word/Text format instead.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Smart Text Extraction</h4>
          </div>
          <p className="text-gray-600 text-sm">
            Advanced processing extracts clean, readable text from Word, PDF, Excel, and text files while removing all formatting and metadata.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Brain className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">AceMind AI Analysis</h4>
          </div>
          <p className="text-gray-600 text-sm">
            AceMind AI analyzes your content to generate comprehensive summaries, key highlights, and intelligent practice questions.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Multiple Formats</h4>
          </div>
          <p className="text-gray-600 text-sm">
            Support for PDF, Word documents, Excel spreadsheets, and text files with intelligent content detection and processing.
          </p>
        </div>
      </div>
    </div>
  );
};
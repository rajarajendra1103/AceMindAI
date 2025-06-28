import React, { useState } from 'react';
import { Upload, FileText, TrendingUp, Clock, Plus, Play, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, TestResult } from '../types';

interface DashboardProps {
  documents: Document[];
  testResults: TestResult[];
  onViewChange: (view: 'upload' | 'document', documentId?: string) => void;
  onDeleteDocument: (documentId: string) => Promise<boolean>;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  documents, 
  testResults, 
  onViewChange, 
  onDeleteDocument 
}) => {
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);

  const recentResults = testResults.slice(-3).reverse();
  const averageScore = testResults.length > 0 
    ? testResults.reduce((sum, result) => sum + result.score, 0) / testResults.length 
    : 0;

  // Get recent documents for display (last 5)
  const recentDocuments = documents.slice(-5).reverse();
  const documentsPerPage = 3; // Show 3 documents at a time
  const totalPages = Math.ceil(recentDocuments.length / documentsPerPage);
  const currentPage = Math.floor(currentDocumentIndex / documentsPerPage);

  // Get documents for current page
  const startIndex = currentPage * documentsPerPage;
  const endIndex = startIndex + documentsPerPage;
  const currentDocuments = recentDocuments.slice(startIndex, endIndex);

  const handleDeleteClick = (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the document view
    setShowDeleteConfirm(documentId);
  };

  const handleConfirmDelete = async (documentId: string) => {
    setDeletingDocumentId(documentId);
    setShowDeleteConfirm(null);
    
    try {
      const success = await onDeleteDocument(documentId);
      if (!success) {
        // Show error message if deletion failed
        alert('Failed to delete document. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentDocumentIndex((currentPage - 1) * documentsPerPage);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentDocumentIndex((currentPage + 1) * documentsPerPage);
    }
  };

  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to AceMind AI</h1>
        <p className="text-xl text-gray-600">Smart Prep for Smart Minds - Transform your study materials into intelligent practice tests</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
              <p className="text-sm text-gray-600">Documents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{testResults.length}</p>
              <p className="text-sm text-gray-600">Tests Taken</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{averageScore.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(testResults.reduce((sum, result) => sum + result.timeSpent, 0) / 60)}
              </p>
              <p className="text-sm text-gray-600">Study Minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-8 text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ready to Start Learning?</h2>
          <p className="text-blue-100 mb-6">Upload a document or continue with your existing materials</p>
          <button
            onClick={() => onViewChange('upload')}
            className="inline-flex items-center space-x-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Upload New Document</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Documents */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Documents</h3>
            <div className="flex items-center space-x-2">
              {recentDocuments.length > documentsPerPage && (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous documents"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-gray-500 px-2">
                    {currentPage + 1} of {totalPages}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next documents"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => onViewChange('upload')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Upload New
              </button>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No documents uploaded yet</p>
              <button
                onClick={() => onViewChange('upload')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => onViewChange('document', doc.id)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p 
                          className="font-medium text-gray-900 truncate"
                          title={doc.summary?.title || doc.name}
                        >
                          {doc.summary?.title || doc.name}
                        </p>
                        {(doc.summary?.title || doc.name).length > 30 && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Long title - hover to see full text"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {doc.uploadDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleDeleteClick(doc.id, e)}
                      disabled={deletingDocumentId === doc.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingDocumentId === doc.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                    <Play className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
              
              {/* Show pagination info */}
              {recentDocuments.length > documentsPerPage && (
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, recentDocuments.length)} of {recentDocuments.length} recent documents
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Test Results */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Test Results</h3>

          {testResults.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No tests taken yet</p>
              <p className="text-sm text-gray-500">Upload a document and take your first test</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentResults.map((result) => {
                const doc = documents.find(d => d.id === result.documentId);
                return (
                  <div key={result.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p 
                        className="font-medium text-gray-900 truncate"
                        title={doc?.summary?.title || doc?.name || 'Unknown Document'}
                      >
                        {doc?.summary?.title || doc?.name || 'Unknown Document'}
                      </p>
                      <span className={`text-lg font-bold ${
                        result.score >= 8 ? 'text-green-600' :
                        result.score >= 6 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {result.score.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="capitalize">{result.testConfig.difficulty} Level</span>
                      <span>{result.correctAnswers}/{result.questions.length} correct</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Features Overview */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <h3 className="text-2xl font-semibold text-gray-900 text-center mb-8">How AceMind AI Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">1. Upload Document</h4>
            <p className="text-gray-600">Upload your study materials in PDF, Word, or text format</p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">2. AI Analysis</h4>
            <p className="text-gray-600">Get AI-generated summaries, highlights, and key topics</p>
          </div>

          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">3. Practice & Improve</h4>
            <p className="text-gray-600">Take adaptive tests and track your progress over time</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Document</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This action cannot be undone and will also delete all associated test results.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
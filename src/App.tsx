import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentViewer } from './components/DocumentViewer';
import { TestConfiguration } from './components/TestConfiguration';
import { MockTest } from './components/MockTest';
import { TestResults } from './components/TestResults';
import { SearchInterface } from './components/SearchInterface';
import { FlowchartChatboard } from './components/FlowchartChatboard';
import { AskMeChatboard } from './components/AskMeChatboard';
import { AuthPage } from './components/AuthPage';
import { Document, TestResult, TestConfig, Question, AppView } from './types';
import { generateQuestions, calculateTestScore } from './utils/documentProcessor';
import { authService } from './services/authService';
import { dataService } from './services/dataService';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [currentTestConfig, setCurrentTestConfig] = useState<TestConfig | null>(null);
  const [currentTestQuestions, setCurrentTestQuestions] = useState<Question[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const selectedDocument = selectedDocumentId 
    ? documents.find(doc => doc.id === selectedDocumentId) 
    : null;

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await authService.validateSession();
      setIsAuthenticated(isValid);
      
      if (isValid) {
        await loadUserData();
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Load user data from Supabase
  const loadUserData = async () => {
    try {
      const [userDocuments, userTestResults] = await Promise.all([
        dataService.getUserDocuments(),
        dataService.getUserTestResults()
      ]);
      
      setDocuments(userDocuments);
      setTestResults(userTestResults);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    await loadUserData();
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setDocuments([]);
    setTestResults([]);
    setCurrentView('home');
  };

  const handleDocumentUploaded = async (document: Document): Promise<Document> => {
    try {
      // Save to Supabase
      const savedDocument = await dataService.saveDocument(document);
      if (savedDocument) {
        setDocuments(prev => [savedDocument, ...prev]);
        // Set the selected document ID for navigation
        setSelectedDocumentId(savedDocument.id);
        return savedDocument;
      } else {
        // If save fails, still add to local state and return original document
        setDocuments(prev => [document, ...prev]);
        setSelectedDocumentId(document.id);
        return document;
      }
    } catch (error) {
      console.error('Error saving document:', error);
      // Still add to local state even if save fails
      setDocuments(prev => [document, ...prev]);
      setSelectedDocumentId(document.id);
      return document;
    }
  };

  const handleDeleteDocument = async (documentId: string): Promise<boolean> => {
    try {
      // Delete from Supabase
      const success = await dataService.deleteDocument(documentId);
      
      if (success) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        // Remove related test results
        setTestResults(prev => prev.filter(result => result.documentId !== documentId));
        
        // If this was the selected document, clear selection and go to home
        if (selectedDocumentId === documentId) {
          setSelectedDocumentId(null);
          setCurrentView('home');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  };

  const handleViewChange = (view: AppView, documentId?: string) => {
    setCurrentView(view);
    if (documentId) {
      setSelectedDocumentId(documentId);
    }
  };

  const handleStartTestConfiguration = () => {
    setCurrentView('test-config');
  };

  const handleStartTest = async (config: TestConfig) => {
    setCurrentTestConfig(config);
    setIsGeneratingQuestions(true);
    setCurrentView('test');

    try {
      const document = documents.find(doc => doc.id === config.documentId);
      if (document) {
        const questions = await generateQuestions(
          document.content, 
          config.difficulty, 
          config.questionCount
        );
        setCurrentTestQuestions(questions);
      }
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleTestComplete = async (userAnswers: (number | null)[], timeSpent: number) => {
    if (!currentTestConfig || currentTestQuestions.length === 0) return;

    const scoreData = calculateTestScore(currentTestQuestions, userAnswers);
    
    const testResult: TestResult = {
      id: `test_${Date.now()}`,
      documentId: currentTestConfig.documentId,
      testConfig: currentTestConfig,
      questions: currentTestQuestions,
      userAnswers,
      score: scoreData.score,
      correctAnswers: scoreData.correctAnswers,
      incorrectAnswers: scoreData.incorrectAnswers,
      unanswered: scoreData.unanswered,
      completedAt: new Date(),
      timeSpent
    };

    // Save to Supabase
    const savedTestResult = await dataService.saveTestResult(testResult);
    if (savedTestResult) {
      setTestResults(prev => [savedTestResult, ...prev]);
    }
    
    setCurrentView('results');
  };

  const handleRetakeTest = () => {
    if (currentTestConfig) {
      handleStartTest(currentTestConfig);
    }
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedDocumentId(null);
    setCurrentTestConfig(null);
    setCurrentTestQuestions([]);
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AceMind AI...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView}
        onViewChange={handleViewChange}
        documentCount={documents.length}
        onLogout={handleLogout}
      />

      <main className="py-8">
        {currentView === 'home' && (
          <Dashboard
            documents={documents}
            testResults={testResults}
            onViewChange={handleViewChange}
            onDeleteDocument={handleDeleteDocument}
          />
        )}

        {currentView === 'upload' && (
          <DocumentUpload
            onDocumentUploaded={handleDocumentUploaded}
            onViewChange={handleViewChange}
          />
        )}

        {currentView === 'search' && (
          <SearchInterface />
        )}

        {currentView === 'flowchart' && (
          <FlowchartChatboard />
        )}

        {currentView === 'askme' && (
          <AskMeChatboard />
        )}

        {currentView === 'document' && selectedDocument && (
          <DocumentViewer
            document={selectedDocument}
            onStartTest={handleStartTestConfiguration}
            onDeleteDocument={handleDeleteDocument}
            onBackToHome={handleBackToHome}
          />
        )}

        {currentView === 'test-config' && selectedDocument && (
          <TestConfiguration
            document={selectedDocument}
            onStartTest={handleStartTest}
          />
        )}

        {currentView === 'test' && (
          <div>
            {isGeneratingQuestions ? (
              <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Your Test</h3>
                  <p className="text-gray-600">Creating personalized questions based on your document...</p>
                </div>
              </div>
            ) : currentTestQuestions.length > 0 && currentTestConfig ? (
              <MockTest
                questions={currentTestQuestions}
                config={currentTestConfig}
                onTestComplete={handleTestComplete}
                onBack={() => setCurrentView('test-config')}
              />
            ) : null}
          </div>
        )}

        {currentView === 'results' && testResults.length > 0 && (
          <TestResults
            result={testResults[0]}
            onRetakeTest={handleRetakeTest}
            onBackToHome={handleBackToHome}
          />
        )}
      </main>
    </div>
  );
}

export default App;
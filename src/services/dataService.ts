import { supabase } from './supabaseClient';
import { authService } from './authService';
import { Document, TestResult, DocumentSummary } from '../types';

class DataService {
  async saveDocument(document: Omit<Document, 'id'>): Promise<Document | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          name: document.name,
          type: document.type,
          size: document.size,
          content: document.content,
          summary: document.summary || {},
          upload_date: document.uploadDate.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving document:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        type: data.type,
        size: data.size,
        content: data.content,
        summary: data.summary as DocumentSummary,
        uploadDate: new Date(data.upload_date)
      };
    } catch (error) {
      console.error('Error saving document:', error);
      return null;
    }
  }

  async getUserDocuments(): Promise<Document[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      return data.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        size: doc.size,
        content: doc.content,
        summary: doc.summary as DocumentSummary,
        uploadDate: new Date(doc.upload_date)
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  }

  async saveTestResult(testResult: Omit<TestResult, 'id'>): Promise<TestResult | null> {
    try {
      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('test_results')
        .insert({
          user_id: user.id,
          document_id: testResult.documentId,
          test_config: testResult.testConfig,
          questions: testResult.questions,
          user_answers: testResult.userAnswers,
          score: testResult.score,
          correct_answers: testResult.correctAnswers,
          incorrect_answers: testResult.incorrectAnswers,
          unanswered: testResult.unanswered,
          time_spent: testResult.timeSpent,
          completed_at: testResult.completedAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving test result:', error);
        return null;
      }

      return {
        id: data.id,
        documentId: data.document_id,
        testConfig: data.test_config,
        questions: data.questions,
        userAnswers: data.user_answers,
        score: data.score,
        correctAnswers: data.correct_answers,
        incorrectAnswers: data.incorrect_answers,
        unanswered: data.unanswered,
        timeSpent: data.time_spent,
        completedAt: new Date(data.completed_at)
      };
    } catch (error) {
      console.error('Error saving test result:', error);
      return null;
    }
  }

  async getUserTestResults(): Promise<TestResult[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('test_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching test results:', error);
        return [];
      }

      return data.map(result => ({
        id: result.id,
        documentId: result.document_id,
        testConfig: result.test_config,
        questions: result.questions,
        userAnswers: result.user_answers,
        score: result.score,
        correctAnswers: result.correct_answers,
        incorrectAnswers: result.incorrect_answers,
        unanswered: result.unanswered,
        timeSpent: result.time_spent,
        completedAt: new Date(result.completed_at)
      }));
    } catch (error) {
      console.error('Error fetching test results:', error);
      return [];
    }
  }

  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const user = authService.getCurrentUser();
      if (!user) return false;

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting document:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }
}

export const dataService = new DataService();
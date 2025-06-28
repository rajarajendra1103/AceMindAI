export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  content: string;
  summary?: DocumentSummary;
}

export interface DocumentSummary {
  title: string;
  highlights: string[];
  summary: string;
  keyTopics: string[];
  estimatedReadTime: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  topic: string;
}

export interface TestConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  documentId: string;
  questionCount: number;
}

export interface TestResult {
  id: string;
  documentId: string;
  testConfig: TestConfig;
  questions: Question[];
  userAnswers: (number | null)[];
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  completedAt: Date;
  timeSpent: number;
}

export interface BookResult {
  title: string;
  author: string;
  first_publish_year?: number;
  read_url: string;
  download_url?: string;
  cover_id?: number;
  subject?: string[];
  language?: string[];
}

export interface VideoResult {
  title: string;
  link: string;
  channel: string;
  rating: string;
  thumbnail?: string;
  duration?: string;
  publishedAt?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isYouTubeLink?: boolean;
  videoTitle?: string;
  hasLiveInfo?: boolean;
}

export type AppView = 'home' | 'upload' | 'document' | 'test-config' | 'test' | 'results' | 'search' | 'flowchart' | 'askme';
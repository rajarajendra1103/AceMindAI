import { Document, DocumentSummary, Question } from '../types';
import { geminiService } from '../services/geminiService';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// PDF.js worker setup - lazy loading to avoid top-level await
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

let pdfjsLib: any = null;

const getPdfjsLib = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
  }
  return pdfjsLib;
};

export const processDocument = async (file: File): Promise<string> => {
  const fileExtension = file.name.toLowerCase().split('.').pop() || '';
  const fileType = file.type.toLowerCase();

  try {
    // Detect file type and extract content accordingly
    if (fileExtension === 'docx' || fileType.includes('wordprocessingml')) {
      return await extractDocxContent(file);
    } else if (fileExtension === 'pdf' || fileType === 'application/pdf') {
      return await extractPdfContent(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileType.includes('spreadsheet')) {
      return await extractExcelContent(file);
    } else if (fileExtension === 'txt' || fileType === 'text/plain') {
      return await extractTextContent(file);
    } else if (fileExtension === 'doc' || fileType === 'application/msword') {
      // For older .doc files, try to read as text (limited support)
      return await extractTextContent(file);
    } else {
      // Fallback: try to read as plain text
      return await extractTextContent(file);
    }
  } catch (error) {
    console.error('Document processing error:', error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      throw error; // Re-throw the specific error with its message
    }
    
    throw new Error(`Failed to extract content from ${file.name}. Please ensure the file is not corrupted and contains readable text.`);
  }
};

const extractDocxContent = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.value && result.value.trim().length > 0) {
      // Clean up the extracted text
      return cleanExtractedText(result.value);
    } else {
      throw new Error('No readable text found in the Word document');
    }
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error('Failed to extract text from Word document. The file may be corrupted or password-protected.');
  }
};

const extractPdfContent = async (file: File): Promise<string> => {
  try {
    const pdfjsLib = await getPdfjsLib();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    let hasAnyText = false;
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Extract text items and join them
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
          hasAnyText = true;
        }
      } catch (pageError) {
        console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
        // Continue processing other pages
      }
    }
    
    if (!hasAnyText || fullText.trim().length === 0) {
      throw new Error('This PDF appears to be a scanned document or image-based PDF without selectable text. Please try:\n\n1. Using a PDF with selectable text (you can test this by trying to select text in a PDF viewer)\n2. Converting your scanned PDF using an OCR tool first\n3. Uploading the document in a different format (Word, Text, etc.)');
    }
    
    const cleanedText = cleanExtractedText(fullText);
    
    // Additional check for meaningful content
    if (cleanedText.length < 50) {
      throw new Error('The PDF contains very little readable text. Please ensure the document has substantial content or try a different format.');
    }
    
    return cleanedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    if (error instanceof Error && error.message.includes('scanned document')) {
      throw error; // Re-throw our specific OCR-related error
    }
    
    throw new Error('Failed to process PDF file. This may be due to:\n\n• Password protection\n• Corrupted file\n• Scanned document without OCR\n• Unsupported PDF format\n\nPlease try uploading a different PDF or convert to Word/Text format.');
  }
};

const extractExcelContent = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let fullText = '';
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert sheet to JSON to get structured data
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      if (jsonData.length > 0) {
        fullText += `Sheet: ${sheetName}\n`;
        fullText += '='.repeat(sheetName.length + 7) + '\n\n';
        
        jsonData.forEach((row: any[]) => {
          const rowText = row
            .filter(cell => cell !== null && cell !== undefined && cell !== '')
            .join(' | ');
          
          if (rowText.trim()) {
            fullText += rowText + '\n';
          }
        });
        
        fullText += '\n\n';
      }
    });
    
    if (fullText.trim().length === 0) {
      throw new Error('No readable data found in the Excel file');
    }
    
    return cleanExtractedText(fullText);
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw new Error('Failed to extract data from Excel file. The file may be corrupted or password-protected.');
  }
};

const extractTextContent = async (file: File): Promise<string> => {
  try {
    const text = await file.text();
    
    if (text.trim().length === 0) {
      throw new Error('The text file appears to be empty');
    }
    
    return cleanExtractedText(text);
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to read text file. Please ensure the file is not corrupted and uses a supported text encoding.');
  }
};

const cleanExtractedText = (text: string): string => {
  return text
    // Remove excessive whitespace and normalize line breaks
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove multiple consecutive spaces
    .replace(/[ \t]+/g, ' ')
    // Remove multiple consecutive line breaks (keep max 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remove leading/trailing whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n')
    // Final cleanup
    .trim();
};

export const generateSummary = async (content: string, fileName: string): Promise<DocumentSummary> => {
  try {
    // Use Gemini AI to generate the summary
    return await geminiService.generateSummary(content, fileName);
  } catch (error) {
    console.error('Error generating summary:', error);
    
    // Fallback to basic summary if AI fails
    const wordCount = content.split(' ').length;
    return {
      title: fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      highlights: [
        "Document uploaded successfully",
        "Content analysis completed",
        "Ready for test generation",
        "AI processing may have encountered limitations",
        "Manual review recommended for optimal results"
      ],
      summary: "This document has been processed and is ready for exam preparation. The AI summary generation encountered some limitations, but the content is available for creating practice tests.",
      keyTopics: [
        "Document Content",
        "Study Material",
        "Exam Preparation",
        "Practice Questions"
      ],
      estimatedReadTime: Math.ceil(wordCount / 200)
    };
  }
};

export const generateQuestions = async (content: string, difficulty: string, count: number): Promise<Question[]> => {
  try {
    // Use Gemini AI to generate questions
    return await geminiService.generateQuestions(content, difficulty, count);
  } catch (error) {
    console.error('Error generating questions:', error);
    
    // Fallback questions if AI fails
    const fallbackQuestions: Question[] = [
      {
        id: '1',
        question: 'Based on the document content, what is the main subject matter?',
        options: [
          'The document covers the primary topic comprehensively',
          'The content is primarily supplementary material',
          'The document focuses on advanced concepts only',
          'The material is introductory level content'
        ],
        correctAnswer: 0,
        explanation: 'The document appears to cover the main subject matter comprehensively based on the content analysis.',
        topic: 'Document Analysis'
      },
      {
        id: '2',
        question: 'What approach should be taken when studying this material?',
        options: [
          'Focus only on memorization',
          'Understand concepts and apply them',
          'Skip difficult sections',
          'Read only the summary'
        ],
        correctAnswer: 1,
        explanation: 'Understanding concepts and applying them is the most effective approach for exam preparation.',
        topic: 'Study Strategy'
      },
      {
        id: '3',
        question: 'How can this document best be used for exam preparation?',
        options: [
          'As a quick reference only',
          'For comprehensive study and practice',
          'Only for last-minute revision',
          'As background reading'
        ],
        correctAnswer: 1,
        explanation: 'Documents are most effective when used for comprehensive study and practice, allowing for thorough understanding.',
        topic: 'Exam Preparation'
      }
    ];

    // Generate the requested number of questions
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      const baseQuestion = fallbackQuestions[i % fallbackQuestions.length];
      questions.push({
        ...baseQuestion,
        id: `fallback_${i + 1}`,
        question: `${baseQuestion.question} (Question ${i + 1})`,
      });
    }
    
    return questions;
  }
};

export const calculateTestScore = (questions: Question[], userAnswers: (number | null)[]): {
  score: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
} => {
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let unanswered = 0;
  
  questions.forEach((question, index) => {
    const userAnswer = userAnswers[index];
    if (userAnswer === null || userAnswer === undefined) {
      unanswered++;
    } else if (userAnswer === question.correctAnswer) {
      correctAnswers++;
    } else {
      incorrectAnswers++;
    }
  });
  
  const score = Math.round((correctAnswers / questions.length) * 10 * 100) / 100;
  
  return { score, correctAnswers, incorrectAnswers, unanswered };
};
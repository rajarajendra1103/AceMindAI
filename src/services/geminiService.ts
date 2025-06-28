import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentSummary, Question } from '../types';

const API_KEY = 'AIzaSyDeyxtoGgVBwGDW7urF6W1p4W9WbIRF2g8';
const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async generateResponse(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate response. Please try again.');
    }
  }

  async generateSummary(content: string, fileName: string): Promise<DocumentSummary> {
    try {
      // Calculate document length and determine summary requirements
      const wordCount = content.split(' ').length;
      const estimatedPages = Math.ceil(wordCount / 250); // Rough estimate: 250 words per page
      
      // Determine summary length based on page count
      let summaryLength = '';
      let summaryLines = '';
      
      if (estimatedPages <= 1) {
        summaryLength = 'concise';
        summaryLines = '3-5 lines';
      } else if (estimatedPages <= 5) {
        summaryLength = 'moderate';
        summaryLines = '5-10 lines';
      } else {
        summaryLength = 'comprehensive';
        summaryLines = '15-20 lines';
      }

      const prompt = `
📘 Task:
Generate a summary of the given document. The document is approximately ${estimatedPages} page(s) long.

📏 Summary Length Requirements:
- Document Length: ${estimatedPages} page(s)
- Summary Type: ${summaryLength}
- Required Length: ${summaryLines}

Follow these steps:

1. Title:
   - If the document already has a title, extract it.
   - If not, generate a suitable title based on the content.

2. Summary:
   - Write a ${summaryLength} summary that is exactly ${summaryLines} long.
   - Each line should be a complete sentence or thought.
   - Cover the **overall purpose and key points** of the document.
   - Use simple, clear language.
   - Make it informative and well-structured.
   ${estimatedPages > 5 ? '- Include detailed coverage of main sections and important subtopics.' : ''}
   ${estimatedPages <= 1 ? '- Keep it brief but capture the essential message.' : ''}

3. Key Highlights:
   - List the ${estimatedPages > 5 ? '7-10' : estimatedPages > 1 ? '5-7' : '3-5'} most important key points or insights covered in the document.
   - Make each highlight specific and actionable.

4. Key Topics Covered:
   - Mention the main topics or themes discussed in the document.
   - Include ${estimatedPages > 5 ? '6-8' : estimatedPages > 1 ? '4-6' : '3-4'} key topics.

📝 Document Content:
${content}

⚠️ Important Notes:
- The summary must be exactly ${summaryLines} - no more, no less.
- Each line should be substantial and meaningful.
- Reflect the overall message and scope of the document.
- Avoid technical metadata or file structure descriptions.
- Ignore any formatting tags or XML data if present.

Please provide a JSON response with the following format:
{
  "title": "Document title",
  "summary": "Line 1 of summary.\nLine 2 of summary.\nLine 3 of summary.\n[Continue for ${summaryLines}]",
  "highlights": ["Key point 1", "Key point 2", "Key point 3", "Key point 4", "Key point 5"],
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "estimatedReadTime": estimated_reading_time_in_minutes
}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsedSummary = JSON.parse(cleanedText);
        return {
          title: parsedSummary.title || fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
          summary: parsedSummary.summary || 'Summary could not be generated.',
          highlights: Array.isArray(parsedSummary.highlights) ? parsedSummary.highlights : [],
          keyTopics: Array.isArray(parsedSummary.keyTopics) ? parsedSummary.keyTopics : [],
          estimatedReadTime: parsedSummary.estimatedReadTime || Math.ceil(content.split(' ').length / 200)
        };
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        return this.getFallbackSummary(content, fileName, estimatedPages);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackSummary(content, fileName, 1);
    }
  }

  async generateQuestions(content: string, difficulty: string, count: number): Promise<Question[]> {
    try {
      // Estimate document length for the prompt
      const wordCount = content.split(' ').length;
      const pageCount = Math.ceil(wordCount / 250); // Rough estimate: 250 words per page
      
      let documentLength = '';
      if (pageCount <= 1) documentLength = '1 page';
      else if (pageCount <= 2) documentLength = '2 pages';
      else if (pageCount <= 3) documentLength = '3 pages';
      else if (pageCount <= 5) documentLength = '5 pages';
      else documentLength = '6+ pages';

      const prompt = `
You are an exam trainer AI. Based on the educational document provided, generate a set of **multiple choice questions (MCQs)**.

✅ Instructions:
- Each question must have 4 options.
- Mention the correct answer clearly.
- Questions should cover the entire content and key topics in the document.
- Use simple and clear language.

🎯 Target Audience: Competitive exam aspirants (12th grade to graduate level)

📘 Document Content:
${content}

🧠 Difficulty Level: ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}

📄 Document Length: ${documentLength}

---

✍️ Generate:
- Easy Level:
  - 1–2 pages → 10 questions
  - 3–5 pages → 15 questions

- Medium Level:
  - 5 pages → 25 questions
  - >5 pages → 30 questions

- Hard Level:
  - 5 pages → 30 questions
  - >5 pages → 40 questions

---

📌 Final Output Format:
- Numbered list of MCQs
- Each with 4 labeled options (A, B, C, D)
- At the end of each question, mention: Answer: [Correct Option Letter]

Generate the questions, options, and answers, include explanations.

Please provide exactly ${count} questions in JSON format:
{
  "questions": [
    {
      "id": "1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Detailed explanation of why this answer is correct",
      "topic": "Topic name"
    }
  ]
}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to ensure it's valid JSON
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsedResponse = JSON.parse(cleanedText);
        const questions = parsedResponse.questions || [];
        
        return questions.map((q: any, index: number) => ({
          id: q.id || `q_${index + 1}`,
          question: q.question || `Question ${index + 1}`,
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [
            'Option A', 'Option B', 'Option C', 'Option D'
          ],
          correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3 
            ? q.correctAnswer : 0,
          explanation: q.explanation || 'Explanation not available.',
          topic: q.topic || 'General'
        })).slice(0, count);
      } catch (parseError) {
        console.error('Failed to parse Gemini questions response:', parseError);
        return this.getFallbackQuestions(count);
      }
    } catch (error) {
      console.error('Gemini API error for questions:', error);
      return this.getFallbackQuestions(count);
    }
  }

  async generateFlowchart(userPrompt: string): Promise<string> {
    try {
      // Check if user wants text format
      const wantsTextFormat = this.isTextFormatRequest(userPrompt);
      
      if (wantsTextFormat) {
        return await this.generateTextFlowchart(userPrompt);
      }

      // Detect if this is a classification request
      const isClassification = this.isClassificationRequest(userPrompt);
      
      const prompt = isClassification 
        ? this.generateClassificationFlowchartPrompt(userPrompt)
        : this.generateProcessFlowchartPrompt(userPrompt);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response to get only the Mermaid code
      let cleanedText = text
        .replace(/```mermaid\n?|\n?```/g, '')
        .replace(/```\n?|\n?```/g, '')
        .trim();
      
      // Find the first occurrence of 'flowchart' or 'graph' and extract from that point onwards
      const flowchartIndex = cleanedText.toLowerCase().indexOf('flowchart');
      const graphIndex = cleanedText.toLowerCase().indexOf('graph');
      
      let startIndex = -1;
      if (flowchartIndex !== -1 && graphIndex !== -1) {
        startIndex = Math.min(flowchartIndex, graphIndex);
      } else if (flowchartIndex !== -1) {
        startIndex = flowchartIndex;
      } else if (graphIndex !== -1) {
        startIndex = graphIndex;
      }
      
      if (startIndex !== -1) {
        cleanedText = cleanedText.substring(startIndex);
      }
      
      // Validate that it starts with either 'flowchart' or 'graph'
      const lowerText = cleanedText.toLowerCase();
      if (!lowerText.startsWith('flowchart') && !lowerText.startsWith('graph')) {
        throw new Error('Invalid Mermaid flowchart format');
      }
      
      // Validate Mermaid syntax for completeness
      if (!this.isValidMermaidSyntax(cleanedText)) {
        console.warn('Generated Mermaid code appears to be incomplete or malformed, using fallback');
        return this.getFallbackFlowchart(userPrompt);
      }
      
      return cleanedText;
    } catch (error) {
      console.error('Gemini API error for flowchart:', error);
      return this.getFallbackFlowchart(userPrompt);
    }
  }

  private async generateTextFlowchart(userPrompt: string): Promise<string> {
    try {
      // Detect if this is a classification request
      const isClassification = this.isClassificationRequest(userPrompt);
      
      const prompt = isClassification 
        ? this.generateTextClassificationPrompt(userPrompt)
        : this.generateTextProcessPrompt(userPrompt);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response and wrap in a text block for display
      const cleanedText = text
        .replace(/```\w*\n?|\n?```/g, '')
        .trim();
      
      // Return as a special text flowchart format that the component can recognize
      return `TEXT_FLOWCHART:\n${cleanedText}`;
    } catch (error) {
      console.error('Error generating text flowchart:', error);
      return this.getFallbackTextFlowchart(userPrompt);
    }
  }

  private isTextFormatRequest(userPrompt: string): boolean {
    const textFormatKeywords = [
      'text format', 'plain text', 'ascii', 'text-based', 'text style',
      'using text', 'in text', 'text form', 'text only', 'ascii style',
      'plain format', 'text representation', 'textual format'
    ];
    
    const lowerPrompt = userPrompt.toLowerCase();
    return textFormatKeywords.some(keyword => lowerPrompt.includes(keyword));
  }

  private generateTextClassificationPrompt(userInput: string): string {
    return `
🎯 Task:
Generate a classification flowchart in plain text/ASCII format for the concept below.

✅ Use these formatting rules:
- Use boxes made with characters like [Category Name] or |Category Name|
- Use arrows like --> or → to show connections
- Use indentation and spacing to show hierarchy
- Use tree-like structure with branches
- Include examples under categories when relevant
- Make it clear and easy to read

📋 Requirements:
- Start with the main topic at the top
- Show major categories branching down
- Include subcategories with proper indentation
- Add examples where helpful
- Use consistent formatting throughout
- Make the hierarchy visually clear

📥 Concept or Topic:
"${userInput}"

⚠️ Important:
- Output ONLY the text flowchart
- No explanations or additional text
- Use clear visual hierarchy
- Make it production-ready for display
    `;
  }

  private generateTextProcessPrompt(userPrompt: string): string {
    return `
🎯 Task:
Generate a process flowchart in plain text/ASCII format based on the user's input.

✅ Use these formatting rules:
- Use boxes like [Step Name] or |Process|
- Use arrows --> or → to show flow direction
- Use {Decision?} for decision points
- Use ((Start)) and ((End)) for start/end points
- Show branching with proper spacing
- Include Yes/No paths for decisions
- Make the flow logical and easy to follow

📋 Requirements:
- Start with ((Start)) at the top
- Show each step in sequence
- Include decision points where relevant
- Show alternative paths clearly
- End with ((End)) or completion
- Use consistent formatting
- Make it visually clear and professional

📝 User Input:
"${userPrompt}"

⚠️ Important:
- Output ONLY the text flowchart
- No explanations or markdown formatting
- Use clear visual flow
- Make it production-ready for display
    `;
  }

  private getFallbackTextFlowchart(userPrompt: string): string {
    const isClassification = this.isClassificationRequest(userPrompt);
    
    if (isClassification) {
      return `TEXT_FLOWCHART:
                    [Main Topic]
                         |
            ┌────────────┼────────────┐
            |            |            |
      [Category A]  [Category B]  [Category C]
           |            |            |
    ┌──────┼──────┐     |      ┌─────┼─────┐
    |      |      |     |      |     |     |
[Sub A1][Sub A2][Sub A3] [Sub B1] [Sub C1][Sub C2]
    |      |      |     |      |     |     |
[Ex A1][Ex A2][Ex A3] [Ex B1] [Ex C1][Ex C2]`;
    }

    return `TEXT_FLOWCHART:
        ((Start))
            |
            ↓
    [Identify Requirements]
            |
            ↓
      [Plan Approach]
            |
            ↓
     {Resources Available?}
           / \\
      Yes /   \\ No
         /     \\
        ↓       ↓
[Execute Plan] [Acquire Resources]
        |           |
        |           ↓
        |    [Execute Plan]
        |           |
        ↓           ↓
     {Quality Check}
           / \\
      Pass/   \\Fail
         /     \\
        ↓       ↓
  [Complete] [Review & Improve]
        |           |
        ↓           ↓
    ((End))    [Plan Approach]`;
  }

  private isValidMermaidSyntax(mermaidCode: string): boolean {
    try {
      // Check for basic structure
      const lines = mermaidCode.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length < 2) {
        return false; // Too short to be a valid flowchart
      }
      
      // First line should be flowchart declaration
      const firstLine = lines[0].toLowerCase();
      if (!firstLine.startsWith('flowchart') && !firstLine.startsWith('graph')) {
        return false;
      }
      
      // Check for unclosed brackets/braces in node definitions
      for (const line of lines.slice(1)) {
        // Skip comment lines and empty lines
        if (line.startsWith('%%') || line.trim() === '') {
          continue;
        }
        
        // Check for invalid nested shapes like A[((Start))] or B{[Text]}
        if (this.hasInvalidShapeNesting(line)) {
          return false;
        }
        
        // Check for unexpected characters within node definitions
        if (this.hasUnexpectedCharacters(line)) {
          return false;
        }
        
        // Check for unclosed square brackets [
        const openSquare = (line.match(/\[/g) || []).length;
        const closeSquare = (line.match(/\]/g) || []).length;
        if (openSquare !== closeSquare) {
          return false;
        }
        
        // Check for unclosed curly braces {
        const openCurly = (line.match(/\{/g) || []).length;
        const closeCurly = (line.match(/\}/g) || []).length;
        if (openCurly !== closeCurly) {
          return false;
        }
        
        // Check for unclosed parentheses (
        const openParen = (line.match(/\(/g) || []).length;
        const closeParen = (line.match(/\)/g) || []).length;
        if (openParen !== closeParen) {
          return false;
        }
        
        // Check for incomplete node definitions (lines that seem to end abruptly)
        // Look for patterns like "A[Text" or "B{Text" without proper closing
        if (line.includes('[') && !line.includes(']')) {
          return false;
        }
        if (line.includes('{') && !line.includes('}')) {
          return false;
        }
        if (line.includes('((') && !line.includes('))')) {
          return false;
        }
      }
      
      // Check that there are actual node connections (arrows)
      const hasConnections = lines.some(line => 
        line.includes('-->') || 
        line.includes('---') || 
        line.includes('-.->') || 
        line.includes('==>') ||
        line.includes('<--') ||
        line.includes('<|--')
      );
      
      if (!hasConnections) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating Mermaid syntax:', error);
      return false;
    }
  }

  private hasInvalidShapeNesting(line: string): boolean {
    // Check for invalid nested shapes like A[((Start))] or B{[Text]} or C((Text))
    const invalidPatterns = [
      /\[\(\(/,  // [((
      /\)\)\]/,  // ))]
      /\{\[/,    // {[
      /\]\}/,    // ]}
      /\[\{/,    // [{
      /\}\]/,    // }]
      /\(\(\[/,  // (([
      /\]\)\)/,  // ]))
      /\(\(\{/,  // (({
      /\}\)\)/   // }))
    ];
    
    return invalidPatterns.some(pattern => pattern.test(line));
  }

  private hasUnexpectedCharacters(line: string): boolean {
    // Check for unexpected character sequences that often indicate malformed AI output
    const unexpectedPatterns = [
      /---+\^/,     // Multiple dashes followed by caret (like "---------------^")
      /===+\^/,     // Multiple equals followed by caret
      /\^\s*$/,     // Line ending with caret
      /\s---+\s/,   // Dashes surrounded by spaces within node text
      /\s===+\s/,   // Equals surrounded by spaces within node text
      /\|\s*---/,   // Pipe followed by dashes (malformed arrow)
      /---\s*\|/,   // Dashes followed by pipe (malformed arrow)
    ];
    
    return unexpectedPatterns.some(pattern => pattern.test(line));
  }

  private isClassificationRequest(userPrompt: string): boolean {
    const classificationKeywords = [
      'classify', 'classification', 'categories', 'categorize', 'types of',
      'kinds of', 'taxonomy', 'hierarchy', 'breakdown', 'organize',
      'group', 'divide', 'separate', 'sort', 'arrange', 'structure'
    ];
    
    const lowerPrompt = userPrompt.toLowerCase();
    return classificationKeywords.some(keyword => lowerPrompt.includes(keyword));
  }

  private generateClassificationFlowchartPrompt(userInput: string): string {
    return `
🎯 Task:
Generate a **classification flowchart** in Mermaid.js syntax for the concept below.

✅ Use these visual rules:
- ((Circle)) → for Start and End nodes
- [Rectangle] → for category and class names
- {Diamond} → for any decisions
- Use --> arrows for connections
- Use <|-- or --> for hierarchy when splitting categories

⚠️ Do not include any explanation. Only return clean Mermaid.js code that can be rendered on a whiteboard-style interface.

📥 Concept or Topic:
"${userInput}"
    `;
  }

  private generateProcessFlowchartPrompt(userPrompt: string): string {
    return `
🎯 Task:
Generate a clean, whiteboard-style flowchart in Mermaid.js syntax based on the user's input concept or process.

📋 Requirements:
- Use ((Circle)) for start/end points
- Use [Rectangle] for standard process steps
- Use {Diamond} for decision points
- Use --> arrows to connect steps
- Make it logical, flowing, and easy to understand
- Include all major steps and decision points
- Use clear, concise labels
- Ensure proper flow direction (top to bottom or left to right)

📝 User Input:
"${userPrompt}"

⚠️ Important:
- Return ONLY the Mermaid.js flowchart code
- Do not include explanations, markdown formatting, or extra text
- Start with "flowchart TD" or "flowchart LR"
- Use meaningful node IDs (A, B, C, etc.)
- Make sure all paths lead to logical conclusions

Example format:
flowchart TD
    A((Start)) --> B[Step 1]
    B --> C{Decision?}
    C -->|Yes| D[Action 1]
    C -->|No| E[Action 2]
    D --> F((End))
    E --> F
    `;
  }

  private getFallbackFlowchart(userPrompt: string): string {
    // Check if it's a classification request
    if (this.isClassificationRequest(userPrompt)) {
      return `flowchart TD
    A((Start Classification)) --> B[Main Category]
    B --> C{Type A?}
    B --> D{Type B?}
    B --> E{Type C?}
    C -->|Yes| F[Subcategory A1]
    C -->|No| G[Subcategory A2]
    D -->|Yes| H[Subcategory B1]
    D -->|No| I[Subcategory B2]
    E -->|Yes| J[Subcategory C1]
    E -->|No| K[Subcategory C2]
    F --> L((Classification Complete))
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L`;
    }

    // Generate a basic process flowchart based on common patterns
    const isProcess = userPrompt.toLowerCase().includes('process') || 
                     userPrompt.toLowerCase().includes('workflow') ||
                     userPrompt.toLowerCase().includes('how');
    
    if (isProcess) {
      return `flowchart TD
    A((Start Process)) --> B[Identify Requirements]
    B --> C[Plan Approach]
    C --> D{Resources Available?}
    D -->|Yes| E[Execute Plan]
    D -->|No| F[Acquire Resources]
    F --> E
    E --> G{Quality Check}
    G -->|Pass| H[Complete Process]
    G -->|Fail| I[Review & Improve]
    I --> C
    H --> J((End))`;
    }
    
    return `flowchart TD
    A((Start)) --> B[Understand Topic]
    B --> C[Gather Information]
    C --> D[Analyze Data]
    D --> E{Need More Info?}
    E -->|Yes| C
    E -->|No| F[Draw Conclusions]
    F --> G[Take Action]
    G --> H((Complete))`;
  }

  private getFallbackSummary(content: string, fileName: string, estimatedPages: number): DocumentSummary {
    const wordCount = content.split(' ').length;
    
    // Generate appropriate fallback summary based on page count
    let summary = '';
    let highlights: string[] = [];
    let keyTopics: string[] = [];
    
    if (estimatedPages <= 1) {
      summary = "This document provides essential information on the subject matter. It covers fundamental concepts with clear explanations. The content is structured to facilitate quick understanding and practical application.";
      highlights = [
        "Core concepts clearly explained",
        "Practical applications provided",
        "Essential information covered"
      ];
      keyTopics = [
        "Fundamental Concepts",
        "Key Principles",
        "Practical Applications"
      ];
    } else if (estimatedPages <= 5) {
      summary = "This document offers comprehensive coverage of the subject matter with detailed explanations of core concepts. It includes theoretical foundations and practical applications to enhance understanding. The material is well-structured with clear examples and case studies. Key methodologies and best practices are thoroughly discussed. The content provides valuable insights for both beginners and advanced learners.";
      highlights = [
        "Comprehensive coverage of core concepts and principles",
        "Detailed theoretical foundations with practical applications",
        "Well-structured content with clear examples and case studies",
        "Key methodologies and best practices thoroughly explained",
        "Valuable insights for learners at different levels"
      ];
      keyTopics = [
        "Theoretical Framework",
        "Practical Applications",
        "Case Studies",
        "Best Practices"
      ];
    } else {
      summary = "This comprehensive document provides extensive coverage of the subject matter with in-depth analysis of core concepts and principles. It begins with fundamental theoretical foundations and progressively builds to advanced topics and specialized applications. The material includes detailed explanations, numerous examples, and comprehensive case studies that illustrate real-world implementations. Key methodologies, best practices, and industry standards are thoroughly examined throughout multiple sections. The document offers valuable insights for practitioners, researchers, and students at various levels of expertise. Advanced topics are explored with careful attention to current trends and future developments in the field. The content is meticulously organized to facilitate both sequential reading and selective reference use. Practical guidelines and actionable recommendations are provided to support immediate application of the concepts. The document serves as both an educational resource and a professional reference guide. Critical analysis and comparative studies enhance the depth of understanding across different approaches and methodologies. Contemporary challenges and emerging solutions are addressed with forward-looking perspectives. The comprehensive nature of this document makes it an essential resource for anyone seeking thorough understanding of the subject matter. Integration of theory and practice is emphasized throughout to ensure practical relevance and applicability. The document concludes with synthesis of key learnings and recommendations for further exploration.";
      highlights = [
        "Extensive coverage with in-depth analysis of core concepts and advanced principles",
        "Progressive structure from fundamental foundations to specialized applications",
        "Comprehensive case studies illustrating real-world implementations and best practices",
        "Thorough examination of methodologies, industry standards, and current trends",
        "Valuable insights for practitioners, researchers, and students at all expertise levels",
        "Advanced topics explored with attention to future developments and emerging solutions",
        "Meticulously organized for both sequential reading and selective reference use",
        "Practical guidelines and actionable recommendations for immediate application",
        "Critical analysis and comparative studies across different approaches and methodologies",
        "Integration of theory and practice emphasized throughout for practical relevance"
      ];
      keyTopics = [
        "Theoretical Foundations",
        "Advanced Applications",
        "Industry Standards",
        "Best Practices",
        "Case Studies",
        "Emerging Trends",
        "Practical Guidelines",
        "Comparative Analysis"
      ];
    }
    
    return {
      title: fileName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      highlights,
      summary,
      keyTopics,
      estimatedReadTime: Math.ceil(wordCount / 200)
    };
  }

  private getFallbackQuestions(count: number): Question[] {
    const baseQuestions: Question[] = [
      {
        id: '1',
        question: 'What is the primary focus of this document?',
        options: [
          'Theoretical concepts and principles',
          'Practical implementation only',
          'Historical overview',
          'Future predictions'
        ],
        correctAnswer: 0,
        explanation: 'The document primarily focuses on theoretical concepts and principles as evidenced by the structured approach to explaining fundamental ideas.',
        topic: 'Core Concepts'
      },
      {
        id: '2',
        question: 'Which methodology is emphasized throughout the content?',
        options: [
          'Experimental approach',
          'Systematic analysis',
          'Random sampling',
          'Intuitive reasoning'
        ],
        correctAnswer: 1,
        explanation: 'The content emphasizes systematic analysis as the preferred methodology for understanding complex topics.',
        topic: 'Methodology'
      },
      {
        id: '3',
        question: 'What is the key takeaway from the practical examples provided?',
        options: [
          'Theory and practice must be integrated',
          'Practice is more important than theory',
          'Examples are merely illustrative',
          'Practical applications are limited'
        ],
        correctAnswer: 0,
        explanation: 'The examples demonstrate that theory and practice must be integrated for complete understanding.',
        topic: 'Practical Applications'
      }
    ];

    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
      const baseQuestion = baseQuestions[i % baseQuestions.length];
      questions.push({
        ...baseQuestion,
        id: `fallback_q_${i + 1}`,
        question: `${baseQuestion.question} (Question ${i + 1})`,
      });
    }
    
    return questions;
  }
}

export const geminiService = new GeminiService();
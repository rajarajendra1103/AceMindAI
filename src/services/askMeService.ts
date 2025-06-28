import { geminiService } from './geminiService';
import { youtubeService } from './youtubeService';
import { searchInfoService } from './searchInfoService';

export class AskMeService {
  async processQuery(userInput: string): Promise<{ response: string; isYouTubeLink: boolean; videoTitle?: string; hasLiveInfo?: boolean }> {
    try {
      const isYouTubeLink = youtubeService.isYouTubeUrl(userInput);
      
      if (isYouTubeLink) {
        return await this.handleYouTubeQuery(userInput);
      } else {
        return await this.handleGeneralQuery(userInput);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      return {
        response: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.',
        isYouTubeLink: false
      };
    }
  }

  private async handleYouTubeQuery(url: string): Promise<{ response: string; isYouTubeLink: boolean; videoTitle?: string }> {
    try {
      const videoContent = await youtubeService.getVideoSummaryContent(url);
      
      if (!videoContent) {
        return {
          response: 'I was unable to retrieve information from this YouTube video. Please check the URL or try a different video.',
          isYouTubeLink: true
        };
      }

      const prompt = this.generateYouTubeSummaryPrompt(videoContent.content);
      const summary = await geminiService.generateResponse(prompt);

      return {
        response: summary,
        isYouTubeLink: true,
        videoTitle: videoContent.title
      };
    } catch (error) {
      console.error('Error handling YouTube query:', error);
      return {
        response: 'I encountered an error while processing this YouTube video. The video might be private, unavailable, or there might be an issue with the YouTube API.',
        isYouTubeLink: true
      };
    }
  }

  private async handleGeneralQuery(userInput: string): Promise<{ response: string; isYouTubeLink: boolean; hasLiveInfo?: boolean }> {
    try {
      // Check if query needs real-time search
      const needsRealTimeSearch = searchInfoService.needsRealTimeSearch(userInput);
      let searchSnippet = '';
      
      if (needsRealTimeSearch) {
        console.log('Query needs real-time search, fetching current info...');
        const snippet = await searchInfoService.getFirstSearchResult(userInput);
        if (snippet) {
          searchSnippet = snippet;
        }
      }

      const prompt = searchSnippet 
        ? this.generateRealTimeAskPrompt(userInput, searchSnippet)
        : this.generateGeneralQueryPrompt(userInput);
      
      const response = await geminiService.generateResponse(prompt);

      return {
        response,
        isYouTubeLink: false,
        hasLiveInfo: needsRealTimeSearch && searchSnippet.length > 0
      };
    } catch (error) {
      console.error('Error handling general query:', error);
      return {
        response: 'I apologize, but I encountered an error while processing your question. Please try rephrasing your question or try again later.',
        isYouTubeLink: false
      };
    }
  }

  private generateRealTimeAskPrompt(userInput: string, searchSnippet: string): string {
    return `
You are a helpful assistant.

Here is recent information from the web:
"${searchSnippet}"

Now, using that and your knowledge, answer this:
"${userInput}"
`;
  }

  private generateYouTubeSummaryPrompt(videoContent: string): string {
    return `
You are an expert summarizer and educational assistant.

🧠 Task: Provide a comprehensive 8-12 sentence summary of the following YouTube video content.
Begin with a clear title, then provide the summary in well-structured paragraphs.

📋 Requirements:
- Start with a descriptive title for the video content
- Provide a detailed summary covering the main points
- Highlight key concepts, insights, or takeaways
- Make it educational and informative
- Use clear, engaging language
- Structure the content logically
- Include any important details or examples mentioned

📜 Video Content:
${videoContent}

Format your response as:
**Title:** [Descriptive title]

**Summary:**
[Your comprehensive summary here]

**Key Takeaways:**
• [Key point 1]
• [Key point 2]
• [Key point 3]
`;
  }

  private generateGeneralQueryPrompt(userInput: string): string {
    return `
You are a helpful, knowledgeable tutor and educational assistant. Respond clearly and in detail to the question below.
Provide comprehensive, accurate information while maintaining a friendly and educational tone.

📋 Guidelines:
- Give detailed, well-structured answers
- Use examples when helpful
- Break down complex topics into understandable parts
- Provide practical insights when relevant
- Be encouraging and supportive
- Use clear, accessible language
- Include relevant context or background information

📥 Question:
"${userInput}"

Please provide a thorough and helpful response that addresses the question comprehensively.
`;
  }
}

export const askMeService = new AskMeService();
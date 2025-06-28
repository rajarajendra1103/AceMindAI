interface YouTubeTranscriptItem {
  text: string;
  start: number;
  duration: number;
}

export class YouTubeService {
  private apiKey = 'AIzaSyBLNJRKGvi61U43ERTNXRYPiyY1EyKypsg';

  isYouTubeUrl(text: string): boolean {
    const youtubePatterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];
    
    return youtubePatterns.some(pattern => pattern.test(text.trim()));
  }

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  }

  async getVideoInfo(videoId: string): Promise<{ title: string; description: string; channelTitle: string } | null> {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching video info:', error);
      return null;
    }
  }

  async fetchTranscript(videoId: string): Promise<string | null> {
    try {
      // Since we can't use youtube_transcript_api in the browser, we'll use the video description
      // and title as a fallback for generating summaries
      const videoInfo = await this.getVideoInfo(videoId);
      
      if (videoInfo) {
        // Use the description as transcript content for summary generation
        const content = `Video Title: ${videoInfo.title}\nChannel: ${videoInfo.channelTitle}\n\nDescription:\n${videoInfo.description}`;
        return content;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching transcript:', error);
      return null;
    }
  }

  async getVideoSummaryContent(url: string): Promise<{ content: string; title: string } | null> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return null;
    }

    const videoInfo = await this.getVideoInfo(videoId);
    if (!videoInfo) {
      return null;
    }

    // Create content from available video information
    const content = `Video Title: ${videoInfo.title}
Channel: ${videoInfo.channelTitle}

Video Description:
${videoInfo.description}

Note: This summary is based on the video's title and description. For more detailed analysis, please provide the video transcript or key points you'd like me to focus on.`;

    return {
      content,
      title: videoInfo.title
    };
  }
}

export const youtubeService = new YouTubeService();
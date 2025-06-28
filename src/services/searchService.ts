interface BookResult {
  title: string;
  author: string;
  first_publish_year?: number;
  read_url: string;
  download_url?: string;
  cover_id?: number;
  subject?: string[];
  language?: string[];
  isbn?: string[];
  key: string;
}

interface VideoResult {
  title: string;
  link: string;
  channel: string;
  rating: string;
  thumbnail?: string;
  duration?: string;
  publishedAt?: string;
  viewCount?: string;
  likeCount?: string;
}

export class SearchService {
  private youtubeApiKey = 'AIzaSyBLNJRKGvi61U43ERTNXRYPiyY1EyKypsg';

  async searchBooks(query: string): Promise<BookResult[]> {
    try {
      // Clean and encode the query
      const encodedQuery = encodeURIComponent(query.trim());
      const url = `https://openlibrary.org/search.json?q=${encodedQuery}&limit=20&fields=key,title,author_name,first_publish_year,cover_i,subject,language,isbn,ia,has_fulltext`;
      
      console.log('Searching Open Library with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Open Library API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Open Library response:', data);
      
      if (!data.docs || data.docs.length === 0) {
        return [];
      }

      return data.docs.map((book: any) => {
        const title = book.title || 'Unknown Title';
        const authors = book.author_name ? book.author_name.join(', ') : 'Unknown Author';
        const year = book.first_publish_year;
        const key = book.key;
        const coverId = book.cover_i;
        const subjects = book.subject ? book.subject.slice(0, 5) : [];
        const languages = book.language || [];
        const isbn = book.isbn ? book.isbn[0] : null;
        const internetArchive = book.ia;
        const hasFulltext = book.has_fulltext;

        // Generate read URL
        const readUrl = `https://openlibrary.org${key}`;
        
        // Generate download URL if available
        let downloadUrl = undefined;
        if (internetArchive && internetArchive.length > 0) {
          downloadUrl = `https://archive.org/details/${internetArchive[0]}`;
        } else if (hasFulltext && isbn) {
          downloadUrl = `https://archive.org/search.php?query=${isbn}`;
        }

        return {
          title,
          author: authors,
          first_publish_year: year,
          read_url: readUrl,
          download_url: downloadUrl,
          cover_id: coverId,
          subject: subjects,
          language: languages,
          isbn: isbn ? [isbn] : undefined,
          key
        };
      });

    } catch (error) {
      console.error('Error searching books:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to Open Library. Please check your internet connection and try again.');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to search books. Please try again.');
    }
  }

  async searchVideos(query: string, language: string = 'English'): Promise<VideoResult[]> {
    try {
      // Enhance query for educational content with AI-like optimization
      const educationalKeywords = [
        'tutorial', 'explained', 'lesson', 'course', 'learn', 'education', 
        'study', 'guide', 'basics', 'introduction', 'how to'
      ];
      
      // Smart query enhancement based on topic
      let enhancedQuery = query;
      if (!educationalKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
        const randomKeyword = educationalKeywords[Math.floor(Math.random() * educationalKeywords.length)];
        enhancedQuery = `${query} ${randomKeyword}`;
      }
      
      // Add language to query if not English
      const finalQuery = language !== 'English' ? `${enhancedQuery} ${language}` : enhancedQuery;
      const encodedQuery = encodeURIComponent(finalQuery);

      // Search for videos with educational focus
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=15&q=${encodedQuery}&key=${this.youtubeApiKey}&order=relevance&videoDuration=medium&videoDefinition=high&videoCategory=27`;
      
      console.log('Searching YouTube with enhanced query:', finalQuery);
      
      const searchResponse = await fetch(searchUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!searchResponse.ok) {
        if (searchResponse.status === 403) {
          throw new Error('YouTube API quota exceeded. Please try again later.');
        }
        throw new Error(`YouTube API error: ${searchResponse.status} ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      console.log('YouTube search response:', searchData);
      
      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      // Get video IDs for detailed statistics
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      
      // Fetch comprehensive video statistics
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${this.youtubeApiKey}`;
      
      const statsResponse = await fetch(statsUrl, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Accept': 'application/json'
        }
      });
      const statsData = await statsResponse.json();
      
      const videoStats = new Map();
      if (statsData.items) {
        statsData.items.forEach((item: any) => {
          videoStats.set(item.id, {
            viewCount: item.statistics?.viewCount || '0',
            likeCount: item.statistics?.likeCount || '0',
            dislikeCount: item.statistics?.dislikeCount || '0',
            commentCount: item.statistics?.commentCount || '0',
            duration: item.contentDetails?.duration || 'PT0M0S'
          });
        });
      }

      return searchData.items.map((item: any) => {
        const videoId = item.id.videoId;
        const stats = videoStats.get(videoId) || {};
        
        // AI-enhanced rating calculation
        const views = parseInt(stats.viewCount || '0');
        const likes = parseInt(stats.likeCount || '0');
        const comments = parseInt(stats.commentCount || '0');
        
        // Calculate engagement score
        const engagementRatio = views > 0 ? ((likes + comments) / views) * 100 : 0;
        
        // AI-style rating based on multiple factors
        let rating = '⭐ Basic';
        if (engagementRatio > 3 && views > 10000) rating = '⭐⭐⭐ Excellent';
        else if (engagementRatio > 2 && views > 5000) rating = '⭐⭐ Good';
        else if (engagementRatio > 1) rating = '⭐⭐ Fair';
        
        // Format duration
        const duration = this.formatDuration(stats.duration || 'PT0M0S');
        
        // Format view count
        const viewCount = this.formatViewCount(stats.viewCount || '0');

        return {
          title: item.snippet.title,
          link: `https://www.youtube.com/watch?v=${videoId}`,
          channel: item.snippet.channelTitle,
          rating,
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          duration,
          publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
          viewCount,
          likeCount: this.formatViewCount(stats.likeCount || '0')
        };
      });

    } catch (error) {
      console.error('Error searching videos:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network error: Unable to connect to YouTube API. Please check your internet connection and try again.');
      }
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to search videos. Please try again.');
    }
  }

  private formatDuration(duration: string): string {
    // Parse ISO 8601 duration (PT1H2M3S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '0:00';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private formatViewCount(count: string): string {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M views`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K views`;
    }
    return `${num} views`;
  }
}

export const searchService = new SearchService();
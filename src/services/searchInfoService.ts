export class SearchInfoService {
  private googleApiKey = 'AIzaSyBLNJRKGvi61U43ERTNXRYPiyY1EyKypsg';
  private searchEngineId = '017576662512468239146:omuauf_lfve';

  // Keywords that trigger real-time search
  private triggerKeywords = [
    'today', 'current', 'latest', 'who is', 'when is', 'what is happening',
    'recent', 'now', 'this year', 'new', 'breaking', 'update', 'news'
  ];

  needsRealTimeSearch(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return this.triggerKeywords.some(keyword => lowerQuery.includes(keyword));
  }

  async getFirstSearchResult(query: string): Promise<string | null> {
    try {
      const searchQuery = this.cleanQuery(query);
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.googleApiKey}&cx=${this.searchEngineId}&q=${encodeURIComponent(searchQuery)}&num=1`;
      
      console.log('Searching Google for:', searchQuery);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error('Google Search API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const firstResult = data.items[0];
        return firstResult.snippet || firstResult.title || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching search result:', error);
      return null;
    }
  }

  private cleanQuery(query: string): string {
    // Remove question words for better search results
    return query
      .replace(/^(what|how|when|where|why|who|which|can you|tell me|explain)/gi, '')
      .replace(/\?+$/g, '')
      .trim();
  }
}

export const searchInfoService = new SearchInfoService();
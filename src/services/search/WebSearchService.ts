import axios from 'axios';
import { SearchQuery, SearchResult, ScrapedContent } from '../../types/search.types';

export interface SearchConfig {
  tavilyApiKey?: string;
  maxResults: number;
  enableScraping: boolean;
}

class WebSearchService {
  private config: SearchConfig;

  constructor(config: Partial<SearchConfig> = {}) {
    this.config = {
      maxResults: 5,
      enableScraping: true,
      ...config
    };
  }

  // Main search function
  async search(query: SearchQuery): Promise<SearchResult[]> {
    // Try Tavily first if API key is available
    if (this.config.tavilyApiKey) {
      try {
        return await this.searchTavily(query);
      } catch (error) {
        console.error('Tavily search failed, falling back to SearXNG:', error);
      }
    }

    // Fallback to SearXNG (free, self-hosted option)
    return await this.searchSearXNG(query);
  }

  // Search using Tavily API (requires API key)
  private async searchTavily(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const response = await axios.post(
        'https://api.tavily.com/search',
        {
          api_key: this.config.tavilyApiKey,
          query: query.query,
          max_results: query.maxResults || this.config.maxResults,
          search_depth: 'advanced',
          include_answer: true,
          include_raw_content: true
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      return response.data.results.map((result: any, index: number) => ({
        id: `tavily-${index}`,
        title: result.title,
        url: result.url,
        snippet: result.content || result.snippet,
        content: result.raw_content,
        publishedDate: result.published_date ? new Date(result.published_date) : undefined,
        score: result.score || 0.8,
        source: 'tavily' as const
      }));
    } catch (error) {
      console.error('Tavily search error:', error);
      throw error;
    }
  }

  // Search using SearXNG (free, no API key needed)
  private async searchSearXNG(query: SearchQuery): Promise<SearchResult[]> {
    try {
      // Use public SearXNG instance
      const searxngUrl = 'https://searx.be/search';
      
      const response = await axios.get(searxngUrl, {
        params: {
          q: query.query,
          format: 'json',
          engines: 'google,bing,duckduckgo',
          categories: 'general',
          language: query.filters?.language || 'en'
        },
        timeout: 10000
      });

      const results = response.data.results || [];
      return results
        .slice(0, query.maxResults || this.config.maxResults)
        .map((result: any, index: number) => ({
          id: `searxng-${index}`,
          title: result.title,
          url: result.url,
          snippet: result.content || '',
          score: result.score || 0.7,
          source: 'searxng' as const
        }));
    } catch (error) {
      console.error('SearXNG search error:', error);
      
      // Ultimate fallback: return mock results
      return this.getMockResults(query.query);
    }
  }

  // Scrape content from a URL
  async scrapeUrl(url: string): Promise<ScrapedContent> {
    if (!this.config.enableScraping) {
      throw new Error('Scraping is disabled');
    }

    try {
      // Use a scraping service or proxy to avoid CORS issues
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const html = response.data;
      const cleaned = this.extractMainContent(html);

      return {
        url,
        title: this.extractTitle(html),
        content: cleaned,
        markdown: this.htmlToMarkdown(cleaned),
        metadata: {
          wordCount: cleaned.split(/\s+/).length,
          readingTime: Math.ceil(cleaned.split(/\s+/).length / 200) // 200 WPM
        },
        status: 'success'
      };
    } catch (error) {
      console.error('Scraping error:', error);
      return {
        url,
        title: 'Failed to scrape',
        content: '',
        metadata: { wordCount: 0, readingTime: 0 },
        status: 'failed'
      };
    }
  }

  // Extract main content from HTML (simple version)
  private extractMainContent(html: string): string {
    // Remove scripts and styles
    let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
    
    // Clean up whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Limit length to avoid huge content
    return cleaned.substring(0, 10000);
  }

  // Extract title from HTML
  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : 'Untitled';
  }

  // Convert HTML to Markdown (basic conversion)
  private htmlToMarkdown(html: string): string {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
  }

  // Mock results for testing/fallback
  private getMockResults(query: string): SearchResult[] {
    return [
      {
        id: 'mock-1',
        title: `Results for "${query}"`,
        url: 'https://example.com',
        snippet: 'This is a mock result. Configure Tavily API key or use SearXNG for real results.',
        score: 0.5,
        source: 'cached'
      }
    ];
  }

  // Update configuration
  updateConfig(config: Partial<SearchConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Set Tavily API key
  setTavilyApiKey(apiKey: string) {
    this.config.tavilyApiKey = apiKey;
  }
}

export default WebSearchService;

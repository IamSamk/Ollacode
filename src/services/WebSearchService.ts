/**
 * Web Search Service
 * Internet-Connected Real-Time Information Retrieval for development assistance
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'web' | 'stackoverflow' | 'github' | 'docs';
  relevanceScore?: number;
  timestamp: Date;
}

export interface SearchOptions {
  source?: 'all' | 'stackoverflow' | 'github' | 'docs' | 'web';
  maxResults?: number;
  language?: string;
  includeCode?: boolean;
}

export class WebSearchService {
  private isEnabled = false;
  private searchHistory: SearchResult[] = [];
  private maxHistoryItems = 50;

  constructor() {
    // Initialize with user preferences
    this.loadSettings();
  }

  /**
   * Enable/disable web search functionality
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveSettings();
  }

  /**
   * Check if web search is enabled
   */
  isSearchEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Perform web search with various sources
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.isEnabled) {
      throw new Error('Web search is disabled. Enable it in settings.');
    }

    const opts: Required<SearchOptions> = {
      source: 'all',
      maxResults: 10,
      language: 'en',
      includeCode: true,
      ...options,
    };

    try {
      let results: SearchResult[] = [];

      // Search different sources based on options
      if (opts.source === 'all' || opts.source === 'stackoverflow') {
        const stackResults = await this.searchStackOverflow(query, opts);
        results.push(...stackResults);
      }

      if (opts.source === 'all' || opts.source === 'github') {
        const githubResults = await this.searchGitHub(query, opts);
        results.push(...githubResults);
      }

      if (opts.source === 'all' || opts.source === 'docs') {
        const docResults = await this.searchDocumentation(query, opts);
        results.push(...docResults);
      }

      if (opts.source === 'all' || opts.source === 'web') {
        const webResults = await this.searchWeb(query, opts);
        results.push(...webResults);
      }

      // Sort by relevance and limit results
      results = results
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, opts.maxResults);

      // Add to search history
      this.addToHistory(results);

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search specifically for error messages and solutions
   */
  async searchError(errorMessage: string, language?: string): Promise<SearchResult[]> {
    const sanitizedError = this.sanitizeErrorMessage(errorMessage);
    const query = language ? `${sanitizedError} ${language}` : sanitizedError;
    
    return this.search(query, {
      source: 'stackoverflow',
      maxResults: 5,
      language: language || 'en',
      includeCode: true,
    });
  }

  /**
   * Search for documentation and API references
   */
  async searchDocs(query: string, framework?: string): Promise<SearchResult[]> {
    const docQuery = framework ? `${query} ${framework} documentation` : `${query} documentation`;
    
    return this.search(docQuery, {
      source: 'docs',
      maxResults: 8,
      includeCode: false,
    });
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchResult[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearHistory(): void {
    this.searchHistory = [];
    this.saveSettings();
  }

  // Private search implementation methods

  private async searchStackOverflow(query: string, _options: Required<SearchOptions>): Promise<SearchResult[]> {
    // For now, return mock data. In production, integrate with StackOverflow API
    // or use a search service like SerpAPI, Bing API, etc.
    
    return [
      {
        title: `How to fix: ${query}`,
        url: `https://stackoverflow.com/questions/search?q=${encodeURIComponent(query)}`,
        snippet: 'Stack Overflow search results would appear here with real API integration.',
        source: 'stackoverflow',
        relevanceScore: 0.9,
        timestamp: new Date(),
      },
    ];
  }

  private async searchGitHub(query: string, _options: Required<SearchOptions>): Promise<SearchResult[]> {
    // For now, return mock data. In production, integrate with GitHub API
    return [
      {
        title: `GitHub repositories: ${query}`,
        url: `https://github.com/search?q=${encodeURIComponent(query)}`,
        snippet: 'GitHub search results would appear here with real API integration.',
        source: 'github',
        relevanceScore: 0.8,
        timestamp: new Date(),
      },
    ];
  }

  private async searchDocumentation(query: string, _options: Required<SearchOptions>): Promise<SearchResult[]> {
    // For now, return mock data. In production, integrate with documentation APIs
    return [
      {
        title: `Documentation: ${query}`,
        url: `https://docs.example.com/search?q=${encodeURIComponent(query)}`,
        snippet: 'Documentation search results would appear here with real API integration.',
        source: 'docs',
        relevanceScore: 0.85,
        timestamp: new Date(),
      },
    ];
  }

  private async searchWeb(query: string, _options: Required<SearchOptions>): Promise<SearchResult[]> {
    // For now, return mock data. In production, integrate with Bing API, Google Custom Search, etc.
    return [
      {
        title: `Web search: ${query}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        snippet: 'Web search results would appear here with real API integration.',
        source: 'web',
        relevanceScore: 0.7,
        timestamp: new Date(),
      },
    ];
  }

  private sanitizeErrorMessage(error: string): string {
    // Remove file paths, line numbers, and other noise from error messages
    return error
      .replace(/\/[^\s]+:\d+:\d+/g, '') // Remove file paths with line numbers
      .replace(/\d+:\d+/g, '') // Remove line:column numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private addToHistory(results: SearchResult[]): void {
    this.searchHistory.push(...results);
    
    // Keep only recent searches
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(-this.maxHistoryItems);
    }
    
    this.saveSettings();
  }

  private loadSettings(): void {
    try {
      const settings = localStorage.getItem('webSearchSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        this.isEnabled = parsed.isEnabled || false;
        this.searchHistory = parsed.searchHistory || [];
      }
    } catch (error) {
      console.error('Failed to load web search settings:', error);
    }
  }

  private saveSettings(): void {
    try {
      const settings = {
        isEnabled: this.isEnabled,
        searchHistory: this.searchHistory.slice(-this.maxHistoryItems),
      };
      localStorage.setItem('webSearchSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save web search settings:', error);
    }
  }
}

// Singleton instance
export const webSearchService = new WebSearchService();

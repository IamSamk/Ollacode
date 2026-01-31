export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  maxResults?: number;
}

export interface SearchFilters {
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  domains?: string[];
  language?: string;
  contentType?: 'article' | 'academic' | 'news' | 'all';
}

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  content?: string;
  publishedDate?: Date;
  author?: string;
  score: number;
  source: SearchSource;
}

export type SearchSource = 'tavily' | 'searxng' | 'brave' | 'cached';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  markdown?: string;
  metadata: {
    author?: string;
    publishDate?: Date;
    wordCount: number;
    readingTime: number;
  };
  status: 'success' | 'partial' | 'failed';
}

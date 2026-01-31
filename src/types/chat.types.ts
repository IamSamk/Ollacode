export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  reasoning?: ReasoningStep[];
  citations?: Citation[];
  files?: AttachedFile[];
}

export interface ReasoningStep {
  step: number;
  thought: string;
  confidence: number;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  timestamp: Date;
}

export interface AttachedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  metadata?: any;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  model: string;
  totalTokens: number;
  searchCount: number;
  fileCount: number;
}

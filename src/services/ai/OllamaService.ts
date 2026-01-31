import axios from 'axios';
import { Message } from '../../types/chat.types';

export interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ModelInfo {
  name: string;
  size: string;
  vramUsage: string;
  description: string;
  recommended: boolean;
}

// Lightweight models optimized for RTX 5070Ti
export const RECOMMENDED_MODELS: ModelInfo[] = [
  {
    name: 'qwen2.5:7b',
    size: '4.7GB',
    vramUsage: '~5GB',
    description: 'Fast, efficient, excellent reasoning. Best for multitasking.',
    recommended: true
  },
  {
    name: 'phi4:14b',
    size: '8.6GB',
    vramUsage: '~9GB',
    description: 'Microsoft reasoning model. Great quality, moderate speed.',
    recommended: true
  },
  {
    name: 'deepseek-r1:7b',
    size: '4.9GB',
    vramUsage: '~5GB',
    description: 'Transparent reasoning chains. Shows thinking process.',
    recommended: true
  },
  {
    name: 'llama3.2:8b',
    size: '5.2GB',
    vramUsage: '~6GB',
    description: 'Balanced performance and quality. Good all-rounder.',
    recommended: false
  },
  {
    name: 'gemma2:9b',
    size: '5.5GB',
    vramUsage: '~6GB',
    description: 'Google model. Fast inference, good for quick tasks.',
    recommended: false
  }
];

class OllamaService {
  private config: OllamaConfig;
  private abortController: AbortController | null = null;

  constructor(config: Partial<OllamaConfig> = {}) {
    this.config = {
      baseUrl: 'http://localhost:11434',
      model: 'qwen2.5:7b', // Default lightweight model
      temperature: 0.7,
      maxTokens: 4096,
      stream: true,
      ...config
    };
  }

  // Check if Ollama is running
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`, {
        timeout: 3000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Get list of available models
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.config.baseUrl}/api/tags`);
      return response.data.models.map((m: any) => m.name);
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  // Pull a model if not present
  async pullModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true })
      });

      if (!response.ok) return false;

      const reader = response.body?.getReader();
      if (!reader) return false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.completed && data.total && onProgress) {
              const progress = (data.completed / data.total) * 100;
              onProgress(progress);
            }
          } catch {}
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to pull model:', error);
      return false;
    }
  }

  // Send a chat message with streaming
  async chat(
    messages: Message[],
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: this.config.stream,
          options: {
            temperature: this.config.temperature,
            num_predict: this.config.maxTokens
          }
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              const chunk = data.message.content;
              fullResponse += chunk;
              if (onChunk) onChunk(chunk);
            }
          } catch (e) {
            console.error('Failed to parse chunk:', e);
          }
        }
      }

      if (onComplete) onComplete(fullResponse);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Chat error:', error);
        throw error;
      }
    }
  }

  // Non-streaming chat for simple use cases
  async chatSync(messages: Message[]): Promise<string> {
    try {
      const response = await axios.post(`${this.config.baseUrl}/api/chat`, {
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      });

      return response.data.message.content;
    } catch (error) {
      console.error('Chat sync error:', error);
      throw error;
    }
  }

  // Cancel ongoing request
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // Update model
  setModel(modelName: string) {
    this.config.model = modelName;
  }

  // Get current model
  getModel(): string {
    return this.config.model;
  }

  // Update config
  updateConfig(config: Partial<OllamaConfig>) {
    this.config = { ...this.config, ...config };
  }
}

export default OllamaService;

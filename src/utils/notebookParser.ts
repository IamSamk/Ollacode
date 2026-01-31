/**
 * Notebook Parser Utility
 * Parses .ipynb files and extracts content in a readable format
 */

export interface NotebookCell {
  cellType: 'markdown' | 'code';
  source: string;
  outputs?: string;
  language?: string;
}

export interface ParsedNotebook {
  cells: NotebookCell[];
  metadata: {
    kernelspec?: any;
    language?: string;
  };
  cellCount: number;
}

export function parseNotebook(jsonContent: string): ParsedNotebook | null {
  try {
    const notebook = JSON.parse(jsonContent);
    
    if (!notebook.cells || !Array.isArray(notebook.cells)) {
      return null;
    }

    const cells: NotebookCell[] = notebook.cells.map((cell: any) => {
      // Get cell source (can be string or array of strings)
      let source = '';
      if (Array.isArray(cell.source)) {
        source = cell.source.join('');
      } else if (typeof cell.source === 'string') {
        source = cell.source;
      }

      // Get cell outputs for code cells
      let outputs = '';
      if (cell.cell_type === 'code' && cell.outputs && Array.isArray(cell.outputs)) {
        outputs = cell.outputs
          .map((output: any) => {
            if (output.text) {
              return Array.isArray(output.text) ? output.text.join('') : output.text;
            }
            if (output.data && output.data['text/plain']) {
              const data = output.data['text/plain'];
              return Array.isArray(data) ? data.join('') : data;
            }
            return '';
          })
          .filter((text: string) => text.length > 0)
          .join('\n');
      }

      return {
        cellType: cell.cell_type === 'markdown' ? 'markdown' : 'code',
        source: source.trim(),
        outputs: outputs.trim(),
        language: notebook.metadata?.language_info?.name || 'python'
      };
    });

    return {
      cells: cells.filter(cell => cell.source.length > 0), // Remove empty cells
      metadata: {
        kernelspec: notebook.metadata?.kernelspec,
        language: notebook.metadata?.language_info?.name || 'python'
      },
      cellCount: cells.length
    };
  } catch (error) {
    console.error('Error parsing notebook:', error);
    return null;
  }
}

export function formatNotebookForChat(parsed: ParsedNotebook, filename: string): string {
  let formatted = `📓 **Notebook: ${filename}**\n`;
  formatted += `Language: ${parsed.metadata.language || 'Python'}\n`;
  formatted += `Cells: ${parsed.cellCount}\n\n`;
  formatted += `---\n\n`;

  parsed.cells.forEach((cell, index) => {
    if (cell.cellType === 'markdown') {
      formatted += `### Cell ${index + 1} (Markdown)\n\n`;
      formatted += `${cell.source}\n\n`;
    } else {
      formatted += `### Cell ${index + 1} (Code - ${cell.language})\n\n`;
      formatted += `\`\`\`${cell.language}\n${cell.source}\n\`\`\`\n\n`;
      
      if (cell.outputs) {
        formatted += `**Output:**\n\`\`\`\n${cell.outputs}\n\`\`\`\n\n`;
      }
    }
    
    formatted += `---\n\n`;
  });

  return formatted;
}

export function summarizeNotebook(parsed: ParsedNotebook): string {
  const codeCount = parsed.cells.filter(c => c.cellType === 'code').length;
  const markdownCount = parsed.cells.filter(c => c.cellType === 'markdown').length;
  
  return `This notebook contains ${parsed.cellCount} cells: ${codeCount} code cells and ${markdownCount} markdown cells. Language: ${parsed.metadata.language || 'Python'}.`;
}

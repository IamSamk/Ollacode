import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Plus, X, Settings } from 'lucide-react';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

interface TerminalTab {
  id: string;
  name: string;
  terminal: XTerm;
  fitAddon: FitAddon;
}

export const Terminal: React.FC = () => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const [terminals, setTerminals] = useState<TerminalTab[]>([]);
  const [activeTerminalIndex, setActiveTerminalIndex] = useState<number>(-1);

  const createNewTerminal = async () => {
    const terminal = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#cccccc',
        selectionBackground: '#ffffff40',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      rows: 24,
      cols: 80
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    const terminalId = `terminal-${Date.now()}`;
    const newTerminal: TerminalTab = {
      id: terminalId,
      name: `Terminal ${terminals.length + 1}`,
      terminal,
      fitAddon
    };

    // Welcome message for now - shell integration will be added later
    terminal.write('Welcome to Ollacode Terminal\r\n');
    terminal.write('Shell integration coming soon...\r\n');
    terminal.write('$ ');

    // Handle terminal input (basic echo for now)
    terminal.onData((data) => {
      if (data === '\r') {
        terminal.write('\r\n$ ');
      } else if (data === '\u007F') { // Backspace
        terminal.write('\b \b');
      } else {
        terminal.write(data);
      }
    });

    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalIndex(terminals.length);

    return newTerminal;
  };

  const closeTerminal = (index: number) => {
    const terminalToClose = terminals[index];
    terminalToClose.terminal.dispose();

    const newTerminals = terminals.filter((_, i) => i !== index);
    setTerminals(newTerminals);
    
    if (activeTerminalIndex === index) {
      setActiveTerminalIndex(Math.max(0, index - 1));
    } else if (activeTerminalIndex > index) {
      setActiveTerminalIndex(activeTerminalIndex - 1);
    }
    
    if (newTerminals.length === 0) {
      setActiveTerminalIndex(-1);
    }
  };

  useEffect(() => {
    if (terminals.length === 0) {
      createNewTerminal();
    }
  }, []);

  useEffect(() => {
    const activeTerminal = terminals[activeTerminalIndex];
    if (activeTerminal && terminalContainerRef.current) {
      // Clear the container
      terminalContainerRef.current.innerHTML = '';
      
      // Mount the active terminal
      activeTerminal.terminal.open(terminalContainerRef.current);
      activeTerminal.fitAddon.fit();
      activeTerminal.terminal.focus();
    }
  }, [activeTerminalIndex, terminals]);

  useEffect(() => {
    const handleResize = () => {
      const activeTerminal = terminals[activeTerminalIndex];
      if (activeTerminal) {
        activeTerminal.fitAddon.fit();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTerminalIndex, terminals]);

  return (
    <div className="terminal-component">
      <div className="terminal-header">
        <div className="terminal-tabs">
          {terminals.map((terminal, index) => (
            <div
              key={terminal.id}
              className={`terminal-tab ${index === activeTerminalIndex ? 'active' : ''}`}
              onClick={() => setActiveTerminalIndex(index)}
            >
              <span className="terminal-tab-name">{terminal.name}</span>
              <button
                className="terminal-close-button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(index);
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="terminal-actions">
          <button
            className="terminal-action-button"
            onClick={createNewTerminal}
            title="New Terminal"
          >
            <Plus size={16} />
          </button>
          <button
            className="terminal-action-button"
            title="Terminal Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      <div 
        ref={terminalContainerRef} 
        className="terminal-container"
      />
    </div>
  );
};

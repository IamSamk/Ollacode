import React, { useState } from 'react';
import { Sidebar } from '../Sidebar/Sidebar';
import { EditorArea } from '../Editor/EditorArea';
import { Terminal } from '../Terminal/Terminal';
import { ChatArea } from '../ChatArea/ChatArea';
import { StatusBar } from '../StatusBar/StatusBar';
import './MainLayout.css';

export const MainLayout: React.FC = () => {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [terminalWidth, setTerminalWidth] = useState(400);
  const [chatHeight, setChatHeight] = useState(250);
  const [isTerminalVisible, setIsTerminalVisible] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (filePath: string) => {
    setSelectedFile(filePath);
    // TODO: Load file content into editor
  };

  return (
    <div className="main-layout">
      <div className="layout-container">
        <Sidebar 
          width={sidebarWidth} 
          onFileSelect={handleFileSelect}
        />
        <div className="center-content">
          <div className="editor-terminal-container">
            <div className="editor-container" style={{ 
              width: isTerminalVisible ? `calc(100% - ${terminalWidth}px)` : '100%' 
            }}>
              <EditorArea selectedFile={selectedFile} />
            </div>
            {isTerminalVisible && (
              <div className="terminal-container" style={{ width: terminalWidth }}>
                <Terminal />
              </div>
            )}
          </div>
          {isChatVisible && (
            <div className="chat-container" style={{ height: chatHeight }}>
              <ChatArea />
            </div>
          )}
        </div>
      </div>
      <StatusBar 
        onToggleTerminal={() => setIsTerminalVisible(!isTerminalVisible)}
        onToggleChat={() => setIsChatVisible(!isChatVisible)}
        isTerminalVisible={isTerminalVisible}
        isChatVisible={isChatVisible}
      />
    </div>
  );
};

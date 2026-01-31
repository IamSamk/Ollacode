import { useState } from 'react';
import ChatInterface from './components/chat/ChatInterface';
import './App.css';

function App() {
  const [sessionId] = useState(() => `session-${Date.now()}`);

  return (
    <div className="app">
      <ChatInterface sessionId={sessionId} />
    </div>
  );
}

export default App;

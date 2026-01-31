# Ollacode Features Reference

## ✅ What's Fixed/Implemented

### 1. **Dynamic Model Selector** ✅
- **Location**: Top of chat interface
- **Features**: 
  - Dropdown shows YOUR actual installed Ollama models
  - Auto-loads on startup
  - Switch models on the fly without restarting
  - If no models found, shows "Loading models..."

**How to use:**
1. Click the dropdown at the top
2. Select any model you have installed
3. Start chatting immediately

### 2. **Visual Web Search Results** ✅ (Perplexity-style)
- **Location**: Appears above chat when search is enabled
- **Features**:
  - Shows "🔍 Searching the web..." indicator
  - Displays source cards with:
    - Numbered badges (1, 2, 3...)
    - Title (clickable)
    - Snippet preview
    - Domain name
  - Sources are clickable - opens in new tab
  - Styled like Perplexity with hover effects

**How to use:**
1. Enable "Web Search" toggle in header
2. Ask a question that triggers search (contains: "search", "latest", "current", "what is", etc.)
3. Watch sources appear before AI response
4. Click any source card to read full article

### 3. **Better Code Blocks** ✅
- **Features**:
  - Language label (highlighted in blue)
  - "Copy Code" button (not just "Copy")
  - Syntax-aware formatting
  - Distinct visual separation from text
  - Hover effects
  - Box shadow for depth

**Supported formats:**
- Inline code: \`code\`
- Code blocks: \`\`\`language\ncode\n\`\`\`
- Bold: \*\*text\*\*
- Italic: \*text\*

### 4. **File Upload** ✅
- **Location**: Paperclip icon in input area
- **Features**:
  - Click to select file
  - Reads content automatically
  - Inserts into message
  - Supports multiple formats

**Supported file types:**
- Text: .txt, .md, .log
- Code: .py, .js, .ts, .tsx, .jsx, .java, .cpp, .c, .h
- Web: .html, .css, .xml
- Data: .json, .csv, .yaml, .yml
- Notebooks: .ipynb (Jupyter Notebooks - parsed and formatted)

**How to use:**
1. Click paperclip icon (📎)
2. Select a file
3. Content appears in input box
4. Add your question and send

## 🎯 How Each Feature Works

### Model Selection
```typescript
// Fetches from YOUR Ollama installation
const models = await ollamaService.listModels();
// Shows in dropdown
// You select → AI uses that model
```

### Web Search Flow
```
1. You ask question
2. If contains search keywords → triggers web search
3. "Searching..." indicator shows
4. Fetches 5 results from web
5. Shows source cards (Perplexity style)
6. AI reads sources
7. AI responds with citations
```

### Code Formatting
```
Normal text flows naturally.

```python
def hello():
    print("This is clearly code")
```

Back to normal text.
```

### File Upload
```
1. Click 📎
2. Select file.py
3. Content appears: "[File: file.py (text/plain)]\n\n<content>"
4. You: "Explain this code"
5. AI: "This code does..."
```

## 📊 Testing Each Feature

### Test 1: Model Selector
1. Look at top of chat
2. See dropdown with your models
3. Click it - see all installed models
4. Select different one
5. Chat with it

### Test 2: Web Search
1. Enable "Web Search" toggle
2. Ask: "Search for latest news about quantum computing"
3. Watch:
   - "Searching..." appears
   - Source cards show up
   - AI responds with context from sources
4. Click a source card → opens article

### Test 3: Code Blocks
1. Ask: "Write a Python hello world"
2. AI responds with:
   ```python
   print("Hello World")
   ```
3. See:
   - Blue "PYTHON" label
   - "Copy Code" button
   - Distinct code styling
4. Click "Copy Code" → copies to clipboard

### Test 4: File Upload
1. Create test.txt with: "Hello this is a test file"
2. Click 📎 in chat
3. Select test.txt
4. See content appear in input
5. Type: "Summarize this"
6. Send → AI reads and summarizes

## 🔍 Where to Look

### Model Dropdown
- **Top left** of chat interface
- Next to "AI Research Assistant" title
- Shows current model name
- Click to change

### Web Search Toggle
- **Top right** of chat interface
- Checkbox with magnifying glass icon
- Check = enabled, Uncheck = disabled

### Search Results
- **In message area** between your message and AI response
- Grid of cards with numbered badges
- Hover to see highlight effect
- Click to open source

### File Upload
- **Bottom left** of input area
- Paperclip icon
- Click to open file picker

### Code Blocks
- **In AI messages**
- Gray boxes with blue language label
- "Copy Code" button top-right of each block

## 🐛 Troubleshooting

### "Loading models..." stuck
- Check: `ollama list` in terminal
- If no models: `ollama pull qwen2.5:7b`
- Restart app

### Web search not showing results
- Check internet connection
- Look for "Searching..." indicator
- Try explicit keywords: "search for..."
- Check console for errors (F12)

### File upload not working
- Make sure file type is supported
- Check file size (max 10,000 chars shown)
- Binary files won't work (only text)

### Code blocks look plain
- Make sure using triple backticks: \`\`\`
- Specify language: \`\`\`python
- Check if AI is actually wrapping code properly

## 📝 Tips

1. **Model Selection**: Start with lighter models for speed
2. **Web Search**: Use for current events, latest info, facts
3. **File Upload**: Great for code review, document analysis
4. **Code Blocks**: Ask for code in specific languages

## 🎨 Visual Changes

### Before (Issues)
- ❌ Hardcoded model name
- ❌ No visual search feedback
- ❌ Plain "Copy" button
- ❌ File upload didn't work

### After (Fixed)
- ✅ Dynamic model dropdown
- ✅ Search sources displayed (Perplexity-style)
- ✅ "Copy Code" button with language labels
- ✅ Working file upload with preview

## 🚀 Next Steps

Try these:
1. **Change model**: Click dropdown, select phi4:14b
2. **Search web**: "Search for latest AI breakthroughs in 2026"
3. **Upload code**: Upload a .py file, ask for review
4. **Test formatting**: Ask "Write hello world in 3 languages"

Everything should work now! The interface is live and hot-reloading. 🎉

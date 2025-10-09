# Crawl4AI Integration Guide 🚀

## ✅ Integration Complete!

Your Crawl4AI testing frontend is now fully integrated with the Python backend.

## 🎯 What's Been Set Up

### 1. **Python Backend** (`crawl_backend.py`)
- Handles actual web crawling using Crawl4AI library
- Supports markdown extraction (more strategies coming)
- Accepts JSON input via stdin
- Returns JSON output via stdout
- Runs in virtual environment for isolation

### 2. **Next.js API Route** (`pages/api/crawl.js`)
- Bridges frontend to Python backend
- Spawns Python process for each request
- Handles input/output communication
- Manages error handling and timeouts

### 3. **Frontend UI** (`pages/index.js`)
- Beautiful interface with shadcn/ui components
- Multiple extraction strategy options
- Real-time results display
- Inter font for modern typography

## 🚀 How to Use

### Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Test a Basic Crawl

1. Enter a URL (e.g., `https://example.com`)
2. Select "Markdown" extraction
3. Click "Start Crawl"
4. View the extracted content!

## 📁 Project Structure

```
crawl4ai_test/
├── venv/                     # Python virtual environment
├── crawl_backend.py          # Python Crawl4AI backend script
├── pages/
│   ├── index.js              # Main UI
│   ├── api/
│   │   └── crawl.js          # API bridge to Python
│   ├── _app.js               # App with Inter font
│   └── _document.js          # Document config
├── components/
│   └── ui/                   # shadcn/ui components
├── styles/
│   └── globals.css           # Global styles
└── package.json              # Node dependencies
```

## 🔧 How It Works

### Request Flow

```
1. User clicks "Start Crawl" in UI
      ↓
2. Frontend sends POST to /api/crawl
      ↓
3. Next.js API spawns Python process
      ↓
4. Python backend runs Crawl4AI
      ↓
5. Results returned as JSON
      ↓
6. Frontend displays extracted content
```

### Backend Communication

**Input (stdin):**
```json
{
  "url": "https://example.com",
  "extractionType": "markdown",
  "jsCode": null,
  "cssSelector": null,
  "llmPrompt": null,
  "headless": true
}
```

**Output (stdout):**
```json
{
  "success": true,
  "content": "# Extracted content...",
  "wordCount": 123,
  "status": "completed"
}
```

## 🎨 Extraction Strategies

### 1. Markdown (✅ Working)
Converts web pages to clean markdown format.

**Use case:** Documentation, articles, blog posts

### 2. CSS Selector (🚧 To implement)
Extract specific elements using CSS selectors.

**Implementation needed:** Add JsonCssExtractionStrategy to backend

### 3. LLM Extraction (🚧 To implement)
AI-powered content extraction with prompts.

**Implementation needed:**
- Add API keys to `.env`
- Configure LLMExtractionStrategy in backend
- Set up LiteLLM provider

## 🔨 Extending the Backend

### Add CSS Extraction

Edit `crawl_backend.py`:

```python
from crawl4ai import JsonCssExtractionStrategy

# In crawl function:
if extraction_type == "css":
    schema = {
        "name": "CSS Extraction",
        "baseSelector": css_selector,
        "fields": [
            {"name": "text", "selector": "", "type": "text"}
        ]
    }
    extraction_strategy = JsonCssExtractionStrategy(schema)
    run_config.extraction_strategy = extraction_strategy
```

### Add LLM Extraction

1. **Install dependencies:**
```bash
source venv/bin/activate
pip install openai  # or other LLM provider
```

2. **Add API keys to `.env`:**
```bash
OPENAI_API_KEY=your_key_here
```

3. **Update backend:**
```python
from crawl4ai import LLMExtractionStrategy, LLMConfig
from pydantic import BaseModel

# Define schema
class ExtractedData(BaseModel):
    title: str
    description: str

# In crawl function:
if extraction_type == "llm":
    llm_config = LLMConfig(
        provider="openai/gpt-4",
        api_token=os.getenv('OPENAI_API_KEY')
    )
    extraction_strategy = LLMExtractionStrategy(
        llm_config=llm_config,
        schema=ExtractedData.schema(),
        extraction_type="schema",
        instruction=llm_prompt
    )
    run_config.extraction_strategy = extraction_strategy
```

## 🐛 Troubleshooting

### Python Backend Not Found

```bash
# Verify virtual environment
ls -la venv/bin/python3

# Reinstall if needed
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -U crawl4ai
crawl4ai-setup
```

### Browser Issues

```bash
# Reinstall browsers
source venv/bin/activate
playwright install chromium
```

### API Timeouts

For long-running crawls, adjust timeout in `pages/api/crawl.js`:

```javascript
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 60, // Increase timeout to 60 seconds
};
```

### Memory Issues

For large pages, increase Node.js memory:

```bash
NODE_OPTIONS='--max-old-space-size=4096' npm run dev
```

## 🚀 Advanced Features

### Custom JavaScript Execution

Test clicking buttons before extraction:

```javascript
(async () => {
  // Click "Show More" button
  const btn = document.querySelector('.load-more');
  if (btn) btn.click();
  
  // Wait for content
  await new Promise(r => setTimeout(r, 2000));
})();
```

### Headless vs Headed Mode

- **Headless (default):** Faster, production-ready
- **Headed:** See browser for debugging

### Browser Configuration

Edit `crawl_backend.py` for more options:

```python
browser_config = BrowserConfig(
    headless=headless,
    verbose=True,  # Show logs
    user_agent="Custom User Agent",
    extra_args=["--disable-blink-features=AutomationControlled"]
)
```

## 📊 Performance Tips

1. **Use headless mode** for faster crawling
2. **Cache results** with CacheMode.ENABLED
3. **Limit concurrent requests** in production
4. **Use connection pooling** for multiple crawls

## 🔒 Security Notes

1. **Validate URLs** before crawling
2. **Sanitize user input** in JS code field
3. **Rate limit API** in production
4. **Use environment variables** for API keys
5. **Don't expose Python errors** to frontend

## 📝 Next Steps

- [ ] Add CSS selector extraction
- [ ] Implement LLM extraction
- [ ] Add crawl history storage
- [ ] Implement configuration presets
- [ ] Add export functionality (JSON, CSV)
- [ ] Real-time progress updates
- [ ] Batch crawling support
- [ ] Error recovery and retries

## 🤝 Contributing

To add new features:

1. Update Python backend (`crawl_backend.py`)
2. Test with: `echo '{"url":"..."}' | python3 crawl_backend.py`
3. Update frontend if UI changes needed
4. Update this guide

## 📚 Resources

- [Crawl4AI Documentation](https://docs.crawl4ai.com)
- [Crawl4AI GitHub](https://github.com/unclecode/crawl4ai)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [shadcn/ui](https://ui.shadcn.com)

---

**Status:** ✅ Fully Integrated & Working

Happy Crawling! 🎉


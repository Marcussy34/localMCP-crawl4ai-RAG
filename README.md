# 🚀 Crawl4AI Testing Environment

A beautiful, modern web interface for testing and exploring [Crawl4AI](https://github.com/unclecode/crawl4ai) features.

![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8?logo=tailwind-css)

## 📋 Overview

This project provides a complete frontend interface for testing Crawl4AI capabilities, including:

- 📝 **Markdown Extraction** - Clean HTML to Markdown conversion
- 🎯 **CSS Selector Extraction** - Precise element extraction
- 🤖 **LLM-Powered Extraction** - AI-powered content extraction
- ⚙️ **Custom JavaScript Execution** - Advanced browser automation
- 🎨 **Modern UI** - Built with shadcn/ui components

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open in Browser
Open [http://localhost:3000](http://localhost:3000) to see the interface.

## ✨ Current Status

### ✅ Completed (Frontend)
- [x] Modern UI with shadcn/ui components
- [x] Multiple extraction strategy options
- [x] Configuration forms and inputs
- [x] Results display with copy functionality
- [x] Mock API endpoint for testing
- [x] Responsive design with dark mode

### ⏳ Pending (Backend Integration)
- [ ] Connect to actual Crawl4AI Python backend
- [ ] Implement real-time streaming
- [ ] Add WebSocket support for long-running crawls
- [ ] Set up proper error handling
- [ ] Add crawl history and presets

## 🎨 Features

### Extraction Strategies

#### 1. Markdown Extraction
- Converts web pages to clean, LLM-friendly markdown
- Perfect for RAG applications and AI agents
- Simple one-click operation

#### 2. CSS Selector Extraction
- Extract specific elements using CSS selectors
- Supports complex selectors
- Precise data extraction for structured content

#### 3. LLM-Powered Extraction
- Natural language extraction prompts
- AI-powered content understanding
- Extract complex structured data

### Advanced Options

- **Headless Mode** - Run browser without UI for faster crawling
- **Custom JavaScript** - Execute JS code before extraction (click buttons, scroll, etc.)
- **Real-time Results** - View extracted content immediately
- **Copy to Clipboard** - Easy content copying

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.4 (Pages Router)
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Language:** JavaScript (JSX)

## 📁 Project Structure

```
crawl4ai_test/
├── pages/
│   ├── index.js              # Main UI interface
│   ├── api/
│   │   └── crawl.js          # API endpoint (mock)
│   ├── _app.js               # Next.js app wrapper
│   └── _document.js          # Document configuration
├── components/
│   └── ui/                   # shadcn/ui components
│       ├── button.jsx
│       ├── input.jsx
│       ├── card.jsx
│       ├── tabs.jsx
│       ├── textarea.jsx
│       ├── select.jsx
│       ├── badge.jsx
│       └── label.jsx
├── lib/
│   └── utils.js              # Utility functions
├── styles/
│   └── globals.css           # Global styles
├── public/                   # Static assets
├── components.json           # shadcn configuration
└── FRONTEND_README.md        # Detailed docs
```

## 🔌 API Integration

### Current Mock API
The frontend currently uses a mock API endpoint at `/api/crawl` that simulates Crawl4AI responses.

### Integration Options

#### Option 1: Python Backend (Recommended)
```bash
# 1. Install Crawl4AI
pip install -U crawl4ai
crawl4ai-setup

# 2. Create FastAPI/Flask server
# 3. Connect to Next.js API routes
```

#### Option 2: Serverless Functions
- Deploy Crawl4AI as serverless functions
- Use Vercel/AWS Lambda with Python runtime

#### Option 3: Direct CLI Integration
- Use Next.js API routes to spawn Python processes
- Execute Crawl4AI CLI commands directly

## 📖 Usage Examples

### Basic Markdown Crawl
1. Enter URL: `https://www.nbcnews.com/business`
2. Select "Markdown" extraction
3. Click "Start Crawl"
4. View results

### CSS Extraction
1. Select "CSS Selector" strategy
2. Go to "Extraction" tab
3. Enter selector: `.article-title, .content`
4. Run crawl

### LLM Extraction
1. Select "LLM Extraction"
2. Add prompt: "Extract all product names and prices"
3. Run crawl

### Custom JavaScript
Go to "Advanced" tab and add:
```javascript
(async () => {
  // Click button to load more content
  document.querySelector('.load-more').click();
  await new Promise(r => setTimeout(r, 2000));
})();
```

## 🎨 Customization

### Adding More Components
```bash
npx shadcn@latest add [component-name]
```

### Available Components
accordion, alert, avatar, checkbox, dialog, dropdown-menu, form, popover, radio-group, scroll-area, separator, sheet, skeleton, slider, switch, table, toast, tooltip, and more!

### Theme Configuration
- Edit `components.json` for theme settings
- Modify `styles/globals.css` for custom styles
- Current theme: New York style with neutral base color

## 📚 Documentation

- **[FRONTEND_README.md](./FRONTEND_README.md)** - Detailed frontend documentation
- **[Crawl4AI Docs](https://docs.crawl4ai.com)** - Official Crawl4AI documentation
- **[shadcn/ui](https://ui.shadcn.com)** - Component documentation

## 🔗 Next Steps

1. **Backend Setup**
   - Install Crawl4AI: `pip install -U crawl4ai`
   - Run setup: `crawl4ai-setup`
   - Verify: `crawl4ai-doctor`

2. **API Bridge**
   - Create Python backend (FastAPI/Flask)
   - Update `/pages/api/crawl.js` with real implementation
   - Add proper error handling and streaming

3. **Enhanced Features**
   - Add crawl history
   - Implement configuration presets
   - Add export functionality (JSON, CSV, etc.)
   - Real-time progress updates

## 🐛 Troubleshooting

### Components Not Rendering
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Styles Not Applying
1. Check `postcss.config.mjs` is configured
2. Verify Tailwind directives in `globals.css`
3. Rebuild the project

### shadcn Components Missing
```bash
# Reinstall specific component
npx shadcn@latest add button
```

## 🤝 About Crawl4AI

Crawl4AI is an open-source LLM-friendly web crawler & scraper that turns the web into clean, LLM-ready Markdown for RAG, agents, and data pipelines.

- **GitHub:** [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai)
- **Stars:** 54.3k+
- **License:** Apache 2.0

## 📄 License

This project is built for testing Crawl4AI. See the main [Crawl4AI repository](https://github.com/unclecode/crawl4ai) for license details.

## 🙏 Credits

- **Crawl4AI** by [@unclecode](https://github.com/unclecode)
- **shadcn/ui** by [@shadcn](https://github.com/shadcn)
- **Next.js** by [Vercel](https://vercel.com)

---

**Status:** ✅ Frontend Complete | ⏳ Backend Integration Ready

Built with ❤️ for the Crawl4AI community

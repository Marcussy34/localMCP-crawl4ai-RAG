import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Code, Settings, PlayCircle, CheckCircle, XCircle, Clock, FileText, Layers, AlertTriangle, Copy, Check } from "lucide-react";

// Inter font is now loaded globally in _app.js

export default function Home() {
  // State management for crawl configuration
  const [url, setUrl] = useState("https://www.nbcnews.com/business");
  const [extractionType, setExtractionType] = useState("markdown");
  const [jsCode, setJsCode] = useState("");
  const [cssSelector, setCssSelector] = useState("");
  const [llmPrompt, setLlmPrompt] = useState("");
  const [headless, setHeadless] = useState(true);
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [crawlStrategy, setCrawlStrategy] = useState("bfs");
  const [maxPages, setMaxPages] = useState(10);
  const [unlimitedPages, setUnlimitedPages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSingle, setCopiedSingle] = useState(false);

  // Handle copy with visual feedback
  const handleCopy = (text, type, index = null) => {
    navigator.clipboard.writeText(text);
    
    if (type === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } else if (type === 'single') {
      setCopiedSingle(true);
      setTimeout(() => setCopiedSingle(false), 2000);
    } else if (type === 'page') {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  // Handle crawl submission
  const handleCrawl = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    // Generate session ID for progress tracking
    const sessionId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let pollInterval = null;

    try {
      // Start polling for progress if deep crawl
      if (deepCrawl) {
        // Set initial progress state
        setProgress({
          crawled: 0,
          total: unlimitedPages ? "unlimited" : maxPages,
          currentUrl: url,
          status: "starting"
        });
        
        pollInterval = setInterval(async () => {
          try {
            const progressRes = await fetch(`/api/crawl-progress?sessionId=${sessionId}`);
            const progressData = await progressRes.json();
            
            if (progressData.status && progressData.status !== 'not_found') {
              setProgress(progressData);
            }
          } catch (err) {
            console.error('Progress polling error:', err);
          }
        }, 1000); // Poll every second
      }

      // Start the actual crawl
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          extractionType,
          jsCode,
          cssSelector,
          llmPrompt,
          headless,
          deepCrawl,
          crawlStrategy,
          maxPages: unlimitedPages ? 0 : maxPages,
          sessionId: deepCrawl ? sessionId : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to crawl");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      // Stop polling
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            🚀 Crawl4AI Testing Interface
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test and explore Crawl4AI features with a beautiful UI
          </p>
        </div>

        {/* Main Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Crawl Configuration
            </CardTitle>
            <CardDescription>
              Configure your web crawling and extraction settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="url" className="text-gray-900 dark:text-gray-100">Target URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            {/* Extraction Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="extraction-type" className="text-gray-900 dark:text-gray-100">Extraction Strategy</Label>
              <Select value={extractionType} onValueChange={setExtractionType}>
                <SelectTrigger id="extraction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">
                    📝 Markdown (Clean HTML to Markdown)
                  </SelectItem>
                  <SelectItem value="css">
                    🎯 CSS Selector (Extract with CSS)
                  </SelectItem>
                  <SelectItem value="llm">
                    🤖 LLM Extraction (AI-powered)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional Configuration Tabs */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                <TabsTrigger 
                  value="basic" 
                  className="text-gray-700 dark:text-gray-400 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-100 data-[state=active]:text-white dark:data-[state=active]:text-gray-900"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Basic
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced" 
                  className="text-gray-700 dark:text-gray-400 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-100 data-[state=active]:text-white dark:data-[state=active]:text-gray-900"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Advanced
                </TabsTrigger>
                <TabsTrigger 
                  value="extraction" 
                  className="text-gray-700 dark:text-gray-400 data-[state=active]:bg-gray-900 dark:data-[state=active]:bg-gray-100 data-[state=active]:text-white dark:data-[state=active]:text-gray-900"
                >
                  Extraction
                </TabsTrigger>
              </TabsList>

              {/* Basic Settings Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="headless"
                    checked={headless}
                    onChange={(e) => setHeadless(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="headless" className="text-gray-900 dark:text-gray-100">Run in Headless Mode</Label>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Headless mode runs the browser without a visible UI, faster for production.
                </p>

                {/* Deep Crawl Option */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="deepCrawl"
                      checked={deepCrawl}
                      onChange={(e) => setDeepCrawl(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="deepCrawl" className="text-gray-900 dark:text-gray-100">Enable Deep Crawl (Entire Site)</Label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Crawl multiple pages recursively instead of just a single page.
                  </p>

                  {/* Deep Crawl Configuration */}
                  {deepCrawl && (
                    <div className="pl-6 space-y-4 border-l-2 border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <Label htmlFor="crawl-strategy" className="text-gray-900 dark:text-gray-100">Crawl Strategy</Label>
                        <Select value={crawlStrategy} onValueChange={setCrawlStrategy}>
                          <SelectTrigger id="crawl-strategy">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bfs">
                              BFS (Breadth-First) - Crawl level by level
                            </SelectItem>
                            <SelectItem value="dfs">
                              DFS (Depth-First) - Follow links deeply first
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="max-pages" className="text-gray-900 dark:text-gray-100">Maximum Pages</Label>
                        <Input
                          id="max-pages"
                          type="number"
                          min="1"
                          max="1000"
                          value={maxPages}
                          onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                          disabled={unlimitedPages}
                          className={unlimitedPages ? "opacity-50" : ""}
                        />
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="unlimited-pages"
                            checked={unlimitedPages}
                            onChange={(e) => setUnlimitedPages(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="unlimited-pages" className="text-sm font-normal text-gray-900 dark:text-gray-100">
                            Unlimited (Crawl entire site)
                          </Label>
                        </div>
                        
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {unlimitedPages 
                            ? "⚠️ Will crawl ALL discoverable pages. May take a very long time!"
                            : "Limit: 1-1000 pages. More pages = longer time."
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Advanced Settings Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="js-code" className="text-gray-900 dark:text-gray-100">Custom JavaScript Code</Label>
                  <Textarea
                    id="js-code"
                    placeholder="(async () => { /* Your custom JS here */ })();"
                    value={jsCode}
                    onChange={(e) => setJsCode(e.target.value)}
                    rows={6}
                    className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Execute custom JavaScript before extraction (e.g., click buttons, scroll, etc.)
                  </p>
                </div>
              </TabsContent>

              {/* Extraction Settings Tab */}
              <TabsContent value="extraction" className="space-y-4 mt-4">
                {/* CSS Selector Extraction */}
                {extractionType === "css" && (
                  <div className="space-y-2">
                    <Label htmlFor="css-selector" className="text-gray-900 dark:text-gray-100">CSS Selector</Label>
                    <Input
                      id="css-selector"
                      placeholder=".article-content, h1, p"
                      value={cssSelector}
                      onChange={(e) => setCssSelector(e.target.value)}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Specify CSS selectors to extract specific elements
                    </p>
                  </div>
                )}

                {/* LLM Extraction */}
                {extractionType === "llm" && (
                  <div className="space-y-2">
                    <Label htmlFor="llm-prompt" className="text-gray-900 dark:text-gray-100">LLM Extraction Prompt</Label>
                    <Textarea
                      id="llm-prompt"
                      placeholder="Extract all product names and prices..."
                      value={llmPrompt}
                      onChange={(e) => setLlmPrompt(e.target.value)}
                      rows={4}
                      className="text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950"
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Describe what you want to extract using natural language
                    </p>
                  </div>
                )}

                {/* Markdown - No additional config needed */}
                {extractionType === "markdown" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Markdown extraction will convert the page to clean, readable markdown format.
                  </p>
                )}
              </TabsContent>
            </Tabs>

            {/* Run Button */}
            {deepCrawl && unlimitedPages && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Unlimited crawl mode:</strong> This will crawl ALL discoverable pages on the site. 
                    This may take several minutes to hours depending on the site size.
                  </span>
                </p>
              </div>
            )}
            
            <Button
              onClick={handleCrawl}
              disabled={loading || !url}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {deepCrawl && unlimitedPages ? "Crawling entire site..." : "Crawling..."}
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {deepCrawl && unlimitedPages ? "Start Unlimited Crawl" : "Start Crawl"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Progress Display */}
        {loading && progress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Crawling in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pages Crawled</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {progress.crawled}
                    {progress.total !== "unlimited" && ` / ${progress.total}`}
                  </p>
                </div>
                {progress.total !== "unlimited" && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Progress</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round((progress.crawled / progress.total) * 100)}%
                    </p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                  <Badge variant="outline" className="text-sm capitalize text-gray-900 dark:text-gray-100">
                    {progress.status || "crawling"}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              {progress.total !== "unlimited" && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((progress.crawled / progress.total) * 100, 100)}%` }}
                  ></div>
                </div>
              )}

              {/* Current URL */}
              {progress.currentUrl && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Current Page</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                    {progress.currentUrl}
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                ⏳ This may take a while. Progress updates as pages are crawled...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {(result || error) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Results</span>
                {result && (
                  <Badge variant="outline" className="font-mono text-gray-900 dark:text-gray-100">
                    {result.success ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        Success
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        Failed
                      </span>
                    )}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Error: {error}
                  </p>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {/* Result Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                      <Badge className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {result.status || "completed"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Type</p>
                      <Badge variant="secondary" className="text-gray-900 dark:text-gray-100">
                        {result.deepCrawl ? (
                          <>
                            <Layers className="w-3 h-3 mr-1" />
                            Deep Crawl
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3 mr-1" />
                            {extractionType}
                          </>
                        )}
                      </Badge>
                    </div>
                    {(result.wordCount || result.totalWords) && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Words</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                          {result.totalWords || result.wordCount}
                        </p>
                      </div>
                    )}
                    {result.timing && (
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Time</p>
                        <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {result.timing}ms
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Deep Crawl - Multiple Pages */}
                  {result.deepCrawl && result.pages ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Crawled Pages ({result.totalPages})
                        </Label>
                        <Badge variant="outline" className="text-gray-900 dark:text-gray-100">
                          {result.totalPages} pages • {result.totalWords} total words
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {result.pages.map((page, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {page.title || `Page ${index + 1}`}
                                  </CardTitle>
                                  <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                                    {page.url}
                                  </CardDescription>
                                </div>
                                <Badge variant="secondary" className="ml-2 text-gray-900 dark:text-gray-100">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {page.wordCount} words
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="relative">
                                <Textarea
                                  value={page.content}
                                  readOnly
                                  rows={6}
                                  className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950"
                                />
                                <Button
                                  size="sm"
                                  className="absolute top-1 right-1"
                                  onClick={() => handleCopy(page.content, 'page', index)}
                                >
                                  {copiedIndex === index ? (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Copied!
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Copy All Button */}
                      <Button
                        className="w-full"
                        onClick={() => {
                          const allContent = result.pages
                            .map((page, i) => `# Page ${i + 1}: ${page.title}\n# URL: ${page.url}\n\n${page.content}`)
                            .join("\n\n---\n\n");
                          handleCopy(allContent, 'all');
                        }}
                      >
                        {copiedAll ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied All Pages!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy All Pages
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    /* Single Page Result */
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Extracted Content
                      </Label>
                      <div className="relative">
                        <Textarea
                          value={
                            typeof result.content === "string"
                              ? result.content
                              : JSON.stringify(result.content, null, 2)
                          }
                          readOnly
                          rows={20}
                          className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950"
                        />
                        <Button
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            const content = typeof result.content === "string"
                              ? result.content
                              : JSON.stringify(result.content, null, 2);
                            handleCopy(content, 'single');
                          }}
                        >
                          {copiedSingle ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Powered by{" "}
            <a
              href="https://github.com/unclecode/crawl4ai"
            target="_blank"
            rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-100"
          >
              Crawl4AI
          </a>
            {" • "}
            Built with Next.js & shadcn/ui
          </p>
        </div>
      </div>
    </div>
  );
}

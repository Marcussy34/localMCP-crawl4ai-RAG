import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Code, Settings, PlayCircle } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle crawl submission
  const handleCrawl = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
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
          maxPages,
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
      setLoading(false);
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
              <Label htmlFor="url">Target URL</Label>
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
              <Label htmlFor="extraction-type">Extraction Strategy</Label>
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
                  <Label htmlFor="headless">Run in Headless Mode</Label>
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
                    <Label htmlFor="deepCrawl">Enable Deep Crawl (Entire Site)</Label>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Crawl multiple pages recursively instead of just a single page.
                  </p>

                  {/* Deep Crawl Configuration */}
                  {deepCrawl && (
                    <div className="pl-6 space-y-4 border-l-2 border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        <Label htmlFor="crawl-strategy">Crawl Strategy</Label>
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
                        <Label htmlFor="max-pages">Maximum Pages</Label>
                        <Input
                          id="max-pages"
                          type="number"
                          min="1"
                          max="100"
                          value={maxPages}
                          onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Limit number of pages to crawl (1-100). More pages = longer time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Advanced Settings Tab */}
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="js-code">Custom JavaScript Code</Label>
                  <Textarea
                    id="js-code"
                    placeholder="(async () => { /* Your custom JS here */ })();"
                    value={jsCode}
                    onChange={(e) => setJsCode(e.target.value)}
                    rows={6}
                    className="font-mono text-sm"
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
                    <Label htmlFor="css-selector">CSS Selector</Label>
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
                    <Label htmlFor="llm-prompt">LLM Extraction Prompt</Label>
                    <Textarea
                      id="llm-prompt"
                      placeholder="Extract all product names and prices..."
                      value={llmPrompt}
                      onChange={(e) => setLlmPrompt(e.target.value)}
                      rows={4}
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
            <Button
              onClick={handleCrawl}
              disabled={loading || !url}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Crawling...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Start Crawl
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        {(result || error) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Results</span>
                {result && (
                  <Badge variant="outline" className="font-mono">
                    {result.success ? "✅ Success" : "❌ Failed"}
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
                      <Badge>{result.status || "completed"}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Type</p>
                      <Badge variant="secondary">
                        {result.deepCrawl ? "Deep Crawl" : extractionType}
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
                        <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{result.timing}ms</p>
                      </div>
                    )}
                  </div>

                  {/* Deep Crawl - Multiple Pages */}
                  {result.deepCrawl && result.pages ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Crawled Pages ({result.totalPages})</Label>
                        <Badge variant="outline">
                          {result.totalPages} pages • {result.totalWords} total words
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {result.pages.map((page, index) => (
                          <Card key={index}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <CardTitle className="text-sm font-medium">
                                    {page.title || `Page ${index + 1}`}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    {page.url}
                                  </CardDescription>
                                </div>
                                <Badge variant="secondary" className="ml-2">
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
                                  className="font-mono text-xs"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-1 right-1"
                                  onClick={() => {
                                    navigator.clipboard.writeText(page.content);
                                  }}
                                >
                                  Copy
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Copy All Button */}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const allContent = result.pages
                            .map((page, i) => `# Page ${i + 1}: ${page.title}\n# URL: ${page.url}\n\n${page.content}`)
                            .join("\n\n---\n\n");
                          navigator.clipboard.writeText(allContent);
                        }}
                      >
                        Copy All Pages
                      </Button>
                    </div>
                  ) : (
                    /* Single Page Result */
                    <div className="space-y-2">
                      <Label>Extracted Content</Label>
                      <div className="relative">
                        <Textarea
                          value={
                            typeof result.content === "string"
                              ? result.content
                              : JSON.stringify(result.content, null, 2)
                          }
                          readOnly
                          rows={20}
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              typeof result.content === "string"
                                ? result.content
                                : JSON.stringify(result.content, null, 2)
                            );
                          }}
                        >
                          Copy
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

import { useState } from "react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Globe, CheckCircle, XCircle, AlertCircle, BookOpen, Database, ArrowRight } from "lucide-react";

export default function AddDocumentation() {
  // State management
  const [url, setUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [maxPages, setMaxPages] = useState(50);
  const [unlimited, setUnlimited] = useState(false);
  const [step, setStep] = useState("input"); // input, crawling, indexing, complete, error
  const [crawlProgress, setCrawlProgress] = useState(null);
  const [crawlResult, setCrawlResult] = useState(null);
  const [indexResult, setIndexResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-generate source name from URL
  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    
    // Auto-generate source name if empty
    if (!sourceName && newUrl) {
      try {
        const urlObj = new URL(newUrl);
        const domain = urlObj.hostname.replace('www.', '').replace('docs.', '');
        const parts = domain.split('.');
        const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        setSourceName(name);
      } catch (e) {
        // Invalid URL, ignore
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setStep("input");
    setUrl("");
    setSourceName("");
    setMaxPages(50);
    setUnlimited(false);
    setCrawlProgress(null);
    setCrawlResult(null);
    setIndexResult(null);
    setError(null);
  };

  // Handle the entire add process
  const handleAddDocumentation = async () => {
    setError(null);
    
    // Validate inputs
    if (!url || !sourceName) {
      setError("Please provide both URL and source name");
      return;
    }

    try {
      // Step 1: Crawl
      setStep("crawling");
      const crawlResponse = await fetch("/api/add-docs-crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          maxPages: unlimited ? 0 : maxPages,
          sourceName,
        }),
      });

      const crawlData = await crawlResponse.json();
      
      if (!crawlResponse.ok) {
        throw new Error(crawlData.error || "Crawling failed");
      }

      setCrawlResult(crawlData);

      // Step 2: Index
      setStep("indexing");
      const indexResponse = await fetch("/api/add-docs-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: crawlData.filename,
          sourceName,
        }),
      });

      const indexData = await indexResponse.json();
      
      if (!indexResponse.ok) {
        throw new Error(indexData.error || "Indexing failed");
      }

      setIndexResult(indexData);
      setStep("complete");

    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  return (
    <>
      <Head>
        <title>Add Documentation - Marcus Local MCP Server</title>
        <meta name="description" content="Add new documentation sources to your MCP server" />
      </Head>
      
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
        <div className="text-center space-y-2">
          <div className="mb-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Home
            </a>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            ➕ Add New Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Crawl and index new documentation sources
          </p>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {/* Step 1: Input */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "input" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" :
                  ["crawling", "indexing", "complete"].includes(step) ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900" :
                  "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}>
                  {["crawling", "indexing", "complete"].includes(step) ? <CheckCircle className="w-4 h-4" /> : "1"}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Configure</span>
              </div>

              <ArrowRight className="w-4 h-4 text-gray-400" />

              {/* Step 2: Crawl */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "crawling" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" :
                  ["indexing", "complete"].includes(step) ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900" :
                  "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}>
                  {step === "crawling" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   ["indexing", "complete"].includes(step) ? <CheckCircle className="w-4 h-4" /> : "2"}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Crawl</span>
              </div>

              <ArrowRight className="w-4 h-4 text-gray-400" />

              {/* Step 3: Index */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "indexing" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" :
                  step === "complete" ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900" :
                  "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}>
                  {step === "indexing" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                   step === "complete" ? <CheckCircle className="w-4 h-4" /> : "3"}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Index</span>
              </div>

              <ArrowRight className="w-4 h-4 text-gray-400" />

              {/* Step 4: Complete */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === "complete" ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900" :
                  "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                }`}>
                  {step === "complete" ? <CheckCircle className="w-4 h-4" /> : "4"}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Done</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Form */}
        {step === "input" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Documentation Details
              </CardTitle>
              <CardDescription>
                Enter the URL and details for the documentation you want to add
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="doc-url" className="text-gray-900 dark:text-gray-100">
                  Documentation URL
                </Label>
                <Input
                  id="doc-url"
                  type="url"
                  placeholder="https://docs.example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  The main URL of the documentation site you want to crawl
                </p>
              </div>

              {/* Source Name */}
              <div className="space-y-2">
                <Label htmlFor="source-name" className="text-gray-900 dark:text-gray-100">
                  Source Name
                </Label>
                <Input
                  id="source-name"
                  type="text"
                  placeholder="e.g., Solana, Polygon, Next.js"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="text-gray-900 dark:text-gray-100"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  A friendly name to identify this documentation source
                </p>
              </div>

              {/* Max Pages */}
              <div className="space-y-2">
                <Label htmlFor="max-pages" className="text-gray-900 dark:text-gray-100">
                  Maximum Pages to Crawl
                </Label>
                <Input
                  id="max-pages"
                  type="number"
                  min="1"
                  max="500"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 50)}
                  disabled={unlimited}
                  className={`text-gray-900 dark:text-gray-100 ${unlimited ? "opacity-50" : ""}`}
                />
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="unlimited"
                    checked={unlimited}
                    onChange={(e) => setUnlimited(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="unlimited" className="text-sm font-normal text-gray-900 dark:text-gray-100">
                    Crawl all pages (unlimited)
                  </Label>
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {unlimited 
                    ? "⚠️ Will crawl the entire site. This may take a long time!"
                    : "Recommended: 50-100 pages for testing, increase for full documentation"
                  }
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleAddDocumentation}
                disabled={!url || !sourceName}
                className="w-full"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Start Crawling & Indexing
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Crawling Progress */}
        {step === "crawling" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Crawling Documentation
              </CardTitle>
              <CardDescription>
                Fetching pages from {url}...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-gray-700 dark:text-gray-300" />
                </div>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  This may take a few minutes depending on the site size...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crawl Results */}
        {step === "indexing" && crawlResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                Crawling Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pages Crawled</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {crawlResult.totalPages}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Words</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {crawlResult.totalWords?.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                  <Badge variant="secondary" className="text-gray-900 dark:text-gray-100">
                    Indexing...
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-8 h-8 animate-spin text-gray-700 dark:text-gray-300" />
              </div>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Creating embeddings and storing in vector database...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Complete */}
        {step === "complete" && crawlResult && indexResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                Successfully Added Documentation!
              </CardTitle>
              <CardDescription>
                {sourceName} has been crawled and indexed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {crawlResult.totalPages}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Chunks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {indexResult.chunksCreated}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Words</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {crawlResult.totalWords?.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Cost</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${indexResult.estimatedCost?.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Total Index Stats */}
              {indexResult.totalStats && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Total Documentation Index:
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <span>{indexResult.totalStats.sources} sources</span>
                    <span>•</span>
                    <span>{indexResult.totalStats.chunks} total chunks</span>
                    <span>•</span>
                    <span>{indexResult.totalStats.words?.toLocaleString()} total words</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.href = '/'}
                  className="flex-1"
                  size="lg"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Search Documentation
                </Button>
                <Button
                  onClick={resetForm}
                  variant="secondary"
                  className="flex-1 bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-300 dark:hover:bg-gray-200 dark:text-gray-900"
                  size="lg"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Source
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {step === "error" && error && (
          <Card>
            <CardContent className="pt-6">
              <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      Failed to Add Documentation
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={resetForm}
                variant="outline"
                className="w-full mt-4"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        {step === "input" && (
          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="py-4">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <AlertCircle className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  Tips for best results
                </h3>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                  <span>Start with 50-100 pages to test</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                  <span>Make sure the URL is the root documentation page</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                  <span>Use a descriptive source name (it will appear in search results)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                  <span>Unlimited crawl works best with well-structured sites</span>
                </li>
              </ul>
              </div>
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
            OpenAI Embeddings + ChromaDB
          </p>
        </div>
      </div>
    </div>
    </>
  );
}


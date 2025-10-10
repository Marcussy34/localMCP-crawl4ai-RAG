import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Search, Info, FileText, ExternalLink, Copy, Check, Database, Layers, Clock, AlertCircle } from "lucide-react";

export default function MCPDocsServer() {
  // State management
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [indexInfo, setIndexInfo] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Load index info on mount
  useEffect(() => {
    loadIndexInfo();
  }, []);

  // Load index information
  const loadIndexInfo = async () => {
    setLoadingInfo(true);
    try {
      const response = await fetch("/api/mcp-info");
      const data = await response.json();
      
      if (response.ok) {
        setIndexInfo(data);
      } else {
        console.error("Failed to load index info:", data.error);
      }
    } catch (err) {
      console.error("Error loading index info:", err);
    } finally {
      setLoadingInfo(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!query.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await fetch("/api/mcp-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
          maxResults: maxResults,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setSearchResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle copy with visual feedback
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handle Enter key in search input
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mb-4">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Crawl4AI Interface
            </a>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            📚 MCP Documentation Server
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Search through indexed documentation with semantic search
          </p>
        </div>

        {/* Index Information Card */}
        {indexInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Index Information
                </span>
                {indexInfo.totalSources > 1 && (
                  <Badge variant="outline" className="text-gray-900 dark:text-gray-100">
                    {indexInfo.totalSources} Sources
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {indexInfo.totalSources > 1 
                  ? "Multiple documentation sources indexed"
                  : "Currently indexed documentation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Pages</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {indexInfo.totalPages}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Chunks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {indexInfo.totalChunks}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Words</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {indexInfo.totalWords?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Multiple Sources List */}
              {indexInfo.sources && indexInfo.sources.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Indexed Sources:
                  </p>
                  <div className="space-y-2">
                    {indexInfo.sources.map((source, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              {source.name}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span>{source.pages} pages</span>
                              <span>•</span>
                              <span>{source.chunks} chunks</span>
                              <span>•</span>
                              <span>{source.words?.toLocaleString()} words</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {source.indexedAt ? new Date(source.indexedAt).toLocaleDateString() : "N/A"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Single Source (Backward Compatibility) */
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Source</p>
                  <a
                    href={indexInfo.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    {indexInfo.source?.replace("https://", "").replace("http://", "").split("/")[0]}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Configuration */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Embedding Model</p>
                    <Badge variant="secondary" className="text-gray-900 dark:text-gray-100">
                      {indexInfo.embeddingModel}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Chunk Size</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {indexInfo.chunkSize} tokens
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {indexInfo.indexedAt ? new Date(indexInfo.indexedAt).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Documentation
            </CardTitle>
            <CardDescription>
              Use natural language to search through the documentation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search-query" className="text-gray-900 dark:text-gray-100">
                Search Query
              </Label>
              <Input
                id="search-query"
                type="text"
                placeholder="e.g., How do I initialize AIR Kit SDK?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ask questions naturally - semantic search will find relevant documentation
              </p>
            </div>

            {/* Max Results */}
            <div className="space-y-2">
              <Label htmlFor="max-results" className="text-gray-900 dark:text-gray-100">
                Maximum Results
              </Label>
              <Input
                id="max-results"
                type="number"
                min="1"
                max="20"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 5)}
                className="text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Number of relevant documentation chunks to return (1-20)
              </p>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Search Documentation
                </>
              )}
            </Button>

            {/* Example Queries */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Example queries:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "How do I set up AIR Kit SDK?",
                  "What is Moca Chain consensus?",
                  "How to issue credentials?",
                  "What are smart accounts?",
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(example)}
                    className="text-xs"
                    disabled={loading}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <p className="text-red-800 dark:text-red-200 font-medium">
                      Error
                    </p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Search Results
                </CardTitle>
                <Badge variant="outline" className="text-gray-900 dark:text-gray-100">
                  {searchResults.results?.length || 0} results found
                </Badge>
              </div>
              <CardDescription>
                Query: "{searchResults.query}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searchResults.results && searchResults.results.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.results.map((result, index) => (
                    <Card key={index} className="bg-gray-50 dark:bg-gray-800/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {result.title}
                              </CardTitle>
                              {result.metadata?.source_name && indexInfo?.totalSources > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {result.metadata.source_name}
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-sm">
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-fit"
                              >
                                {result.url}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            Result {index + 1}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Content Display */}
                          <div className="relative">
                            <Textarea
                              value={result.content}
                              readOnly
                              rows={8}
                              className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 resize-none"
                            />
                            <Button
                              size="sm"
                              variant="secondary"
                              className="absolute top-2 right-2"
                              onClick={() => handleCopy(result.content, index)}
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

                          {/* Metadata */}
                          {result.metadata && (
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                              {result.metadata.wordCount && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {result.metadata.wordCount} words
                                </span>
                              )}
                              {result.relevanceScore && (
                                <span className="flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  Relevance: {(result.relevanceScore * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No results found for your query.</p>
                  <p className="text-sm mt-1">Try rephrasing your search or use different keywords.</p>
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
              href="https://docs.moca.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Moca Network Docs
            </a>
            {" • "}
            MCP Server with OpenAI Embeddings
          </p>
        </div>
      </div>
    </div>
  );
}


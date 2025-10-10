import { useState, useEffect } from "react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Search, Info, FileText, ExternalLink, Copy, Check, Database, Layers, Clock, AlertCircle, Plus, Filter, Trash2, Eye, X, ChevronDown, ChevronRight, ChevronLeft, BookMarked, Sun, Moon } from "lucide-react";

export default function Home() {
  // State management
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [selectedSource, setSelectedSource] = useState("all");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [indexInfo, setIndexInfo] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [sourcePages, setSourcePages] = useState({});
  const [loadingPages, setLoadingPages] = useState({});
  const [expandedPages, setExpandedPages] = useState({});
  const [pageNumbers, setPageNumbers] = useState({});
  const [theme, setTheme] = useState('light');
  const PAGES_PER_PAGE = 10;

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

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
          sourceFilter: selectedSource !== "all" ? selectedSource : null,
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

  // Handle delete source
  const handleDeleteSource = async () => {
    if (!sourceToDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/mcp-delete-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceName: sourceToDelete,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete source");
      }

      // Close dialog and refresh index info
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
      
      // Reset selected source if it was deleted
      if (selectedSource === sourceToDelete) {
        setSelectedSource("all");
      }
      
      // Reload index information
      await loadIndexInfo();
      
      // Show success message briefly
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Open delete confirmation dialog
  const confirmDelete = (sourceName) => {
    setSourceToDelete(sourceName);
    setDeleteDialogOpen(true);
  };

  // Toggle source expansion and load pages if needed
  const toggleSourceExpansion = async (sourceName) => {
    const isExpanded = expandedSources[sourceName];
    
    // Toggle expansion
    setExpandedSources(prev => ({
      ...prev,
      [sourceName]: !isExpanded
    }));

    // If expanding and we don't have pages yet, load them
    if (!isExpanded && !sourcePages[sourceName]) {
      // Reset to page 1 when expanding
      setCurrentPage(sourceName, 1);
      await loadSourcePages(sourceName);
    } else if (!isExpanded) {
      // Reset to page 1 when re-expanding
      setCurrentPage(sourceName, 1);
    }
  };

  // Load pages for a specific source
  const loadSourcePages = async (sourceName) => {
    setLoadingPages(prev => ({ ...prev, [sourceName]: true }));
    
    try {
      const response = await fetch("/api/mcp-source-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceName: sourceName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load pages");
      }

      setSourcePages(prev => ({
        ...prev,
        [sourceName]: data.pages || []
      }));
    } catch (err) {
      console.error(`Error loading pages for ${sourceName}:`, err);
      setError(err.message);
    } finally {
      setLoadingPages(prev => ({ ...prev, [sourceName]: false }));
    }
  };

  // Toggle page expansion
  const togglePageExpansion = (sourceName, pageUrl) => {
    const key = `${sourceName}:${pageUrl}`;
    setExpandedPages(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Get current page number for a source
  const getCurrentPage = (sourceName) => {
    return pageNumbers[sourceName] || 1;
  };

  // Set page number for a source
  const setCurrentPage = (sourceName, pageNum) => {
    setPageNumbers(prev => ({
      ...prev,
      [sourceName]: pageNum
    }));
  };

  // Get paginated pages for a source
  const getPaginatedPages = (sourceName) => {
    const pages = sourcePages[sourceName] || [];
    const currentPage = getCurrentPage(sourceName);
    const startIndex = (currentPage - 1) * PAGES_PER_PAGE;
    const endIndex = startIndex + PAGES_PER_PAGE;
    return {
      pages: pages.slice(startIndex, endIndex),
      totalPages: pages.length,
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, pages.length),
      currentPage,
      totalPaginationPages: Math.ceil(pages.length / PAGES_PER_PAGE)
    };
  };

  return (
    <>
      <Head>
        <title>Marcus's Documentation Server</title>
        <meta name="description" content="Semantic search across indexed documentation sources" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mb-4 flex items-center justify-end">
            <a
              href="/add"
              className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
            >
              <Plus className="w-4 h-4" />
              Add New Docs
            </a>
          </div>
          <div className="flex items-center justify-center gap-3">
            <BookMarked className="w-10 h-10 text-gray-900 dark:text-gray-100" />
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              Marcus's Documentation Server
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Semantic search across indexed documentation sources
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
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        {/* Source Header */}
                        <div 
                          className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => toggleSourceExpansion(source.name)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 w-fit"
                                onClick={(e) => e.stopPropagation()}
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
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {source.indexedAt ? new Date(source.indexedAt).toLocaleDateString() : "N/A"}
                              </Badge>
                              <div className="text-gray-600 dark:text-gray-400">
                                {expandedSources[source.name] ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(source.name);
                                }}
                                title="Delete source"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Pages List */}
                        {expandedSources[source.name] && (
                          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
                            {loadingPages[source.name] ? (
                              <div className="p-4 flex items-center justify-center text-gray-600 dark:text-gray-400">
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Loading pages...
                              </div>
                            ) : sourcePages[source.name] && sourcePages[source.name].length > 0 ? (
                              <>
                                {/* Pagination Info */}
                                {(() => {
                                  const paginationData = getPaginatedPages(source.name);
                                  return (
                                    <>
                                      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs text-gray-600 dark:text-gray-400">
                                            Showing {paginationData.startIndex}-{paginationData.endIndex} of {paginationData.totalPages} pages
                                          </span>
                                          {paginationData.totalPaginationPages > 1 && (
                                            <div className="flex items-center gap-2">
                                              <Button
                                                size="sm"
                                                variant="secondary"
                                                className="h-7 px-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                                                onClick={() => setCurrentPage(source.name, paginationData.currentPage - 1)}
                                                disabled={paginationData.currentPage === 1}
                                              >
                                                <ChevronLeft className="w-3 h-3" />
                                              </Button>
                                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                Page {paginationData.currentPage} of {paginationData.totalPaginationPages}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="secondary"
                                                className="h-7 px-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                                                onClick={() => setCurrentPage(source.name, paginationData.currentPage + 1)}
                                                disabled={paginationData.currentPage === paginationData.totalPaginationPages}
                                              >
                                                <ChevronRight className="w-3 h-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginationData.pages.map((page, pageIdx) => {
                                  const pageKey = `${source.name}:${page.url}`;
                                  const isPageExpanded = expandedPages[pageKey];
                                  
                                  return (
                                    <div key={pageIdx} className="p-3">
                                      {/* Page Header */}
                                      <div 
                                        className="flex items-start justify-between gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded -m-2"
                                        onClick={() => togglePageExpansion(source.name, page.url)}
                                      >
                                        <div className="flex-1 space-y-1">
                                          <div className="flex items-center gap-2">
                                            {isPageExpanded ? (
                                              <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                            ) : (
                                              <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                            )}
                                            <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                              {page.title}
                                            </span>
                                          </div>
                                          <a
                                            href={page.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-5 flex items-center gap-1 w-fit"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {page.url}
                                            <ExternalLink className="w-2 h-2" />
                                          </a>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                          <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600">
                                            {page.chunkCount} chunks
                                          </Badge>
                                          <span className="text-gray-700 dark:text-gray-300 font-medium">{page.totalWords} words</span>
                                        </div>
                                      </div>

                                      {/* Page Chunks (Expanded) */}
                                      {isPageExpanded && (
                                        <div className="mt-2 ml-5 space-y-2">
                                          {page.chunks.map((chunk, chunkIdx) => (
                                            <div 
                                              key={chunkIdx}
                                              className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700"
                                            >
                                              <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                  Chunk {chunk.chunkIndex + 1}
                                                </span>
                                                <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600">
                                                  {chunk.wordCount} words
                                                </Badge>
                                              </div>
                                              <Textarea
                                                value={chunk.content}
                                                readOnly
                                                rows={4}
                                                className="font-mono text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-950 resize-none"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                        })}
                                      </div>
                                    </>
                                  );
                                })()}
                              </>
                            ) : (
                              <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                No pages found
                              </div>
                            )}
                          </div>
                        )}
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

            {/* Source Filter */}
            {indexInfo && indexInfo.sources && indexInfo.sources.length > 1 && (
            <div className="space-y-2">
                <Label htmlFor="source-filter" className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter by Source
                </Label>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger id="source-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">
                      🌐 All Sources ({indexInfo.sources.length})
                  </SelectItem>
                    {indexInfo.sources.map((source, index) => (
                      <SelectItem key={index} value={source.name}>
                        📚 {source.name}
                  </SelectItem>
                    ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                  {selectedSource === "all" 
                    ? "Searching across all documentation sources"
                    : `Only searching in ${selectedSource} documentation`
                  }
                </p>
              </div>
            )}
            
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
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card>
            <CardContent className="pt-6">
              <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5" />
                  <div>
                    <p className="text-gray-900 dark:text-gray-100 font-medium">
                      Error
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
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
                {selectedSource !== "all" && (
                  <span className="ml-2 text-gray-700 dark:text-gray-300">
                    • Filtered by: {selectedSource}
                      </span>
                )}
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

        {/* Delete Confirmation Dialog */}
        {deleteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <AlertCircle className="w-5 h-5" />
                  Confirm Deletion
                </CardTitle>
                <CardDescription>
                  This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    Are you sure you want to delete <strong>{sourceToDelete}</strong>?
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
                    This will remove all {indexInfo?.sources?.find(s => s.name === sourceToDelete)?.chunks} chunks
                    from the search index.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setSourceToDelete(null);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={deleting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteSource}
                    className="flex-1 bg-gray-900 hover:bg-black text-white dark:bg-gray-100 dark:hover:bg-white dark:text-gray-900"
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <p className="flex items-center justify-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span className="font-medium">Marcus's MCP Server</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Powered by
            <a
              href="https://github.com/unclecode/crawl4ai"
            target="_blank"
            rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
          >
              Crawl4AI
                <ExternalLink className="w-3 h-3" />
              </a>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              OpenAI + ChromaDB
            </span>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

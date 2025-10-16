import { useState, useEffect } from "react";
import Head from "next/head";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import ErrorDisplay from "@/components/home/ErrorDisplay";
import DeleteConfirmDialog from "@/components/home/DeleteConfirmDialog";
import SearchCard from "@/components/home/SearchCard";
import SearchResults from "@/components/home/SearchResults";
import IndexInfoCard from "@/components/home/IndexInfoCard";

export default function Home() {
  // State management
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [selectedSource, setSelectedSource] = useState("all");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [indexInfo, setIndexInfo] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [sourcePages, setSourcePages] = useState({});
  const [loadingPages, setLoadingPages] = useState({});
  const [pageNumbers, setPageNumbers] = useState({});

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
    setSuccessMessage(null);

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

      // Store the deleted source name for the success message
      const deletedSource = sourceToDelete;

      // Close dialog and refresh index info
      setDeleteDialogOpen(false);
      setSourceToDelete(null);
      
      // Reset selected source if it was deleted
      if (selectedSource === deletedSource) {
        setSelectedSource("all");
      }
      
      // Reload index information
      await loadIndexInfo();
      
      // Show success message
      setSuccessMessage(`Successfully deleted "${deletedSource}" (${data.chunks_removed || 0} chunks removed)`);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setError(err.message);
      // Keep dialog open on error so user can retry
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

  // Set page number for a source
  const setCurrentPage = (sourceName, pageNum) => {
    setPageNumbers(prev => ({
      ...prev,
      [sourceName]: pageNum
    }));
  };

  return (
    <>
      <Head>
        <title>Marcus Local MCP Server</title>
        <meta name="description" content="Context for AI to retrieve - Semantic search over indexed documentation" />
      </Head>
      
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
          <Header />

          <IndexInfoCard
            indexInfo={indexInfo}
            expandedSources={expandedSources}
            sourcePages={sourcePages}
            loadingPages={loadingPages}
            pageNumbers={pageNumbers}
            onToggleSourceExpansion={toggleSourceExpansion}
            onDeleteSource={confirmDelete}
            onSetCurrentPage={setCurrentPage}
          />

          <SearchCard
            query={query}
            setQuery={setQuery}
            maxResults={maxResults}
            setMaxResults={setMaxResults}
            selectedSource={selectedSource}
            setSelectedSource={setSelectedSource}
            loading={loading}
            handleSearch={handleSearch}
            handleKeyPress={handleKeyPress}
            indexInfo={indexInfo}
          />

          <ErrorDisplay error={error} />

          {/* Success message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
              </div>
            </div>
          )}

          <SearchResults
            searchResults={searchResults}
            selectedSource={selectedSource}
            indexInfo={indexInfo}
          />

          <DeleteConfirmDialog
            isOpen={deleteDialogOpen}
            sourceToDelete={sourceToDelete}
            deleting={deleting}
            chunksCount={indexInfo?.sources?.find(s => s.name === sourceToDelete)?.chunks}
            onConfirm={handleDeleteSource}
            onCancel={() => {
                      setDeleteDialogOpen(false);
                      setSourceToDelete(null);
                      setError(null);
                    }}
          />

          <Footer />
      </div>
    </div>
    </>
  );
}

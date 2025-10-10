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
        <title>Marcus's Documentation Server</title>
        <meta name="description" content="Semantic search across indexed documentation sources" />
        <link rel="icon" href="/favicon.ico" />
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
                    }}
          />

          <Footer />
      </div>
    </div>
    </>
  );
}

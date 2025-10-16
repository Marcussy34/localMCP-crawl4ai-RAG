import { useState } from "react";
import { Database, Clock, ExternalLink, FileText, FolderGit2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SourceItem from "./SourceItem";

export default function IndexInfoCard({ 
  indexInfo, 
  expandedSources,
  sourcePages,
  loadingPages,
  pageNumbers,
  onToggleSourceExpansion,
  onDeleteSource,
  onSetCurrentPage
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");

  if (!indexInfo) return null;

  const getCurrentPage = (sourceName) => {
    return pageNumbers[sourceName] || 1;
  };

  const setCurrentPage = (sourceName, pageNum) => {
    onSetCurrentPage(sourceName, pageNum);
  };

  // Filter sources by category
  const docSources = indexInfo.sources?.filter(s => s.type === 'documentation') || [];
  const repoSources = indexInfo.sources?.filter(s => s.type === 'repository') || [];
  
  // Get filtered sources based on category
  const getFilteredSources = () => {
    if (categoryFilter === 'docs') return docSources;
    if (categoryFilter === 'repos') return repoSources;
    return indexInfo.sources || [];
  };

  const filteredSources = getFilteredSources();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Index Information
          </span>
          <Badge variant="outline" className="text-gray-900 dark:text-gray-100">
            {indexInfo.totalSources} Sources
          </Badge>
        </CardTitle>
        <CardDescription>
          {docSources.length > 0 && repoSources.length > 0
            ? `${docSources.length} docs, ${repoSources.length} repositories`
            : indexInfo.totalSources > 1 
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

        {/* Multiple Sources List with Category Tabs */}
        {indexInfo.sources && indexInfo.sources.length > 0 ? (
          <div className="space-y-3">
            {/* Category Filter Tabs */}
            <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-200 dark:bg-gray-700 p-1">
                <TabsTrigger 
                  value="all" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100 text-gray-700 dark:text-gray-300"
                >
                  <Database className="w-4 h-4" />
                  All ({indexInfo.sources.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="docs" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100 text-gray-700 dark:text-gray-300"
                >
                  <FileText className="w-4 h-4" />
                  Docs ({docSources.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="repos" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-900 dark:data-[state=active]:text-gray-100 text-gray-700 dark:text-gray-300"
                >
                  <FolderGit2 className="w-4 h-4" />
                  Repos ({repoSources.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filtered Sources List */}
            <div className="space-y-2">
              {filteredSources.length > 0 ? (
                filteredSources.map((source, index) => (
                  <SourceItem
                    key={index}
                    source={source}
                    onDelete={onDeleteSource}
                    onToggleExpansion={() => onToggleSourceExpansion(source.name)}
                    isExpanded={expandedSources[source.name]}
                    pages={sourcePages[source.name]}
                    loadingPages={loadingPages[source.name]}
                    currentPage={getCurrentPage(source.name)}
                    setCurrentPage={(pageNum) => setCurrentPage(source.name, pageNum)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">
                    {categoryFilter === 'docs' 
                      ? 'No documentation sources yet'
                      : categoryFilter === 'repos'
                      ? 'No repositories indexed yet'
                      : 'No sources indexed yet'}
                  </p>
                </div>
              )}
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
  );
}


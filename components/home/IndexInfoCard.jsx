import { Database, Clock, ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  if (!indexInfo) return null;

  const getCurrentPage = (sourceName) => {
    return pageNumbers[sourceName] || 1;
  };

  const setCurrentPage = (sourceName, pageNum) => {
    onSetCurrentPage(sourceName, pageNum);
  };

  return (
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
  );
}


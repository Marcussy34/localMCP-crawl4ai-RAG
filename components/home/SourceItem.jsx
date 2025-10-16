import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronRight, Trash2, Loader2, ChevronLeft, FileText, FolderGit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageItem from "./PageItem";

export default function SourceItem({ 
  source, 
  onDelete, 
  onToggleExpansion,
  isExpanded,
  pages,
  loadingPages,
  currentPage,
  setCurrentPage
}) {
  const PAGES_PER_PAGE = 10;

  // Get paginated pages
  const getPaginatedPages = () => {
    if (!pages || pages.length === 0) return {
      pages: [],
      totalPages: 0,
      startIndex: 0,
      endIndex: 0,
      currentPage: 1,
      totalPaginationPages: 0
    };

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

  const paginationData = getPaginatedPages();
  const isRepository = source.type === 'repository';

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Source Header */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        onClick={onToggleExpansion}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            {/* Source name with icon and link/path */}
            <div className="flex items-center gap-2">
              {isRepository ? (
                <FolderGit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : (
                <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
              )}
              {isRepository ? (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {source.name}
                  </span>
                  {source.repoPath && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {source.repoPath}
                    </span>
                  )}
                </div>
              ) : (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {source.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            
            {/* Stats - different for repos vs docs */}
            <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span>{source.pages} {isRepository ? 'files' : 'pages'}</span>
              <span>•</span>
              <span>{source.chunks} chunks</span>
              <span>•</span>
              <span>{source.words?.toLocaleString()} {isRepository ? 'lines' : 'words'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Type badge */}
            <Badge 
              variant={isRepository ? "default" : "secondary"} 
              className={`text-xs ${isRepository ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}
            >
              {isRepository ? 'Repository' : 'Docs'}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {source.indexedAt ? new Date(source.indexedAt).toLocaleDateString() : "N/A"}
            </Badge>
            <div className="text-gray-600 dark:text-gray-400">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 transition-all duration-200 hover:scale-110 cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-800"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(source.name);
              }}
              title="Delete source"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable Pages List */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
          {loadingPages ? (
            <div className="p-4 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Loading pages...
            </div>
          ) : pages && pages.length > 0 ? (
            <>
              {/* Pagination Info */}
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
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {paginationData.totalPaginationPages}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === paginationData.totalPaginationPages}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginationData.pages.map((page, pageIdx) => (
                  <PageItem
                    key={pageIdx}
                    page={page}
                    sourceName={source.name}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-gray-600 dark:text-gray-400">
              No pages found
            </div>
          )}
        </div>
      )}
    </div>
  );
}


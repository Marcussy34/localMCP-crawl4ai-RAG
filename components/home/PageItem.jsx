import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function PageItem({ page, sourceName }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-3">
      {/* Page Header */}
      <div 
        className="flex items-start justify-between gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded -m-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {isExpanded ? (
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
      {isExpanded && (
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
}


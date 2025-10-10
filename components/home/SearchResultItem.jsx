import { useState } from "react";
import { ExternalLink, Copy, Check, FileText, Layers } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function SearchResultItem({ result, index, totalSources }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gray-50 dark:bg-gray-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {result.title}
              </CardTitle>
              {result.metadata?.source_name && totalSources > 1 && (
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
              onClick={() => handleCopy(result.content)}
            >
              {copied ? (
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
  );
}


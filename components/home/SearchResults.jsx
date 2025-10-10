import { FileText, Info } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SearchResultItem from "./SearchResultItem";

export default function SearchResults({ searchResults, selectedSource, indexInfo }) {
  if (!searchResults) return null;

  return (
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
              <SearchResultItem
                key={index}
                result={result}
                index={index}
                totalSources={indexInfo?.totalSources || 1}
              />
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
  );
}


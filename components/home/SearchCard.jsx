import { Search, Filter, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SearchCard({
  query,
  setQuery,
  maxResults,
  setMaxResults,
  selectedSource,
  setSelectedSource,
  loading,
  handleSearch,
  handleKeyPress,
  indexInfo
}) {
  return (
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
  );
}


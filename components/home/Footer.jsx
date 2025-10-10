import { Database, ExternalLink, Layers } from "lucide-react";

export default function Footer() {
  return (
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
  );
}


import { Plus, BookMarked } from "lucide-react";

export default function Header() {
  return (
    <div className="text-center space-y-2">
      <div className="mb-4 flex items-center justify-end">
        <a
          href="/add"
          className="inline-flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
        >
          <Plus className="w-4 h-4" />
          Add New Docs
        </a>
      </div>
      <div className="flex items-center justify-center gap-3">
        <BookMarked className="w-10 h-10 text-gray-900 dark:text-gray-100" />
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
          Marcus's Documentation Server
        </h1>
      </div>
      <p className="text-gray-600 dark:text-gray-400">
        Semantic search across indexed documentation sources
      </p>
    </div>
  );
}


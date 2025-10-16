import { useState } from "react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderGit2, CheckCircle, XCircle, AlertCircle, BookOpen, Database } from "lucide-react";

export default function AddRepository() {
  // State management
  const [repoPath, setRepoPath] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [step, setStep] = useState("input"); // input, indexing, complete, error
  const [indexResult, setIndexResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-generate source name from repo path
  const handleRepoPathChange = (newPath) => {
    setRepoPath(newPath);
    
    // Auto-generate source name if empty
    if (!sourceName && newPath) {
      const parts = newPath.split('/');
      const lastPart = parts[parts.length - 1] || parts[parts.length - 2];
      if (lastPart) {
        const name = lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/-/g, ' ');
        setSourceName(name);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setStep("input");
    setRepoPath("");
    setSourceName("");
    setIndexResult(null);
    setError(null);
  };

  // Handle the entire add process
  const handleAddRepository = async () => {
    setError(null);
    
    // Validate inputs
    if (!repoPath || !sourceName) {
      setError("Please provide both repository path and source name");
      return;
    }

    try {
      // Index the repository
      setStep("indexing");
      const indexResponse = await fetch("/api/add-repo-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoPath,
          sourceName,
        }),
      });

      const indexData = await indexResponse.json();
      
      if (!indexResponse.ok) {
        throw new Error(indexData.error || "Indexing failed");
      }

      setIndexResult(indexData);
      setStep("complete");

    } catch (err) {
      setError(err.message);
      setStep("error");
    }
  };

  return (
    <>
      <Head>
        <title>Add Repository - Marcus Local MCP Server</title>
        <meta name="description" content="Index a local GitHub repository for AI agents" />
      </Head>
      
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mb-4">
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← Back to Home
              </a>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              📁 Add Local Repository
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Index a local GitHub repository for semantic search
            </p>
          </div>

          {/* Input Form */}
          {step === "input" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderGit2 className="w-5 h-5" />
                  Repository Details
                </CardTitle>
                <CardDescription>
                  Enter the local path to your repository
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Repository Path Input */}
                <div className="space-y-2">
                  <Label htmlFor="repo-path" className="text-gray-900 dark:text-gray-100">
                    Repository Path
                  </Label>
                  <Input
                    id="repo-path"
                    type="text"
                    placeholder="/Users/username/Projects/my-repo"
                    value={repoPath}
                    onChange={(e) => handleRepoPathChange(e.target.value)}
                    className="text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    The absolute path to your local repository
                  </p>
                </div>

                {/* Source Name */}
                <div className="space-y-2">
                  <Label htmlFor="source-name" className="text-gray-900 dark:text-gray-100">
                    Source Name
                  </Label>
                  <Input
                    id="source-name"
                    type="text"
                    placeholder="e.g., My Frontend, Backend API"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="text-gray-900 dark:text-gray-100"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    A friendly name to identify this repository
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleAddRepository}
                  disabled={!repoPath || !sourceName}
                  className="w-full"
                  size="lg"
                >
                  <FolderGit2 className="mr-2 h-5 w-5" />
                  Start Indexing Repository
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Indexing Progress */}
          {step === "indexing" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Indexing Repository
                </CardTitle>
                <CardDescription>
                  Reading files from {repoPath}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-12 h-12 animate-spin text-gray-700 dark:text-gray-300" />
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Reading and embedding code files...
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Complete */}
          {step === "complete" && indexResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  Successfully Added Repository!
                </CardTitle>
                <CardDescription>
                  {sourceName} has been indexed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Files</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {indexResult.totalFiles}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Chunks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {indexResult.chunksCreated}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Lines</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {indexResult.totalLines?.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Cost</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      ${indexResult.estimatedCost?.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Total Index Stats */}
                {indexResult.totalStats && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Total Index:
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                      <span>{indexResult.totalStats.sources} sources</span>
                      <span>•</span>
                      <span>{indexResult.totalStats.chunks} total chunks</span>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="flex-1"
                    size="lg"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Search Code
                  </Button>
                  <Button
                    onClick={resetForm}
                    variant="secondary"
                    className="flex-1 bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-300 dark:hover:bg-gray-200 dark:text-gray-900"
                    size="lg"
                  >
                    <FolderGit2 className="mr-2 h-4 w-4" />
                    Add Another Repository
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {step === "error" && error && (
            <Card>
              <CardContent className="pt-6">
                <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        Failed to Index Repository
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          {step === "input" && (
            <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="py-4">
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <AlertCircle className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    How it works
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                      <span>Provide the absolute path to your local repository</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                      <span>All text files will be automatically indexed</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                      <span>Binary files and common folders (node_modules, .git, etc.) are skipped</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-gray-500 dark:text-gray-400 mt-0.5">•</span>
                      <span>AI agents can then search and understand your entire codebase</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Powered by OpenAI Embeddings + ChromaDB
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


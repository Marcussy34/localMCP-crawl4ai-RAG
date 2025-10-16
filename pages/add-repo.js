import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderGit2, CheckCircle, XCircle, AlertCircle, BookOpen, Database, ArrowRight } from "lucide-react";

export default function AddRepository() {
  // State management
  const [repoPath, setRepoPath] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [step, setStep] = useState("input"); // input, indexing, complete, error
  const [indexResult, setIndexResult] = useState(null);
  const [error, setError] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const progressEndRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (progressEndRef.current && step === "indexing") {
      progressEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [progressLogs, step]);

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

  // Handle drag and drop for folder
  const handleDrop = (event) => {
    event.preventDefault();
    const items = event.dataTransfer.items;
    
    if (items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            // Show instructions
            alert(
              `📁 Folder detected: "${entry.name}"\n\n` +
              `Due to browser security, please:\n` +
              `1. Right-click the folder in Finder\n` +
              `2. Hold Option (⌥) key\n` +
              `3. Click "Copy as Pathname"\n` +
              `4. Paste into the field above`
            );
            
            // Auto-fill source name
            if (!sourceName) {
              const name = entry.name.charAt(0).toUpperCase() + entry.name.slice(1).replace(/-/g, ' ');
              setSourceName(name);
            }
            break;
          }
        }
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Reset form
  const resetForm = () => {
    setStep("input");
    setRepoPath("");
    setSourceName("");
    setIndexResult(null);
    setError(null);
    setProgressLogs([]);
  };

  // Handle the entire add process with SSE
  const handleAddRepository = async () => {
    setError(null);
    setProgressLogs([]);
    
    // Validate inputs
    if (!repoPath || !sourceName) {
      setError("Please provide both repository path and source name");
      return;
    }

    try {
      // Index the repository with SSE streaming
      setStep("indexing");
      
      const response = await fetch("/api/add-repo-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoPath,
          sourceName,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress' || data.type === 'info' || data.type === 'start') {
              setProgressLogs(prev => [...prev, data.message]);
            } else if (data.type === 'complete') {
              setIndexResult(data.data);
              setStep("complete");
            } else if (data.type === 'error') {
              throw new Error(data.message);
            }
          }
        }
      }

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

          {/* Progress Steps */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                {/* Step 1: Configure */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === "input" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" :
                    ["indexing", "complete"].includes(step) ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900" :
                    "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                  }`}>
                    {["indexing", "complete"].includes(step) ? <CheckCircle className="w-4 h-4" /> : "1"}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Configure</span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-400" />

                {/* Step 2: Index */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === "indexing" ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900" :
                    step === "complete" ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900" :
                    "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                  }`}>
                    {step === "indexing" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     step === "complete" ? <CheckCircle className="w-4 h-4" /> : "2"}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Index</span>
                </div>

                <ArrowRight className="w-4 h-4 text-gray-400" />

                {/* Step 3: Complete */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === "complete" ? "bg-gray-700 text-white dark:bg-gray-300 dark:text-gray-900" :
                    "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                  }`}>
                    {step === "complete" ? <CheckCircle className="w-4 h-4" /> : "3"}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Done</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <div 
                    className="relative"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Input
                      id="repo-path"
                      type="text"
                      placeholder="Drag folder here or paste path: /Users/username/Projects/my-repo"
                      value={repoPath}
                      onChange={(e) => handleRepoPathChange(e.target.value)}
                      className="text-gray-900 dark:text-gray-100 pr-24"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FolderGit2 className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                      💡 How to get your folder path:
                    </p>
                    <ol className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li>Open Finder and find your repository folder</li>
                      <li><strong>Drag the folder</strong> into the field above, OR</li>
                      <li>Right-click folder → Hold <strong>Option (⌥)</strong> → Click "Copy as Pathname" → Paste above</li>
                    </ol>
                  </div>
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
                  {/* Progress Log */}
                  <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs">
                    {progressLogs.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                      </div>
                    ) : (
                      <>
                        {progressLogs.map((log, index) => (
                          <div key={index} className="text-green-400 py-0.5">
                            {log}
                          </div>
                        ))}
                        <div ref={progressEndRef} />
                      </>
                    )}
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                    ⏳ Live progress - This may take several minutes for large repositories...
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


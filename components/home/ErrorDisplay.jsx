import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ErrorDisplay({ error }) {
  if (!error) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-gray-700 dark:text-gray-300 mt-0.5" />
            <div>
              <p className="text-gray-900 dark:text-gray-100 font-medium">
                Error
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


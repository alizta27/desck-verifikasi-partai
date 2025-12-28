import * as React from "react";
import { ReloadIcon } from "@radix-ui/react-icons"; // part of Radix UI icon set

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {/* Spinner */}
      <ReloadIcon className="h-10 w-10 animate-spin text-gray-800" />

      {/* Label */}
      <p className="mt-4 text-gray-600 text-sm font-medium">
        Loading, please wait...
      </p>
    </div>
  );
}
export { LoadingScreen };

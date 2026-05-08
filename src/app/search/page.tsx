import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-700 text-lg">Loading search results...</p>
        </div>
      }
    >
      <SearchClient />
    </Suspense>
  );
}

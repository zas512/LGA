"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const SEARCH_PATH = "/search";
const NAVIGATE_DELAY_MS = 450;

function SearchField() {
  return (
    <div className="relative w-full sm:w-48 md:w-64">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search cases, associates, expenses..."
        aria-label="Search cases, associates, expenses"
        className="pl-9 bg-card border-border text-xs rounded-xl shadow-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
      />
    </div>
  );
}

/**
 * Global search field. Typing navigates to /search?q=… after a short debounce,
 * so results stream in while the user types. The field stays in sync with the
 * URL on the search page (back/forward, result links). When the query matches
 * the current URL it does nothing, so the browser history is not spammed.
 */
function GlobalSearchInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchPage = pathname === SEARCH_PATH;

  // Reflect external URL changes (back/forward, navigating from a result row).
  useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    if (isSearchPage && urlQuery !== query) setQuery(urlQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isSearchPage]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      const currentUrlQuery = searchParams.get("q") ?? "";
      if (trimmed === currentUrlQuery) return;
      const target = trimmed
        ? `${SEARCH_PATH}?q=${encodeURIComponent(trimmed)}`
        : SEARCH_PATH;
      // Replace when already searching (no history spam per keystroke),
      // push when arriving from elsewhere so back returns to the prior page.
      if (isSearchPage) router.replace(target);
      else router.push(target);
    }, NAVIGATE_DELAY_MS);
  };

  return (
    <div className="relative w-full sm:w-48 md:w-64">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search cases, associates, expenses..."
        aria-label="Search cases, associates, expenses"
        autoComplete="off"
        spellCheck={false}
        className="pl-9 bg-card border-border text-xs rounded-xl shadow-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/40"
      />
    </div>
  );
}

export function GlobalSearch() {
  return (
    <Suspense fallback={<SearchField />}>
      <GlobalSearchInner />
    </Suspense>
  );
}

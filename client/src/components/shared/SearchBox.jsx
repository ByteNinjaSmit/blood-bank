import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Text search box that never fires on keystroke.
 * The caller owns a draft value (bound to `value`/`onChange`) and only
 * commits it to the actual filter/query state from `onSearch`, which fires
 * on Enter or on the search button click.
 */
export default function SearchBox({
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  disabled = false,
  className,
  inputClassName,
  autoFocus = false,
}) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      <div className="relative flex-1 group">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 w-3.5 h-3.5 transition-colors pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={cn("pl-8 h-9 text-xs", inputClassName)}
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        disabled={disabled}
        title="Search"
        aria-label="Search"
        className="shrink-0 flex items-center justify-center h-9 w-9 rounded-md border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Search className="w-4 h-4" />
      </button>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

// Simple page-number pager for lists that could otherwise grow unbounded
// and push the whole page down (recent entries, public entries, explore
// grid, friends). Purely client-side — the data is already fetched, this
// just slices what's rendered.
export default function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null;

  return (
    <div className="pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft size={15} />
      </button>
      <span>Page {page} of {pageCount}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pageCount} aria-label="Next page">
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// Small helper so every list does the same clamp-and-slice consistently.
export function paginate(items, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return { pageItems: items.slice(start, start + pageSize), pageCount, safePage };
}

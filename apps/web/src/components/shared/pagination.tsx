export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-5">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="border border-[var(--line-2)] rounded-[8px] px-3 py-[7px] text-xs font-semibold disabled:opacity-40 disabled:cursor-default"
      >
        Previous
      </button>
      <span className="font-mono text-xs text-[var(--stone)]">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="border border-[var(--line-2)] rounded-[8px] px-3 py-[7px] text-xs font-semibold disabled:opacity-40 disabled:cursor-default"
      >
        Next
      </button>
    </div>
  );
}

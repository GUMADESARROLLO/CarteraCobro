interface SkeletonTableProps {
  columns: number;
  rows?: number;
}

export default function SkeletonTable({ columns, rows = 8 }: SkeletonTableProps) {
  return (
    <div className="animate-pulse">
      <div className="mb-4 flex gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 w-40 rounded-lg bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="px-4 py-3">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-600" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r}>
                {Array.from({ length: columns }).map((_, c) => (
                  <td key={c} className="px-4 py-3">
                    <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

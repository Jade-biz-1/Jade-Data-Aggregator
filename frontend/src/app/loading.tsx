export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-4 border-primary-100 dark:border-primary-900"></div>
          <div className="absolute inset-0 w-14 h-14 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

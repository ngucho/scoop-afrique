export default function MediaLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="skeleton h-36 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton aspect-square rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function CommentsLoading() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-24 rounded-lg" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="skeleton h-32 w-full rounded-xl" />
      ))}
    </div>
  )
}

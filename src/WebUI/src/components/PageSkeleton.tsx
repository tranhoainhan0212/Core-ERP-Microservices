function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0f1e]/80 p-4">
      <div className="h-36 animate-pulse rounded-xl bg-white/[0.04]" />
      <div className="mt-4 h-4 w-1/3 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-2 h-5 w-4/5 animate-pulse rounded bg-white/[0.06]" />
      <div className="mt-4 h-4 w-1/2 animate-pulse rounded bg-white/[0.06]" />
    </div>
  );
}

export function HomePageSkeleton() {
  return (
    <div className="pb-10">
      <section className="relative overflow-hidden bg-[#050a18]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="h-7 w-32 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="mt-5 h-14 w-2/3 animate-pulse rounded bg-white/[0.04]" />
          <div className="mt-3 h-5 w-1/2 animate-pulse rounded bg-white/[0.04]" />
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function CartPageSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-white/[0.06]" />
      <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-white/[0.06] bg-[#0a0f1e]/60" />
          ))}
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#0a0f1e]/60 p-6">
          <div className="h-6 w-2/3 animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-5 h-20 animate-pulse rounded bg-white/[0.04]" />
          <div className="mt-5 h-11 animate-pulse rounded-xl bg-white/[0.06]" />
        </div>
      </div>
    </section>
  );
}

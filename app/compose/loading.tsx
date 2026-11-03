export default function ComposeLoading() {
  return (
    <div className="container-shell pb-20 pt-8">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_348px]">
        <div className="space-y-5 rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-card">
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
          <div className="h-16 animate-pulse rounded-xl bg-slate-50" />
          <div className="h-11 animate-pulse rounded-xl bg-slate-50" />
          <div className="h-64 animate-pulse rounded-xl bg-slate-50" />
          <div className="h-24 animate-pulse rounded-xl bg-slate-50" />
        </div>
        <div className="space-y-4">
          <div className="h-72 animate-pulse rounded-[1.5rem] border border-slate-200 bg-white" />
          <div className="h-40 animate-pulse rounded-[1.5rem] border border-slate-200 bg-white" />
        </div>
      </div>
    </div>
  );
}

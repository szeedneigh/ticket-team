export default function KBBrowseLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero Section with Gradient Background - Matches page.tsx */}
      <div className="relative overflow-hidden bg-background border-b border-border/40">
        {/* Dot Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f3463]/10 via-background/50 to-background" />
        
        {/* Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#2cafdd]/20 opacity-20 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto py-20 md:py-32 px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4 flex flex-col items-center">
              {/* Title Skeleton */}
              <div className="h-10 md:h-20 w-3/4 bg-muted/20 rounded-lg backdrop-blur-sm" />
              
              {/* Description Skeleton */}
              <div className="h-6 w-2/3 bg-muted/20 rounded-lg backdrop-blur-sm" />
            </div>
            
            {/* Search Input Skeleton */}
            <div className="pt-4 max-w-2xl mx-auto w-full">
               <div className="h-14 w-full bg-background/50 border border-border/40 rounded-full shadow-sm backdrop-blur-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-12 px-4">
        <div className="flex flex-col gap-8">
          {/* Action Bar & Filter Bar Skeleton */}
          <div className="space-y-6">
             {/* New Article Button Placeholder (Right aligned) */}
             <div className="flex justify-end">
                <div className="h-10 w-32 bg-muted/30 rounded-md" />
             </div>

             {/* Filter Bar */}
             <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-1">
                <div className="flex gap-4 w-full md:w-auto">
                   <div className="h-10 w-40 bg-muted/20 rounded-md border border-border/40" /> {/* Category Filter */}
                   <div className="h-10 w-40 bg-muted/20 rounded-md border border-border/40" /> {/* Sort Filter */}
                </div>
                {/* Stats Text */}
                <div className="h-4 w-24 bg-muted/20 rounded-md" />
             </div>
          </div>
          
          {/* Article Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col p-6 rounded-xl border border-border/40 bg-card/40 space-y-4 h-[280px]">
                {/* Badge */}
                <div className="h-6 w-24 bg-muted/30 rounded-full" />
                
                {/* Title */}
                <div className="space-y-2 flex-grow">
                   <div className="h-6 w-full bg-muted/30 rounded-md" />
                   <div className="h-6 w-3/4 bg-muted/30 rounded-md" />
                </div>
                
                {/* Summary */}
                <div className="space-y-2">
                   <div className="h-4 w-full bg-muted/20 rounded-md" />
                   <div className="h-4 w-5/6 bg-muted/20 rounded-md" />
                </div>
                
                {/* Meta */}
                <div className="pt-4 mt-auto flex items-center justify-between border-t border-border/40">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted/30" />
                      <div className="h-4 w-24 bg-muted/30 rounded-md" />
                   </div>
                   <div className="h-4 w-16 bg-muted/20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

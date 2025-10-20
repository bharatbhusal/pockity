"use client";

import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar />
      <main className="relative flex-1 overflow-y-auto pt-16 lg:ml-64 lg:pt-0">
        {!user && !isLoading ? (
          // Show blurred skeleton when not authenticated
          <div className="container mx-auto p-4 sm:p-6">
            <div className="space-y-6 blur-sm">
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Please sign in to view your dashboard</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="container mx-auto p-4 sm:p-6">{children}</div>
        )}
      </main>
    </div>
  );
}

"use client";

import { ProtectedRoute } from "@/contexts/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto pt-16 lg:ml-64 lg:pt-0">
          <div className="container mx-auto p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

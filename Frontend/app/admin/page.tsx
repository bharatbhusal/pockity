"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Users, Key, TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function AdminDashboardPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await api.admin.getSystemHealth();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  // Remove tierData - not provided by backend
  // const tierData = Object.entries(apiKeyOverview?.apiKeysByTier || {}).map(([name, value]) => ({
  //   name,
  //   value,
  // }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management console</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={health?.userStatistics.total.toLocaleString() || "0"}
          icon={Users}
        />
        <StatCard
          title="Total API Keys"
          value={health?.apiKeyStatistics.total.toLocaleString() || "0"}
          description={`${health?.apiKeyStatistics.active || 0} active`}
          icon={Key}
        />
        <StatCard
          title="Pending Requests"
          value={health?.apiKeyRequestStatistics.pending.toLocaleString() || "0"}
          description={`${health?.apiKeyRequestStatistics.total || 0} total`}
          icon={TrendingUp}
        />
        <StatCard
          title="System Status"
          value={health?.systemHealth.status === "healthy" ? "Healthy" : "Issue"}
          description={`${Math.floor((health?.systemHealth.uptime || 0) / 3600)}h uptime`}
          icon={Activity}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="API Key Status"
          description="Distribution of API key statuses"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={[
                  { name: "Active", value: health?.apiKeyStatistics.active || 0 },
                  { name: "Revoked", value: health?.apiKeyStatistics.revoked || 0 },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {[0, 1].map((index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Request Status"
          description="API key request statuses"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={[
                { status: "Pending", count: health?.apiKeyRequestStatistics.pending || 0 },
                { status: "Approved", count: health?.apiKeyRequestStatistics.approved || 0 },
                { status: "Rejected", count: health?.apiKeyRequestStatistics.rejected || 0 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pending Requests Alert */}
      {health && health.apiKeyRequestStatistics.pending > 0 && (
        <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
          <p className="font-medium">⚠️ {health.apiKeyRequestStatistics.pending} API key request(s) pending review</p>
          <p className="mt-1 text-sm text-muted-foreground">Navigate to Requests to review pending applications</p>
        </div>
      )}
    </div>
  );
}

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
  const { data: health, isLoading: isLoadingHealth } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await api.admin.getSystemHealth();
      return response.data;
    },
  });

  const { data: userAnalytics, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await api.admin.getUserAnalytics();
      return response.data;
    },
  });

  const { data: apiKeyOverview, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["admin", "api-keys"],
    queryFn: async () => {
      const response = await api.admin.getApiKeyOverview();
      return response.data;
    },
  });

  const isLoading = isLoadingHealth || isLoadingUsers || isLoadingKeys;

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

  const tierData = Object.entries(apiKeyOverview?.apiKeysByTier || {}).map(([name, value]) => ({
    name,
    value,
  }));

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
          value={userAnalytics?.totalUsers.toLocaleString() || "0"}
          description={`${userAnalytics?.activeUsers || 0} active`}
          icon={Users}
        />
        <StatCard
          title="Total API Keys"
          value={apiKeyOverview?.totalApiKeys.toLocaleString() || "0"}
          description={`${apiKeyOverview?.activeApiKeys || 0} active`}
          icon={Key}
        />
        <StatCard
          title="Total Requests"
          value={health?.totalRequests.toLocaleString() || "0"}
          description="All time"
          icon={TrendingUp}
        />
        <StatCard
          title="System Status"
          value={health?.status === "healthy" ? "Healthy" : "Issue"}
          description={`${Math.floor((health?.uptime || 0) / 3600)}h uptime`}
          icon={Activity}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="API Keys by Tier"
          description="Distribution of API key tiers"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={tierData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {tierData.map((entry, index) => (
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
          title="User Growth"
          description="New users over time"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart
              data={[
                { month: "Jan", users: 45 },
                { month: "Feb", users: 62 },
                { month: "Mar", users: 78 },
                { month: "Apr", users: 93 },
                { month: "May", users: 112 },
                { month: "Jun", users: 134 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="users"
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Pending Requests Alert */}
      {apiKeyOverview && apiKeyOverview.pendingRequests > 0 && (
        <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
          <p className="font-medium">⚠️ {apiKeyOverview.pendingRequests} API key request(s) pending review</p>
          <p className="mt-1 text-sm text-muted-foreground">Navigate to Requests to review pending applications</p>
        </div>
      )}
    </div>
  );
}

"use client";

import { ChartCard } from "@/components/dashboard/ChartCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Database, Zap, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function UsagePage() {
  const [selectedKeyId, setSelectedKeyId] = useState<string>("all");

  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await api.apiKey.listApiKeys();
      return response.data;
    },
  });

  // Set default selected key
  const activeKeys = apiKeys?.filter((k) => k.isActive && !k.revokedAt) || [];
  const currentKeyId = selectedKeyId;
  const isAllSelected = currentKeyId === "all";

  // Usage tracking not yet implemented in backend
  const isLoading = isLoadingKeys;

  // Mock data for demonstration
  const dailyRequestsData = [
    { date: "Mon", requests: 145 },
    { date: "Tue", requests: 190 },
    { date: "Wed", requests: 223 },
    { date: "Thu", requests: 178 },
    { date: "Fri", requests: 267 },
    { date: "Sat", requests: 134 },
    { date: "Sun", requests: 98 },
  ];

  const monthlyTrendData = [
    { month: "Jan", requests: 2400, storage: 1200 },
    { month: "Feb", requests: 3210, storage: 1800 },
    { month: "Mar", requests: 2890, storage: 2100 },
    { month: "Apr", requests: 4200, storage: 2600 },
    { month: "May", requests: 3800, storage: 3100 },
    { month: "Jun", requests: 4500, storage: 3500 },
  ];

  const storageByTypeData = [
    { name: "Images", value: 45 },
    { name: "Videos", value: 30 },
    { name: "Documents", value: 15 },
    { name: "Other", value: 10 },
  ];

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

  if (!activeKeys.length) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">No Active API Keys</h2>
          <p className="text-muted-foreground">Create an API key to start tracking usage</p>
        </div>
      </div>
    );
  }

  // Usage tracking not yet implemented in backend - using mock data
  const currentKey = !isAllSelected ? activeKeys.find((k) => k.id === currentKeyId) : null;
  const usageStats = { requestsThisMonth: 1250, storageUsed: 512000000 };
  const keyLimits = { requestsPerMonth: 10000, storageLimit: 5368709120 };
  const requestsPercentage = (usageStats.requestsThisMonth / keyLimits.requestsPerMonth) * 100;
  const storagePercentage = (usageStats.storageUsed / keyLimits.storageLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Usage & Analytics</h1>
          <p className="text-muted-foreground">Monitor your API usage and storage</p>
        </div>
        <Select
          value={currentKeyId}
          onValueChange={setSelectedKeyId}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Select API Key" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All API Keys (Overview)</SelectItem>
            {activeKeys.map((key) => (
              <SelectItem
                key={key.id}
                value={key.id}
              >
                {key.name || "Unnamed Key"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={isAllSelected ? "Total API Keys" : "API Key"}
          value={isAllSelected ? activeKeys.length.toString() : currentKey?.name || "N/A"}
          description={isAllSelected ? "Active keys" : "Selected key"}
          icon={TrendingUp}
        />
        <StatCard
          title="Status"
          value={
            isAllSelected
              ? `${activeKeys.length} Active`
              : currentKey?.isActive && !currentKey?.revokedAt
                ? "Active"
                : "Revoked"
          }
          description={
            isAllSelected
              ? "All active keys"
              : currentKey?.lastUsedAt
                ? `Last used: ${new Date(currentKey.lastUsedAt).toLocaleDateString()}`
                : "Never used"
          }
          icon={Zap}
        />
        <StatCard
          title="Created"
          value={
            isAllSelected
              ? new Date(Math.min(...activeKeys.map((k) => new Date(k.createdAt).getTime()))).toLocaleDateString()
              : currentKey
                ? new Date(currentKey.createdAt).toLocaleDateString()
                : "N/A"
          }
          description={isAllSelected ? "Oldest key" : "Key creation date"}
          icon={Database}
        />
        <StatCard
          title="Usage Tracking"
          value="Coming Soon"
          description="Feature in development"
          icon={Clock}
        />
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Analytics</CardTitle>
          <CardDescription>Detailed usage tracking is currently being implemented</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-muted-foreground">
            Usage tracking features (requests, storage, bandwidth) will be available soon.
          </p>
        </CardContent>
      </Card>

      {/* Usage Limits */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Limit (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {usageStats.requestsThisMonth.toLocaleString()} / {keyLimits.requestsPerMonth.toLocaleString()}
              </span>
              <span className="text-muted-foreground">{requestsPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={requestsPercentage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Limit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {(usageStats.storageUsed / 1024 / 1024).toFixed(2)} MB /{" "}
                {(keyLimits.storageLimit / 1024 / 1024).toFixed(0)} MB
              </span>
              <span className="text-muted-foreground">{storagePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={storagePercentage} />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Daily Requests"
          description="Last 7 days"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={dailyRequestsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="requests"
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Storage by Type"
          description="Distribution of stored files"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <PieChart>
              <Pie
                data={storageByTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {storageByTypeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard
        title="Monthly Trend"
        description="Requests and storage over time"
      >
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <LineChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis
              yAxisId="right"
              orientation="right"
            />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="requests"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Requests"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="storage"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Storage (MB)"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

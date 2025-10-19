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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function UsagePage() {
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");

  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await api.apiKey.listApiKeys();
      return response.data;
    },
  });

  // Set default selected key
  const activeKeys = apiKeys?.filter((k) => k.status === "ACTIVE") || [];
  const currentKeyId = selectedKeyId || activeKeys[0]?.id || "";

  const { data: usageStats, isLoading: isLoadingUsage } = useQuery({
    queryKey: ["usage", currentKeyId],
    queryFn: async () => {
      if (!currentKeyId) return null;
      const response = await api.storage.getUsageStats(currentKeyId);
      return response.data;
    },
    enabled: !!currentKeyId,
  });

  const isLoading = isLoadingKeys || isLoadingUsage;

  // Mock data for detailed charts
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

  const currentKey = apiKeys?.find((k) => k.id === currentKeyId);

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

  const requestsPercentage = currentKey ? (usageStats?.requestsThisMonth || 0 / currentKey.requestsPerMonth) * 100 : 0;
  const storagePercentage = currentKey ? ((usageStats?.storageUsed || 0) / currentKey.storageLimit) * 100 : 0;

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
            {activeKeys.map((key) => (
              <SelectItem
                key={key.id}
                value={key.id}
              >
                {key.name} ({key.tier})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={usageStats?.totalRequests.toLocaleString() || "0"}
          description="All time"
          icon={TrendingUp}
        />
        <StatCard
          title="Requests Today"
          value={usageStats?.requestsToday.toLocaleString() || "0"}
          description={`${usageStats?.requestsThisMonth.toLocaleString() || 0} this month`}
          icon={Zap}
        />
        <StatCard
          title="Storage Used"
          value={`${((usageStats?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB`}
          description={`${((currentKey?.storageLimit || 0) / 1024 / 1024).toFixed(0)} MB limit`}
          icon={Database}
        />
        <StatCard
          title="Total Objects"
          value={usageStats?.totalObjects.toLocaleString() || "0"}
          description="Files stored"
          icon={Clock}
        />
      </div>

      {/* Usage Limits */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Limit (Monthly)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                {usageStats?.requestsThisMonth.toLocaleString() || 0} / {currentKey?.requestsPerMonth.toLocaleString()}
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
                {((usageStats?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB /{" "}
                {((currentKey?.storageLimit || 0) / 1024 / 1024).toFixed(0)} MB
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

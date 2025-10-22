"use client";

import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Key } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { isLoading: isLoadingSummary } = useQuery({
    queryKey: ["account", "summary"],
    queryFn: async () => {
      const response = await api.user.getAccountSummary();
      return response.data;
    },
  });

  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await api.apiKey.listApiKeys();
      return response.data;
    },
  });

  const isLoading = isLoadingSummary || isLoadingKeys;

  // Mock data for charts (you can replace with real data)
  const usageData = [
    { date: "Jan", requests: 120 },
    { date: "Feb", requests: 250 },
    { date: "Mar", requests: 180 },
    { date: "Apr", requests: 320 },
    { date: "May", requests: 280 },
    { date: "Jun", requests: 400 },
  ];

  const storageData = [
    { name: "Images", value: 45 },
    { name: "Videos", value: 30 },
    { name: "Documents", value: 25 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
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

  const activeKeys = apiKeys?.filter((key) => key.isActive && !key.revokedAt).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>
        <Button
          asChild
          className="w-full sm:w-auto"
        >
          <Link href="/dashboard/api-keys">Manage API Keys</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active API Keys"
          value={activeKeys}
          description={`${apiKeys?.length || 0} total keys`}
          icon={Key}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Request Usage"
          description="Last 6 months"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Storage Distribution"
          description="By file type"
        >
          <ResponsiveContainer
            width="100%"
            height={300}
          >
            <BarChart data={storageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys?.slice(0, 5).map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <p className="font-medium">{key.name || "Unnamed Key"}</p>
                  <p className="text-sm text-muted-foreground">{key.accessKeyId.slice(0, 20)}...</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={key.isActive && !key.revokedAt ? "default" : "destructive"}>
                    {key.isActive && !key.revokedAt ? "ACTIVE" : "REVOKED"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {(!apiKeys || apiKeys.length === 0) && (
            <p className="text-center text-muted-foreground">No API keys yet. Create your first one!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

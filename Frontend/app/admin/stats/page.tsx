"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Database, Server, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/StatCard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminStatsPage() {
  const { data: health, isLoading: isLoadingHealth } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: async () => {
      const response = await api.admin.getSystemHealth();
      return response.data;
    },
  });

  const { data: auditLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: async () => {
      const response = await api.admin.getAuditLogs({ limit: 50 });
      return response.data;
    },
  });

  const isLoading = isLoadingHealth || isLoadingLogs;

  // Mock performance data
  const performanceData = [
    { time: "00:00", cpu: 45, memory: 62, requests: 120 },
    { time: "04:00", cpu: 38, memory: 58, requests: 95 },
    { time: "08:00", cpu: 68, memory: 72, requests: 280 },
    { time: "12:00", cpu: 75, memory: 78, requests: 420 },
    { time: "16:00", cpu: 82, memory: 85, requests: 510 },
    { time: "20:00", cpu: 65, memory: 70, requests: 340 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-4">
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

  const uptimeHours = Math.floor((health?.systemHealth.uptime || 0) / 3600);
  const uptimeDays = Math.floor(uptimeHours / 24);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">System Statistics</h1>
        <p className="text-muted-foreground">Monitor system health and performance metrics</p>
      </div>

      {/* System Health Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="System Status"
          value={health?.systemHealth.status === "healthy" ? "Healthy" : "Issue"}
          description="Current system state"
          icon={Activity}
        />
        <StatCard
          title="Uptime"
          value={uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`}
          description={`${uptimeHours} hours total`}
          icon={Clock}
        />
        <StatCard
          title="Total Users"
          value={health?.userStatistics.total.toLocaleString() || "0"}
          icon={Database}
        />
        <StatCard
          title="Total API Keys"
          value={health?.apiKeyStatistics.total.toLocaleString() || "0"}
          description={`${health?.apiKeyStatistics.active || 0} active`}
          icon={Server}
        />
      </div>

      {/* Performance Chart */}
      <ChartCard
        title="System Performance"
        description="CPU, Memory, and Request metrics over 24 hours"
      >
        <ResponsiveContainer
          width="100%"
          height={300}
        >
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#8884d8"
              strokeWidth={2}
              name="CPU %"
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke="#82ca9d"
              strokeWidth={2}
              name="Memory %"
            />
            <Line
              type="monotone"
              dataKey="requests"
              stroke="#ffc658"
              strokeWidth={2}
              name="Requests"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Audit Logs</CardTitle>
          <CardDescription>System activity and user actions log</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs && auditLogs.auditLogs.length > 0 ? (
                auditLogs.auditLogs.slice(0, 10).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.actorId ? log.actorId.slice(0, 8) + "..." : "System"}
                    </TableCell>
                    <TableCell className="text-sm">{log.detail || "No details"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center"
                  >
                    No audit logs available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

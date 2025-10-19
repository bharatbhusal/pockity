"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ApiKeyRequest } from "@/types/api";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default function AdminRequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<ApiKeyRequest | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin", "apiKeyRequests"],
    queryFn: async () => {
      const response = await api.admin.getAllApiKeyRequests();
      return response.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, comment }: { id: string; status: "APPROVED" | "REJECTED"; comment?: string }) => {
      return api.admin.reviewApiKeyRequest(id, {
        status,
        reviewComment: comment,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "apiKeyRequests"] });
      setSelectedRequest(null);
      setReviewComment("");
      toast({
        title: variables.status === "APPROVED" ? "Request approved" : "Request rejected",
        description: `The API key request has been ${variables.status.toLowerCase()}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to review request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleReview = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      id: selectedRequest.id,
      status: reviewAction,
      comment: reviewComment || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-32"
            />
          ))}
        </div>
      </div>
    );
  }

  const pendingRequests = requests?.filter((r) => r.status === "PENDING") || [];
  const reviewedRequests = requests?.filter((r) => r.status !== "PENDING") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">API Key Requests</h1>
        <p className="text-muted-foreground">Review and manage API key requests from users</p>
      </div>

      <Tabs
        defaultValue="pending"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed ({reviewedRequests.length})</TabsTrigger>
        </TabsList>

        {/* Pending Requests */}
        <TabsContent
          value="pending"
          className="space-y-4"
        >
          {pendingRequests.length === 0 ? (
            <EmptyState
              title="No pending requests"
              description="All API key requests have been reviewed"
            />
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {request.keyName}
                        </CardTitle>
                        <CardDescription>Requested {new Date(request.createdAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        PENDING
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Request Type</span>
                        <Badge>{request.requestType}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Requested Tier</span>
                        <Badge variant="outline">{request.requestedTier}</Badge>
                      </div>
                      {request.currentTier && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Current Tier</span>
                          <Badge variant="outline">{request.currentTier}</Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Reason:</p>
                      <p className="rounded-lg border p-3 text-sm text-muted-foreground">{request.reason}</p>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setReviewAction("REJECTED");
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setReviewAction("APPROVED");
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reviewed Requests */}
        <TabsContent
          value="reviewed"
          className="space-y-4"
        >
          {reviewedRequests.length === 0 ? (
            <EmptyState
              title="No reviewed requests"
              description="Start reviewing pending requests"
            />
          ) : (
            <div className="grid gap-4">
              {reviewedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {request.keyName}
                        </CardTitle>
                        <CardDescription>
                          Reviewed {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant={request.status === "APPROVED" ? "default" : "destructive"}>
                        {request.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Requested Tier</span>
                        <Badge variant="outline">{request.requestedTier}</Badge>
                      </div>
                    </div>
                    {request.reviewComment && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Review Comment:</p>
                        <p className="rounded-lg border p-3 text-sm text-muted-foreground">{request.reviewComment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === "APPROVED" ? "Approve" : "Reject"} Request</DialogTitle>
            <DialogDescription>Review the API key request for {selectedRequest?.keyName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Comment (Optional)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewComment(e.target.value)}
                placeholder="Add a comment about your decision..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              variant={reviewAction === "APPROVED" ? "default" : "destructive"}
            >
              {reviewMutation.isPending ? "Processing..." : reviewAction === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

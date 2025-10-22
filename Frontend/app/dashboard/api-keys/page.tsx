"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Key, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ApiKeysPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [requestedStorageGB, setRequestedStorageGB] = useState<string>("1");
  const [requestedObjects, setRequestedObjects] = useState<string>("1000");
  const [reason, setReason] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [visibleSecret, setVisibleSecret] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: async () => {
      const response = await api.apiKey.listApiKeys();
      return response.data;
    },
  });

  const { data: requests } = useQuery({
    queryKey: ["apiKeyRequests"],
    queryFn: async () => {
      const response = await api.apiKey.getUserRequests();
      return response.data;
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: api.apiKey.createKeyRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeyRequests"] });
      setShowCreateDialog(false);
      setKeyName("");
      setReason("");
      toast({
        title: "Request submitted",
        description: "Your API key request has been submitted for review.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: api.apiKey.revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
      toast({
        title: "Key revoked",
        description: "The API key has been revoked successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to revoke key. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };
  const toggleSecretVisibility = (keyId: string) => {
    setVisibleSecret((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    });
  };

  const handleCreateRequest = () => {
    if (!keyName.trim() || !reason.trim() || !requestedObjects.trim() || !requestedStorageGB.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createRequestMutation.mutate({
      keyName,
      requestedStorageGB: parseInt(requestedStorageGB),
      requestedObjects: parseInt(requestedObjects),
      reason,
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
              className="h-40"
            />
          ))}
        </div>
      </div>
    );
  }

  const pendingRequests = requests?.filter((r) => r.status === "PENDING") || [];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys and access tokens</p>
        </div>
        <Dialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Request New Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request New API Key</DialogTitle>
              <DialogDescription>
                Submit a request for a new API key. An admin will review your request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="Production API Key"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Storage in GiB</Label>
                <Select
                  value={requestedStorageGB}
                  onValueChange={setRequestedStorageGB}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 GiB</SelectItem>
                    <SelectItem value="5">5 GiB</SelectItem>
                    <SelectItem value="10">10 GiB</SelectItem>
                    <SelectItem value="20">20 GiB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tier">Number of Objects</Label>
                <Select
                  value={requestedObjects}
                  onValueChange={setRequestedObjects}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100 Objects</SelectItem>
                    <SelectItem value="500">500 Objects</SelectItem>
                    <SelectItem value="1000">1000 Objects</SelectItem>
                    <SelectItem value="2000">2000 Objects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe why you need this API key..."
                  value={reason}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequest}
                disabled={createRequestMutation.isPending}
              >
                {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <CardDescription>Waiting for admin approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{request.keyName}</p>
                    {/* <p className="text-sm text-muted-foreground">{request.req} GiB</p> */}
                  </div>
                  <Badge variant="secondary">PENDING</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {!apiKeys || apiKeys.length === 0 ? (
        <EmptyState
          title="No API keys yet"
          description="Request your first API key to get started"
          action={
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Request API Key
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Key className="h-5 w-5" />
                      {key.name || "Unnamed Key"}
                    </CardTitle>
                    <CardDescription>Created {new Date(key.createdAt).toLocaleDateString()}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={key.isActive && !key.revokedAt ? "default" : "destructive"}>
                      {key.isActive && !key.revokedAt ? "ACTIVE" : "REVOKED"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>ACCESS KEY ID</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1 overflow-hidden rounded-md border bg-muted px-3 py-2 font-mono text-xs sm:text-sm">
                      {visibleKeys.has(key.id) ? key.accessKeyId : "******************************"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => toggleKeyVisibility(key.id)}
                        className="flex-1 sm:flex-none"
                      >
                        {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(key.accessKeyId)}
                        className="flex-1 sm:flex-none"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>SECRET HASH</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1 overflow-hidden rounded-md border bg-muted px-3 py-2 font-mono text-xs sm:text-sm">
                      {visibleSecret.has(key.id) ? key.secretHash : "******************************"}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => toggleSecretVisibility(key.id)}
                        className="flex-1 sm:flex-none"
                      >
                        {visibleSecret.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(key.secretHash!)}
                        className="flex-1 sm:flex-none"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-medium">{key.isActive && !key.revokedAt ? "Active" : "Revoked"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Used</p>
                    <p className="text-lg font-medium">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-lg font-medium">{new Date(key.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!!key.revokedAt}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke Key
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently revoke your API key and stop all requests
                          using it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeKeyMutation.mutate(key.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Revoke
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

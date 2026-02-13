"use client";

/**
 * ConversationFeed.tsx
 *
 * Displays active warmup conversations with AI-generated content
 * Shows conversation threads, partner info, and message history
 *
 * @version 2.0.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  Inbox,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCheck,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface RecentConversation {
  id: string;
  partnerEmail: string;
  partnerDomain: string;
  subject: string;
  lastMessage: string;
  messageCount: number;
  status: "active" | "completed" | "scheduled";
  lastActivityAt: string;
  sentiment: "positive" | "neutral";
}

interface ConversationMessage {
  id: string;
  direction: "sent" | "received";
  content: string;
  timestamp: string;
  read: boolean;
  readBehavior?: {
    openTime: number;
    scrollDepth: number;
    markedImportant: boolean;
  };
}

interface ConversationFeedProps {
  conversations: RecentConversation[];
  selectedAccountId?: string | null;
  onLoadMore?: () => void;
  className?: string;
}

// ============================================================================
// Mock Data (for expanded view)
// ============================================================================

function getMockMessages(conversationId: string): ConversationMessage[] {
  // Simulated conversation messages
  const baseTime = Date.now();
  return [
    {
      id: `${conversationId}-1`,
      direction: "sent" as const,
      content: "Hi! I wanted to reach out regarding a potential collaboration opportunity. Our team has been working on some exciting projects that I think could align well with your expertise.",
      timestamp: new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: `${conversationId}-2`,
      direction: "received" as const,
      content: "Thanks for reaching out! I'd be happy to learn more about what you have in mind. Could you share some details about the projects you mentioned?",
      timestamp: new Date(baseTime - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      readBehavior: {
        openTime: 45,
        scrollDepth: 100,
        markedImportant: true,
      },
    },
    {
      id: `${conversationId}-3`,
      direction: "sent" as const,
      content: "Of course! We're developing a new platform for streamlining business communications. I believe your input could be valuable given your background in the industry.",
      timestamp: new Date(baseTime - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: `${conversationId}-4`,
      direction: "received" as const,
      content: "That sounds interesting! Let me check with my team and get back to you by the end of the week. Looking forward to exploring this further.",
      timestamp: new Date(baseTime - 5 * 60 * 60 * 1000).toISOString(),
      read: true,
      readBehavior: {
        openTime: 32,
        scrollDepth: 100,
        markedImportant: false,
      },
    },
  ];
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "completed":
      return "bg-blue-500";
    case "scheduled":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

// ============================================================================
// Components
// ============================================================================

function ConversationItem({
  conversation,
  isExpanded,
  onToggle,
}: {
  conversation: RecentConversation;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const messages = useMemo(
    () => (isExpanded ? getMockMessages(conversation.id) : []),
    [isExpanded, conversation.id]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg overflow-hidden"
    >
      {/* Conversation Header */}
      <div
        className={cn(
          "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
          isExpanded && "bg-muted/30"
        )}
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white font-medium",
              conversation.sentiment === "positive" ? "bg-green-500" : "bg-blue-500"
            )}>
              {conversation.partnerEmail.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{conversation.partnerEmail}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    conversation.status === "active" && "border-green-500 text-green-500",
                    conversation.status === "completed" && "border-blue-500 text-blue-500",
                    conversation.status === "scheduled" && "border-yellow-500 text-yellow-500"
                  )}
                >
                  {conversation.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{conversation.partnerDomain}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(conversation.lastActivityAt)}
              </p>
              <Badge variant="secondary" className="text-xs mt-1">
                {conversation.messageCount} messages
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Subject Line */}
        <div className="mt-3 pl-13">
          <p className="text-sm font-medium">{conversation.subject}</p>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
            {conversation.lastMessage}
          </p>
        </div>
      </div>

      {/* Expanded Messages */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex",
                      message.direction === "sent" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.direction === "sent"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={cn(
                        "flex items-center gap-2 mt-2 text-xs",
                        message.direction === "sent"
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      )}>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(message.timestamp).toLocaleString()}</span>
                        {message.direction === "sent" && message.read && (
                          <CheckCheck className="w-3 h-3 text-blue-400" />
                        )}
                      </div>

                      {/* Read Behavior (for received messages) */}
                      {message.readBehavior && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <Eye className="w-3 h-3" />
                            <span>Read for {message.readBehavior.openTime}s</span>
                          </div>
                          {message.readBehavior.markedImportant && (
                            <Badge variant="outline" className="text-xs">
                              Marked Important
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ConversationFeed({
  conversations,
  selectedAccountId,
  className,
}: ConversationFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      // Status filter
      if (statusFilter !== "all" && conv.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          conv.partnerEmail.toLowerCase().includes(query) ||
          conv.subject.toLowerCase().includes(query) ||
          conv.lastMessage.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [conversations, statusFilter, searchQuery]);

  console.log("[ConversationFeed] Rendering", {
    total: conversations.length,
    filtered: filteredConversations.length,
    expanded: expandedId,
  });

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Warmup Conversations
            </CardTitle>
            <CardDescription className="mt-1">
              AI-generated human-like email exchanges with pool partners
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Conversations</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "No conversations match your filters"
                : "Warmup conversations will appear here once started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isExpanded={expandedId === conversation.id}
                onToggle={() =>
                  setExpandedId(expandedId === conversation.id ? null : conversation.id)
                }
              />
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {filteredConversations.length > 0 && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {filteredConversations.length} of {conversations.length} conversations
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {conversations.filter((c) => c.status === "active").length} active
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                {conversations.filter((c) => c.status === "completed").length} completed
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ConversationFeed;

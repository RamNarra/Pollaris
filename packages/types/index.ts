export type PollOption = {
  id: string;
  label: string;
  order: number;
  voteCount: number;
};

export type Poll = {
  id?: string;
  title: string;
  description: string | null;
  type: "single" | "multi";
  visibility: "public" | "private";
  resultsVisibility: "always" | "after_voting";
  status: "draft" | "open" | "closed";
  shareToken: string;
  creatorId: string;
  creatorName: string;
  endAt: Date | null | { toDate?: () => Date };
  createdAt: Date | null | { toDate?: () => Date };
  updatedAt: Date | null | { toDate?: () => Date };
  totalRespondents: number;
  allowedEmails: string[];
  inviteeIds: string[];
  options: PollOption[];
  tags?: string[];
  reasonEnabled?: boolean;
};

export type Vote = {
  voterId: string;
  selectedOptionIds: string[];
  votedAt: Date | { toDate?: () => Date };
  updatedAt: Date | { toDate?: () => Date };
  reason?: string; // Optional reasoning
};

export type Invitation = {
  inviteeId: string;
  inviteeEmail: string;
  invitedBy: string;
  invitedByName: string;
  invitedAt: Date | { toDate?: () => Date };
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  createdAt: Date | { toDate?: () => Date };
};

export type ConversationMessage = {
  role: "user" | "model" | "system";
  content: string;
};

export type Conversation = {
  id?: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  updatedAt: Date | { toDate?: () => Date };
};

export type AuditLog = {
  id?: string;
  actorId: string;
  actorEmail?: string;
  action: string; // e.g. "create_poll", "publish_poll", "vote_cast"
  targetId: string; // pollId or other entity ID
  timestamp: Date | { toDate?: () => Date };
  metadata?: Record<string, any>;
};

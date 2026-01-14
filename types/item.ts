export type Item = {
  _id: string;
  title: string;
  status: "lost" | "found";
  description?: string;
  location?: string;
  imageUrl?: string;
  createdAt?: string;
  reportedBy?: string; // Firebase UID
  claimed?: boolean; // default false
  claimedBy?: string; // Firebase UID (when approved)
  reporter?: {
    name?: string;
    email?: string;
  };
};

export type Claim = {
  _id: string;
  itemId: string;
  itemTitle: string;
  claimedBy: string; // Firebase UID
  message: string; // proof text
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

export type ItemStage = "available" | "claim_pending" | "claimed";

export type Notification = {
  _id: string;
  userId: string; // Firebase UID
  type: "claim_created" | "claim_approved" | "claim_rejected";
  itemId: string;
  itemTitle: string;
  message: string;
  read: boolean; // default false
  createdAt: string;
};

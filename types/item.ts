export type Item = {
  _id: string;
  title: string;
  status: "lost" | "found";
  description?: string;
  location?: string;
  imageUrl?: string;
  createdAt?: string;
  reporter?: {
    name?: string;
    email?: string;
  };
};

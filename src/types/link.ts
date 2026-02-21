export interface Link {
  id: string;
  url: string;
  title: string;
  tags: string[];
  createdAt: number;
  read: boolean;
  favorited: boolean;
}

export type NewLink = Omit<Link, "id" | "createdAt" | "read" | "favorited">;

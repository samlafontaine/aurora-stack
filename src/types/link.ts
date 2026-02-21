export interface Link {
  id: string;
  url: string;
  title: string;
  tags: string[];
  createdAt: number;
}

export type NewLink = Omit<Link, "id" | "createdAt">;

export type PostStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export interface ArticleItem {
  id: string;
  title: string;
  content: string;
  categoryId?: string | null;
  imageUrl?: string | null;
  status: PostStatus;
  authorId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: { id: string; name: string } | null;
  author?: { id: string; fullName: string } | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegionItem {
  id: string;
  name: string;
}

export interface RegionAdminRow {
  id: string;
  name: string;
  code: string;
  shortCode?: string | null;
  continent?: string;
  villageType?: string;
  childCount: number;
}

export interface RegionAdminList {
  level: string;
  parentId: string | null;
  childLabel: string;
  items: RegionAdminRow[];
}

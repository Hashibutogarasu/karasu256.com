export interface BlogPost {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  category: Category;
  eyecatch: Eyecatch | null;
}

export interface Eyecatch {
  url: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface BlogsResponse {
  contents: BlogPost[];
  totalCount: number;
  offset: number;
  limit: number;
}

export interface UseBlogsOptions {
  limit?: number;
  offset?: number;
  filters?: string;
}

"use client";

import { FC } from "react";
import { BlogCard } from "./BlogCard";
import { useBlogs } from "../hooks/useBlogs";
import { useCircularProgress } from "../hooks/useCircularProgress";

interface BlogListProps {
  limit?: number;
  category?: string;
  className?: string;
}

export const BlogList: FC<BlogListProps> = ({
  limit = 10,
  category,
  className = "",
}) => {
  const { ProgressComponent } = useCircularProgress();
  const { blogs, isLoading, error, totalCount } = useBlogs({
    limit,
    filters: category ? `category[equals]${category}` : undefined,
  });

  if (isLoading) {
    return (
      <>
        <ProgressComponent />
        <div className="w-full py-20"></div>
      </>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-10 text-red-500">
        <p>エラーが発生しました: {error.message}</p>
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="w-full text-center py-10 text-gray-500">
        <p>記事が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <BlogCard
            key={blog.id}
            id={blog.id}
            title={blog.title}
            description={blog.content.substring(0, 100).replace(/<[^>]*>/g, "")}
            category={blog.category || "未分類"}
            publishedAt={blog.publishedAt}
            eyecatch={blog.eyecatch}
          />
        ))}
      </div>

      {totalCount > blogs.length && (
        <div className="mt-8 text-center">
          <a
            href="/blogs"
            className="inline-block px-6 py-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            もっと見る ({blogs.length}/{totalCount})
          </a>
        </div>
      )}
    </div>
  );
};

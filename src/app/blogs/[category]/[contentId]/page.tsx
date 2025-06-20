'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCircularProgress } from '@/hooks/useCircularProgress';
import { useBlog } from '@/hooks/useBlog';
import useCategory from '@/hooks/useCategory';

export default function BlogDetailPage() {
  const params = useParams();
  const categoryParam = params.category as string;
  const contentIdParam = params.contentId as string;
  const [categoryValue, setCategoryValue] = useState<string>(categoryParam || '');
  const [contentIdValue, setContentIdValue] = useState<string>(contentIdParam || '');
  const { ProgressComponent, startLoading, stopLoading } = useCircularProgress(true);
  useEffect(() => {
    setCategoryValue(categoryParam);
    setContentIdValue(contentIdParam);
  }, [categoryParam, contentIdParam]);

  const {
    blog,
    isLoading: blogLoading,
    error: blogError,
  } = useBlog({
    contentId: contentIdValue,
    onLoadStart: startLoading,
    onLoadComplete: stopLoading,
  });

  const { category, isLoading: categoryLoading, error: categoryError } = useCategory(categoryValue);

  const isLoading = blogLoading || categoryLoading;
  const error = blogError || categoryError;

  if (isLoading) {
    return (
      <>
        <ProgressComponent />
        <div className="container mx-auto px-4 py-12">
          <div className="w-full py-20"></div>
        </div>
      </>
    );
  }

  if (error || !blog) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="w-full text-center py-10 text-red-500">
          <p>エラーが発生しました: {error?.message || '記事が見つかりません'}</p>
          <Link href="/blogs" className="mt-4 text-blue-500 hover:underline block">
            一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(blog.publishedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const categoryName = category?.name || categoryValue;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/blogs/${categoryValue}`} className="text-blue-500 hover:underline">
            ← {categoryName}カテゴリーに戻る
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>
        <div className="flex items-center justify-between mb-8 text-gray-600">
          <span>{formattedDate}</span>
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            {typeof blog.category === 'string' ? categoryName : blog.category?.name || '未分類'}
          </span>
        </div>
        {blog.eyecatch && blog.eyecatch.url && (
          <div className="relative w-full h-[400px] mb-8">
            <Image src={blog.eyecatch.url} alt={blog.title} fill className="object-cover rounded-lg" />
          </div>
        )}
        <div
          className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-h4:text-lg prose-p:text-base prose-a:text-blue-600 prose-a:hover:underline prose-img:rounded-lg prose-img:mx-auto prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:p-1 prose-code:rounded prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
      </div>
    </div>
  );
}

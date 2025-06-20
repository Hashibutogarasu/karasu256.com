'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FC } from 'react';
import { Eyecatch } from '@/types/microcms';

interface BlogCardProps {
  id: string;
  title: string;
  category: string | { id: string; name: string } | any;
  description?: string;
  publishedAt: string;
  eyecatch: Eyecatch | null;
  className?: string;
}

export const BlogCard: FC<BlogCardProps> = ({ id, title, category, description, publishedAt, eyecatch, className = '' }) => {
  const formattedDate = new Date(publishedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-800 ${className}`}>
      <Link href={`/blogs/${typeof category === 'string' ? category : category?.id || 'uncategorized'}/${id}`} className="block h-full">
        <div className="relative h-48 w-full">
          {eyecatch ? (
            <Image src={eyecatch.url} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400">No Image</span>
            </div>
          )}
          <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 m-2 text-xs rounded-full">
            {typeof category === 'string' ? category : category?.name || '未分類'}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white line-clamp-2">{title}</h3>

          {description && (
            <div className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3" dangerouslySetInnerHTML={{ __html: description }}></div>
          )}

          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <span>{formattedDate}</span>
            <span className="inline-flex items-center">
              <span className="ml-1">詳細を見る →</span>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

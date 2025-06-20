'use client';

import Link from 'next/link';
import useCategories from '@/hooks/useCategories';

const Footer = () => {
  const { categories, isLoading, error } = useCategories();

  return (
    <footer className="w-full py-8 px-6 border-t border-gray-200">
      <div className="container mx-auto flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold mb-4">カテゴリ</h3>
            {isLoading ? (
              <p>読み込み中...</p>
            ) : error ? (
              <p className="text-red-500">カテゴリの取得に失敗しました</p>
            ) : (
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={`/blogs/${category.id}`} className="text-gray-400 hover:text-white transition-colors">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">リンク</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  ホーム
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-gray-400 hover:text-white transition-colors">
                  ブログ一覧
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} Karasu Lab</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

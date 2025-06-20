import { BlogList } from "@/components/BlogList";

export default function BlogsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">ブログ記事一覧</h1>
      <BlogList className="mt-8" />
    </div>
  );
}

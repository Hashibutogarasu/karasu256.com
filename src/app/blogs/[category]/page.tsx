"use client";

import React, { useEffect } from "react";
import { BlogList } from "@/components/BlogList";
import useCategory from "@/hooks/useCategory";
import { useCircularProgress } from "@/hooks/useCircularProgress";

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export default function CategoryPage(props: CategoryPageProps) {
  const { params } = props;
  const categoryId =
    params instanceof Promise ? React.use(params).category : params.category;
  const { category, isLoading } = useCategory(categoryId);
  const { ProgressComponent, startLoading, stopLoading } =
    useCircularProgress(isLoading);

  useEffect(() => {
    if (isLoading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [isLoading, startLoading, stopLoading]);

  return (
    <div className="container mx-auto px-4 py-12">
      <ProgressComponent />
      {isLoading ? (
        <div className="w-full py-20"></div>
      ) : (
        <h1 className="text-3xl font-bold mb-8 text-center">
          {category?.name}の記事一覧
        </h1>
      )}
      <BlogList className="mt-8" category={category?.id} />
    </div>
  );
}

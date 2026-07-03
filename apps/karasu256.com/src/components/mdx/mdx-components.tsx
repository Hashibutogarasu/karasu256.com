import type { MDXComponents } from 'mdx/types';

/**
 * Component overrides applied to MDX content via `MDXProvider`.
 */
export const termsMdxComponents: MDXComponents = {
  h1: (props) => <h1 className="text-2xl font-bold mt-8 mb-4 first:mt-0" {...props} />,
  h2: (props) => <h2 className="text-xl font-semibold mt-8 mb-3" {...props} />,
  h3: (props) => <h3 className="text-lg font-semibold mt-6 mb-2" {...props} />,
  p: (props) => <p className="leading-7 mb-4 text-foreground" {...props} />,
  ul: (props) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
  ol: (props) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
  li: (props) => <li className="leading-7" {...props} />,
  a: (props) => <a className="underline text-foreground hover:text-gray-600 transition-colors" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  hr: (props) => <hr className="my-8 border-border" {...props} />,
};

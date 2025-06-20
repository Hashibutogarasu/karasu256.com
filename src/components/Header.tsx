import Link from 'next/link';

const Header = () => {
  return (
    <header className="w-full py-4 px-6 flex justify-between items-center border-b border-gray-200">
      <div className="font-bold text-xl">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Karasu Lab
        </Link>
      </div>
      <nav>
        <ul className="flex gap-6">
          <li>
            <Link href="/blogs" className="hover:text-gray-600 transition-colors">
              Blog
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;

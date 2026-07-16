'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import NeumorphicCard from '@/components/NeumorphicCard';
import { Footer } from '@/components/neumorphism';

export default function Home() {
  const [, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const portfolioItems = [
    // { title: "Project 1", description: "Web Development", image: "/project1.jpg" },
    // { title: "Project 2", description: "Mobile App", image: "/project2.jpg" },
    // { title: "Project 3", description: "UI/UX Design", image: "/project3.jpg" },
  ] as { title: string; description: string; image: string }[];

  return (
    <main className="min-h-screen bg-gray-100">
      <section
        className={`relative h-screen flex items-center justify-center px-4 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="text-center">
          <div className="relative w-40 h-40 mx-auto mb-8 rounded-full overflow-hidden shadow-neu-inset">
            <Image src="/icon_64.png" alt="Profile" fill className="object-cover" priority />
          </div>
          <div className="shadow-neu p-8 rounded-2xl">
            <h1 className="text-4xl font-bold mb-4">Hashibutogarasu</h1>
            <p className="text-xl text-gray-600">なんちゃってデベロッパー</p>
          </div>
        </div>
      </section>

      <section className={`py-16 px-8 transition-opacity duration-1000 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-3xl font-bold text-center mb-12 shadow-neu-text">Portfolio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {portfolioItems.map((item, i) => (
            <NeumorphicCard
              key={i}
              className={`p-6 transition-all duration-1000 delay-${i * 200} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            >
              <div className="relative aspect-video mb-4">
                <Image src={item.image} alt={item.title} fill className="object-cover rounded-lg" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </NeumorphicCard>
          ))}
        </div>
      </section>

      <Footer className={`flex-col`}>
        <div className="flex justify-center space-x-6 mb-6">
          <a href="https://github.com/Hashibutogarasu" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a href="https://x.com/Columba_Karasu" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
          </a>
        </div>
        <p className="text-sm text-gray-600 mb-2">© 2024 Hashibutogarasu. All rights reserved.</p>
        <p className="text-sm text-gray-500">Licensed under the MIT License</p>
      </Footer>
    </main>
  );
}

import Link from "next/link";
import { Bell } from 'lucide-react';

const Topbar = () => {
  return (
    <div className="bg-zinc-900 shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <h1 className="text-xl font-bold text-red-600">F1 Predictions</h1>
          <Link href="/notifications" className="flex flex-col items-center">
            <Bell size={24} color='white'/>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
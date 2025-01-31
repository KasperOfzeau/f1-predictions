import Link from "next/link";
import { Home, ChartNoAxesColumn, User } from "lucide-react";

const BottomNav = () => {
return (
    <div className="fixed bottom-0 left-0 w-full bg-zinc-900 shadow-lg flex justify-around py-4">
        <Link href="/" className="flex flex-col items-center">
            <Home size={24} color="white" />
        </Link>
        <Link href="/predictions" className="flex flex-col items-center">
            <ChartNoAxesColumn size={24} color="white" />
        </Link>
        <Link href="/profile" className="flex flex-col items-center">
            <User size={24} color="white" />
        </Link>
    </div>
);
};

export default BottomNav;

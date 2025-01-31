import Topbar from "../components/Topbar";
import BottomNav from "../components/BottomNav";
import "../src/styles/main.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-zinc-800">
        <Topbar />
        <main className="pt-16">{children}</main> {/* Offset for fixed navbar */}
        <BottomNav />
      </body>
    </html>
  );
}

import Header from "./Header";
import { Link } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} Bahamas Association of Compliance Officers
          </div>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="hover:text-baco-primary underline-offset-2 hover:underline cursor-pointer"
            >
              Privacy Notice
            </Link>
            <Link
              href="/terms"
              className="hover:text-baco-primary underline-offset-2 hover:underline cursor-pointer"
            >
              Terms of Use
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
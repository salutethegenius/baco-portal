import Header from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-baco-neutral">
      <Header />
      <main>{children}</main>
    </div>
  );
}

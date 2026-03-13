"use client";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";

export default function BottomNav() {
  const path = usePathname();
  const params = useParams();
  const slug = params?.slug as string;

  // Only show on salon pages
  if (!slug) return null;

  const TABS = [
    { href: `/salon/${slug}/monitor`, label: "Monitor", icon: "📊" },
    { href: `/salon/${slug}/admin`,   label: "Admin",   icon: "🛠️" },
    { href: `/salon/${slug}/book`,    label: "Book",    icon: "📅" },
    { href: `/salon/${slug}/settings`, label: "Settings", icon: "⚙️" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("selectedSalonId");
    localStorage.removeItem("selectedSalonSlug");
    window.location.href = "/";
  };

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav">
        {TABS.map(tab => (
          <Link key={tab.href} href={tab.href} className={`nav-item ${path === tab.href ? "active" : ""}`}>
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        ))}
        <button onClick={handleLogout} className="nav-item" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <span className="icon">🚪</span>
          <span style={{ color: "var(--red)" }}>Logout</span>
        </button>
      </nav>
    </div>
  );
}

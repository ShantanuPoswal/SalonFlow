"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Star, PlusCircle, ArrowRight, Store } from "lucide-react";

interface Salon { _id: string; name: string; slug: string; location?: string; rating?: number; isDemo?: boolean; }

export default function DiscoveryPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salons")
      .then(r => r.json())
      .then(d => {
        setSalons(Array.isArray(d) ? d : []);
        setLoading(false);
      });
  }, []);

  const filtered = salons.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.location?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
      {/* Hero Section */}
      <div className="fade-up" style={{ textAlign: "center", paddingTop: 80, marginBottom: 80, position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--blue-dim)", color: "var(--blue)", padding: "12px 24px", borderRadius: 100, fontSize: 13, fontWeight: 900, marginBottom: 32, border: "1px solid var(--border-glow)" }}>
          <span className="live-dot" style={{ backgroundColor: "var(--blue)", boxShadow: "0 0 10px var(--blue-glow)" }} />
          Multi-Tenant Infrastructure v2.0
        </div>
        <h1 style={{ fontSize: 62, fontWeight: 900, letterSpacing: "-3px", lineHeight: 1, marginBottom: 24 }}>
          Intelligence for <br />
          <span style={{ background: "linear-gradient(135deg, var(--blue), var(--purple))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Modern Salons</span>
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 19, maxWidth: 650, margin: "0 auto 48px", fontWeight: 600, lineHeight: 1.6 }}>
          Eliminate wait times with our next-generation queue monitoring platform. Discovery, booking, and management in one seamless ecosystem.
        </p>
        
        <div className="card-3d" style={{ maxWidth: 700, margin: "0 auto", padding: "12px", display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.7)", borderRadius: 32, border: "1px solid var(--border-glow)" }}>
          <div style={{ paddingLeft: 20, color: "var(--blue)" }}><Search size={24} /></div>
          <input 
            className="input" 
            style={{ border: "none", boxShadow: "none", fontSize: 18, padding: "16px 0", background: "transparent" }} 
            placeholder="Search studios by name or location..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" style={{ width: "auto", padding: "14px 28px", borderRadius: 24 }}>Find Salon</button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}>Global Discovery</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 600 }}>Browse verified partner studios</p>
        </div>
        <Link href="/setup" className="btn btn-ghost" style={{ width: "auto", fontSize: 13, gap: 10, borderRadius: 100, padding: "12px 24px" }}>
          <Store size={18} /> Partner Dashboard
        </Link>
      </div>

      <div className="responsive-grid">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="card-3d" style={{ height: 240, opacity: 0.5 }} />)
        ) : (
          filtered.map(salon => (
            <Link key={salon._id} href={`/salon/${salon.slug}/monitor`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card-3d fade-up" style={{ padding: 32, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 20, background: "var(--blue-dim)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-glow)" }}>
                       <Store size={28} color="var(--blue)" />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--amber)", color: "white", padding: "6px 12px", borderRadius: 12, fontSize: 13, fontWeight: 900 }}>
                       <Star size={14} fill="white" /> {salon.rating || "5.0"}
                    </div>
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px" }}>{salon.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 14, fontWeight: 600 }}>
                    <MapPin size={16} />
                    {salon.location || "Central Studio"}
                  </div>
                </div>

                <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: "var(--green)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Real-time ⚡</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-faint)" }}>Live Slots Available</span>
                   </div>
                   <div className="btn-icon btn-ghost" style={{ borderRadius: 16 }}>
                     <ArrowRight size={20} />
                   </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "100px 0" }}>
           <p style={{ color: "var(--text-faint)", fontSize: 18, fontWeight: 800 }}>No studios found matching your criteria.</p>
           <button onClick={() => setSearch("")} className="btn-ghost" style={{ marginTop: 16, width: "auto" }}>Clear Search</button>
        </div>
      )}
    </div>
  );
}

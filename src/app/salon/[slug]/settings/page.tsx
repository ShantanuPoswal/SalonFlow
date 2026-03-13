"use client";
import { useEffect, useState, use } from "react";
import { Settings, UserPlus, Scissors, MapPin, Phone, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Salon { _id: string; name: string; slug: string; location?: string; contact?: string; }
interface Barber { _id: string; name: string; avatarColor?: string; }
interface Service { _id: string; name: string; durationMinutes: number; price: number; }

export default function SalonSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    try {
      const sres = await fetch(`/api/salons?slug=${slug}`);
      const salons = await sres.json();
      const currentSalon = Array.isArray(salons) ? salons.find((s: any) => s.slug === slug) : null;
      if (!currentSalon) return;
      setSalon(currentSalon);

      const [bres, sres2] = await Promise.all([
        fetch(`/api/barbers?salonId=${currentSalon._id}`),
        fetch(`/api/services?salonId=${currentSalon._id}`)
      ]);
      setBarbers(await bres.json());
      setServices(await sres2.json());
      setLoading(false);
    } catch { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [slug]);

  const handleUpdateSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    setSaving(true);
    // Ideally we'd have a PATCH /api/salons/[id]
    // For now we simulate
    setMsg("✅ Salon updated (Prototype)");
    setTimeout(() => setMsg(""), 3000);
    setSaving(false);
  };

  if (loading) return <div className="page flex-center"><div className="spin">⚙️</div></div>;
  if (!salon) return <div className="page">Salon not found</div>;

  return (
    <div className="page">
      <div className="fade-up" style={{ marginBottom: 40, display: "flex", alignItems: "center", gap: 16 }}>
        <Link href={`/salon/${slug}/admin`} className="btn-icon btn-ghost"><ArrowLeft size={20} /></Link>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Studio Settings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 700 }}>Customizing {salon.name}</p>
        </div>
      </div>

      {msg && <div className="fade-up" style={{ background: "var(--green-dim)", color: "var(--green)", padding: 16, borderRadius: 12, marginBottom: 24, fontWeight: 800 }}>{msg}</div>}

      <div className="responsive-grid">
        {/* SHOP INFO */}
        <section className="fade-up delay-1">
          <p className="section-title">Shop Details</p>
          <form className="card-3d" style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={handleUpdateSalon}>
             <div><label className="label"><MapPin size={12} /> Location</label><input className="input" defaultValue={salon.location} /></div>
             <div><label className="label"><Phone size={12} /> Contact</label><input className="input" defaultValue={salon.contact} /></div>
             <button type="submit" disabled={saving} className="btn btn-primary" style={{ marginTop: 10 }}>
               <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
             </button>
          </form>
        </section>

        {/* STAFF MANAGEMENT */}
        <section className="fade-up delay-2">
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p className="section-title" style={{ margin: 0 }}>Staff Roster</p>
              <button className="btn btn-ghost" style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}><UserPlus size={14} /> Add Staff</button>
           </div>
           <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {barbers.map(b => (
                <div key={b._id} className="card-sm" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                   <div className="avatar" style={{ width: 36, height: 36, background: b.avatarColor || "var(--blue)", fontSize: 12 }}>{b.name.slice(0,2).toUpperCase()}</div>
                   <span style={{ flex: 1, fontWeight: 700 }}>{b.name}</span>
                   <button className="btn-icon btn-ghost" style={{ width: 32, height: 32, borderColor: "transparent" }}><Trash2 size={14} color="var(--red)" /></button>
                </div>
              ))}
           </div>
        </section>

        {/* SERVICE MANAGEMENT */}
        <section className="fade-up delay-3">
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p className="section-title" style={{ margin: 0 }}>Service Menu</p>
              <button className="btn btn-ghost" style={{ width: "auto", padding: "8px 12px", fontSize: 12 }}><Scissors size={14} /> Add Service</button>
           </div>
           <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {services.map(s => (
                <div key={s._id} className="card-sm" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                   <div style={{ flex: 1 }}>
                     <p style={{ fontWeight: 800, fontSize: 14, margin: 0 }}>{s.name}</p>
                     <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>{s.durationMinutes}m • ₹{s.price}</p>
                   </div>
                   <button className="btn-icon btn-ghost" style={{ width: 32, height: 32, borderColor: "transparent" }}><Trash2 size={14} color="var(--red)" /></button>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  );
}

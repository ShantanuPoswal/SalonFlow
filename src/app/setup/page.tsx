"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Zap, Store, ShieldCheck } from "lucide-react";

interface Barber { name: string; avatarColor: string; }
interface Service { name: string; durationMinutes: number; price: number; }

const COLORS = ["#2563eb","#9333ea","#16a34a","#d97706","#dc2626","#0891b2","#db2777","#7c3aed"];
const DUMMY_BARBERS: Barber[] = [
  { name: "Rahul Sharma", avatarColor: "#2563eb" },
  { name: "Ajay Kumar", avatarColor: "#9333ea" },
  { name: "Priya Singh", avatarColor: "#16a34a" },
];
const DUMMY_SERVICES: Service[] = [
  { name: "Haircut", durationMinutes: 30, price: 150 },
  { name: "Beard Trim", durationMinutes: 15, price: 80 },
  { name: "Hair + Beard", durationMinutes: 45, price: 220 },
  { name: "Head Massage", durationMinutes: 20, price: 100 },
  { name: "Hair Color", durationMinutes: 60, price: 500 },
];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Salon Info, 2: Staff & Services
  
  // Salon Info
  const [salonName, setSalonName] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  
  // Staff & Services
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [newBarberName, setNewBarberName] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcDuration, setNewSvcDuration] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const addBarber = () => {
    if (!newBarberName.trim()) return;
    setBarbers(prev => [...prev, { name: newBarberName.trim(), avatarColor: COLORS[prev.length % COLORS.length] }]);
    setNewBarberName("");
  };

  const removeBarber = (i: number) => setBarbers(prev => prev.filter((_, idx) => idx !== i));

  const addService = () => {
    if (!newSvcName || !newSvcDuration || !newSvcPrice) return;
    setServices(prev => [...prev, { name: newSvcName, durationMinutes: Number(newSvcDuration), price: Number(newSvcPrice) }]);
    setNewSvcName(""); setNewSvcDuration(""); setNewSvcPrice("");
  };

  const loadDummyData = () => {
    if (!salonName) setSalonName("Elite Salon & Spa");
    setBarbers(DUMMY_BARBERS);
    setServices(DUMMY_SERVICES);
    setMsg("✅ Demo data loaded! Review and click Finish.");
    setTimeout(() => setMsg(""), 3000);
  };

  const saveSetup = async () => {
    if (!salonName || barbers.length === 0 || services.length === 0) return;
    setSaving(true);
    try {
      // 1. Register Salon
      const salonRes = await fetch("/api/salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: salonName, location, contact, ownerId: "admin-demo" })
      });
      const salon = await salonRes.json();
      if (!salonRes.ok) throw new Error(salon.error);

      const salonId = salon._id;
      localStorage.setItem("selectedSalonId", salonId);
      localStorage.setItem("selectedSalonSlug", salon.slug);

      // 2. Add Barbers
      await Promise.all(barbers.map(b => 
        fetch("/api/barbers", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ ...b, salonId }) 
        })
      ));

      // 3. Add Services
      await Promise.all(services.map(s => 
        fetch("/api/services", { 
          method: "POST", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ ...s, salonId }) 
        })
      ));

      router.push(`/salon/${salon.slug}/monitor`);
    } catch (e: any) {
      setSaving(false);
      setMsg(`❌ Error: ${e.message}`);
    }
  };

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      <div className="fade-up" style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
            {step === 1 ? "🚀 Launch Your Salon" : "⚙️ Setup Your Shop"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>{step === 1 ? "Start your multi-tenant salon journey" : "Add your team and price list"}</p>
        </div>

        {step === 2 && (
          <button onClick={loadDummyData} className="btn btn-ghost" style={{ width: "auto", padding: "12px 20px", color: "var(--amber)", borderColor: "rgba(217,119,6,0.2)", gap: 8 }}>
            <Zap size={18} /> Load Demo
          </button>
        )}
      </div>

      {msg && <p className="fade-up" style={{ fontSize: 13, color: "var(--green)", fontWeight: 700, background: "var(--green-dim)", padding: "12px 16px", borderRadius: 12, marginBottom: 24, border: "1px solid rgba(22,163,74,0.2)" }}>{msg}</p>}

      {step === 1 ? (
        <div className="fade-up card-3d" style={{ padding: 32, maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--blue-dim)", color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Store size={32} />
            </div>
            <h2 style={{ fontWeight: 800, fontSize: 22 }}>Register Your Salon</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Global discovery for your customers starts here.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <label className="label">Salon Name *</label>
              <input className="input" placeholder="e.g. Royal Blue Barbershop" value={salonName} onChange={e => setSalonName(e.target.value)} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="e.g. Bandra West, Mumbai" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="label">Contact Number</label>
              <input className="input" placeholder="e.g. +91 98765 43210" value={contact} onChange={e => setContact(e.target.value)} />
            </div>
            
            <button onClick={() => setStep(2)} disabled={!salonName} className="btn btn-primary" style={{ padding: 18, fontSize: 16 }}>
              Continue to Staff & Services →
            </button>
          </div>
        </div>
      ) : (
        <div className="responsive-grid">
          {/* BARBERS */}
          <div className="fade-up delay-1">
            <p className="section-title">✂️ Staff ({barbers.length})</p>
            <div className="card-3d" style={{ padding: "20px", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <input className="input" placeholder="Name (e.g. Rahul)" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} onKeyDown={e => e.key === "Enter" && addBarber()} />
                <button onClick={addBarber} className="btn btn-primary" style={{ width: 52, padding: 0, flexShrink: 0 }}>
                  <Plus size={24} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {barbers.map((b, i) => (
                <div key={i} className="card-sm fade-up" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="avatar" style={{ width: 44, height: 44, background: b.avatarColor, fontSize: 15 }}>{getInitials(b.name)}</div>
                  <span style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>{b.name}</span>
                  <button onClick={() => removeBarber(i)} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 8 }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SERVICES */}
          <div className="fade-up delay-2">
            <p className="section-title">💈 Services ({services.length})</p>
            <div className="card-3d" style={{ padding: "24px", marginBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input className="input" placeholder="Service name" value={newSvcName} onChange={e => setNewSvcName(e.target.value)} />
                <div style={{ display: "flex", gap: 12 }}>
                  <input className="input" type="number" placeholder="Time (mins)" value={newSvcDuration} onChange={e => setNewSvcDuration(e.target.value)} />
                  <input className="input" type="number" placeholder="Price (₹)" value={newSvcPrice} onChange={e => setNewSvcPrice(e.target.value)} />
                </div>
                <button onClick={addService} className="btn btn-primary" style={{ marginTop: 8 }}>
                  <Plus size={18} /> Add Service
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {services.map((s, i) => (
                <div key={i} className="card-sm fade-up" style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: 15, margin: "0 0 4px" }}>{s.name}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, fontWeight: 600 }}>{s.durationMinutes} min</p>
                  </div>
                  <span style={{ fontWeight: 900, color: "var(--green)", fontSize: 18 }}>₹{s.price}</span>
                  <button onClick={() => setServices(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: "var(--text-faint)", cursor: "pointer", padding: 8 }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: 20 }}>
            <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ width: "auto" }}>← Back to Salon Info</button>
          </div>
        </div>
      )}

      {/* Save Button */}
      {step === 2 && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 600, padding: 0, zIndex: 50 }}>
          <button
            onClick={saveSetup}
            disabled={saving || barbers.length === 0 || services.length === 0}
            className="btn btn-success"
            style={{ fontSize: 16, padding: 18, boxShadow: "0 10px 30px rgba(22,163,74,0.4)" }}
          >
            {saving ? "⏳ Building Your Platform..." : `✅ Finish Setup (${barbers.length} staff, ${services.length} services)`}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState, useCallback, use } from "react";
import { Clock, Plus, Trash2, CheckCircle, Smartphone, User, Sparkles, LogOut, Settings } from "lucide-react";
import Link from "next/link";

interface Salon { _id: string; name: string; slug: string; }
interface Barber { _id: string; name: string; status: "available" | "busy" | "away"; currentService?: string; currentCustomer?: string; startTime?: string; avatarColor?: string; }
interface Service { _id: string; name: string; durationMinutes: number; price: number; }
interface Booking { _id: string; customerName: string; barberId: string; barberName: string; serviceName: string; serviceDuration: number; status: string; scheduledTime: string; }
interface Slot { startTime: string; label: string; isNow: boolean; }
interface BarberSlots { barber: { _id: string; name: string; status: string; avatarColor?: string; }; slots: Slot[]; waitMinutes: number; }
interface AnyAvailable { barberId: string; barberName: string; waitMinutes: number; isImmediate: boolean; avatarColor?: string; startTime: string; }

function getInitials(n: string) { return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

export default function SalonAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Walk-in modal state
  const [showModal, setShowModal] = useState(false);
  const [wiCustomer, setWiCustomer] = useState("");
  const [wiPhone, setWiPhone] = useState("");
  const [wiService, setWiService] = useState<Service | null>(null);
  const [slotsData, setSlotsData] = useState<{ slotsByBarber: Record<string, BarberSlots>, anyAvailable: AnyAvailable | null } | null>(null);
  const [selectedMode, setSelectedMode] = useState<"any" | "specific" | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const sres = await fetch(`/api/salons?slug=${slug}`);
      const salons = await sres.json();
      const currentSalon = Array.isArray(salons) ? salons.find((s: any) => s.slug === slug) : null;
      if (!currentSalon) { setLoading(false); return; }
      setSalon(currentSalon);

      const [bres, sres2, qres] = await Promise.all([
        fetch(`/api/barbers?salonId=${currentSalon._id}`),
        fetch(`/api/services?salonId=${currentSalon._id}`),
        fetch(`/api/bookings?salonId=${currentSalon._id}`)
      ]);
      setBarbers(await bres.json());
      setServices(await sres2.json());
      setBookings(await qres.json());
      setLoading(false);
    } catch { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (wiService && salon) {
      setSlotsData(null); setSelectedMode(null); setSelectedBarberId(null); setSelectedSlotIndex(null);
      fetch(`/api/slots?salonId=${salon._id}&duration=${wiService.durationMinutes}`).then(r => r.json()).then(d => setSlotsData(d));
    } else setSlotsData(null);
  }, [wiService, salon]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const addWalkIn = async () => {
    if (!wiService || !wiCustomer || !selectedMode || !salon || !slotsData) return;
    setLoading(true);
    let finalBarberId = "";
    let finalBarberName = "";
    let chosenTime = "";

    if (selectedMode === "any" && slotsData.anyAvailable) {
      finalBarberId = slotsData.anyAvailable.barberId;
      finalBarberName = slotsData.anyAvailable.barberName;
      chosenTime = slotsData.anyAvailable.startTime;
    } else if (selectedMode === "specific" && selectedBarberId && selectedSlotIndex !== null) {
      finalBarberId = selectedBarberId;
      finalBarberName = slotsData.slotsByBarber[selectedBarberId].barber.name;
      chosenTime = slotsData.slotsByBarber[selectedBarberId].slots[selectedSlotIndex].startTime;
    }

    const res = await fetch("/api/bookings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: wiCustomer, customerPhone: wiPhone,
        barberId: finalBarberId, barberName: finalBarberName,
        serviceName: wiService.name, serviceDuration: wiService.durationMinutes,
        scheduledTime: chosenTime,
        salonId: salon._id,
        type: "walkin",
      }),
    });
    const data = await res.json();
    if (!res.ok) { flash(`❌ ${data.error}`); setLoading(false); return; }
    flash(`✅ ${wiCustomer} added!`);
    setShowModal(false); setWiCustomer(""); setWiPhone(""); setWiService(null);
    fetchAll(); setLoading(false);
  };

  const updateStatus = async (id: string, status: string, booking?: Booking) => {
    await fetch(`/api/barbers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        currentCustomer: booking?.customerName || null,
        currentService: booking?.serviceName || null,
        startTime: status === "busy" ? new Date().toISOString() : null,
      }),
    });
    if (booking) {
      await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "busy" ? "in-progress" : "completed" }),
      });
    }
    fetchAll();
  };

  const cancelBooking = async (id: string, reason: string) => {
    await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: reason }),
    });
    flash(`🚨 Booking marked as ${reason}`);
    fetchAll();
  };

  if (loading) return <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}><Clock size={32} className="spin" color="var(--blue)" /></div>;
  if (!salon) return <div className="page" style={{ textAlign: "center", paddingTop: 100 }}><h1>🏚️</h1><h2>Salon Not Found</h2></div>;

  return (
    <div className="page" style={{ paddingBottom: 100 }}>
       <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, letterSpacing: "-1px" }}>{salon.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: 13, fontWeight: 700 }}>
            <span className="live-dot" /> Operational Dashboard
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href={`/salon/${slug}/settings`} className="btn-icon btn-ghost"><Settings size={20} /></Link>
        </div>
      </div>

      <div className="responsive-grid three-cols fade-up delay-1" style={{ marginBottom: 40 }}>
         {[
           { label: "Total Revenue", value: `₹${bookings.filter(b => b.status === "completed").reduce((acc, curr) => acc + (services.find(s => s.name === curr.serviceName)?.price || 0), 0)}`, color: "var(--green)" },
           { label: "Active Services", value: barbers.filter(b => b.status === "busy").length, color: "var(--red)" },
           { label: "Pending Queue", value: bookings.filter(b => b.status === "pending").length, color: "var(--blue)" },
         ].map(stat => (
           <div key={stat.label} className="card-3d" style={{ padding: "20px 16px", textAlign: "center" }}>
             <p style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--text-faint)", marginBottom: 8 }}>{stat.label}</p>
             <p style={{ fontSize: 32, fontWeight: 900, color: stat.color, margin: 0 }}>{stat.value}</p>
           </div>
         ))}
      </div>

      {msg && <div className="fade-up" style={{ position: "fixed", top: 32, right: 32, zIndex: 1000, background: "var(--card)", border: "1px solid var(--blue-glow)", padding: "16px 24px", borderRadius: 16, boxShadow: "var(--shadow-lg)", fontWeight: 800, color: "var(--blue)" }}>{msg}</div>}

      <div className="section-title fade-up delay-2" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Staff Control Center</span>
        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ width: "auto", padding: "12px 20px", fontSize: 13, gap: 8, borderRadius: 100 }}><Plus size={16} /> New Walk-in</button>
      </div>

      <div className="responsive-grid fade-up delay-2">
        {barbers.map(b => {
          const isBusy = b.status === "busy";
          const isAway = b.status === "away";
          const myPending = bookings.filter(bk => bk.barberId === b._id && bk.status === "pending").sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
          const nextInLine = myPending[0];

          return (
            <div key={b._id} className="card-3d" style={{ 
              padding: 28,
              border: isBusy ? "1px solid var(--red-dim)" : isAway ? "1px solid var(--amber)" : "1px solid var(--border)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                 <div className="avatar" style={{ width: 48, height: 48, background: b.avatarColor || "var(--blue)", fontSize: 16, opacity: isAway ? 0.5 : 1 }}>{getInitials(b.name)}</div>
                 <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 900, fontSize: 18, margin: "0 0 2px", opacity: isAway ? 0.5 : 1 }}>{b.name}</p>
                    <span className={`badge badge-${b.status}`} style={{ fontSize: 10 }}>{b.status}</span>
                 </div>
              </div>

              {isBusy && (
                <div style={{ background: "var(--red-dim)", padding: 20, borderRadius: 20, border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                   <p style={{ fontSize: 10, fontWeight: 900, color: "var(--red)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Currently Serving</p>
                   <p style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{b.currentCustomer}</p>
                   <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700, marginBottom: 20 }}>{b.currentService}</p>
                   <button onClick={() => updateStatus(b._id, "available", bookings.find(bk => bk.barberId === b._id && bk.status === "in-progress"))} className="btn-success" style={{ width: "100%", padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 14, border: "none", cursor: "pointer" }}>Complete & Next</button>
                </div>
              )}

              {isAway && (
                <div style={{ background: "var(--surface)", padding: 20, borderRadius: 20, border: "1px solid var(--border)", textAlign: "center" }}>
                   <p style={{ fontSize: 10, fontWeight: 900, color: "var(--amber)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>On Break</p>
                   <p style={{ color: "var(--text-faint)", fontSize: 13, fontWeight: 700, marginBottom: 20 }}>Staff is currently unavailable.</p>
                   <button onClick={() => updateStatus(b._id, "available")} className="btn-ghost" style={{ width: "100%", padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 14, border: "none", cursor: "pointer" }}>Resume Work</button>
                </div>
              )}

              {!isBusy && !isAway && (
                <div style={{ background: "var(--blue-dim)", padding: 20, borderRadius: 20, border: "1px solid rgba(59, 130, 246, 0.1)" }}>
                   <p style={{ fontSize: 10, fontWeight: 900, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Next Customer</p>
                   {nextInLine ? (
                     <>
                       <p style={{ fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{nextInLine.customerName}</p>
                       <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 700, marginBottom: 20 }}>
                          {nextInLine.serviceName} • {new Date(nextInLine.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </p>
                       <button onClick={() => updateStatus(b._id, "busy", nextInLine)} className="btn-primary" style={{ width: "100%", padding: 14, borderRadius: 14, fontWeight: 900, fontSize: 14, border: "none", cursor: "pointer", marginBottom: 12 }}>Start Session</button>
                       <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => cancelBooking(nextInLine._id, "no-show")} className="btn-ghost" style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 12 }}>No-Show</button>
                          <button onClick={() => cancelBooking(nextInLine._id, "cancelled")} className="btn-ghost" style={{ flex: 1, padding: 10, borderRadius: 10, fontSize: 12, color: "var(--red)" }}>Cancel</button>
                       </div>
                     </>
                   ) : (
                     <div style={{ textAlign: "center", padding: "10px 0" }}>
                       <p style={{ color: "var(--text-faint)", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Station is Idle</p>
                       <button onClick={() => updateStatus(b._id, "away")} className="btn-ghost" style={{ width: "100%", padding: 10, borderRadius: 10, fontSize: 12 }}>Take Break</button>
                     </div>
                   )}
                </div>
              )}
            </div>
          );
        })}
      </div>

       {/* Walk-in Modal */}
       {showModal && (
        <div className="modal-overlay">
          <div className="modal-content fade-up" style={{ maxWidth: 500 }}>
            <div style={{ padding: 24, borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontWeight: 900, fontSize: 20 }}>Quick Walk-in</h2>
              <button onClick={() => setShowModal(false)} className="btn-icon btn-ghost">✕</button>
            </div>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
               <div><label className="label">Customer Name</label><input className="input" value={wiCustomer} onChange={e => setWiCustomer(e.target.value)} /></div>
               <div><label className="label">Select Service</label>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                   {services.map(s => (
                     <button key={s._id} onClick={() => setWiService(s)} className={`slot-pill ${wiService?._id === s._id ? "active" : ""}`}>{s.name}</button>
                   ))}
                 </div>
               </div>
               {slotsData && (
                 <div>
                   <label className="label">Assign To</label>
                   <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                     {slotsData.anyAvailable && (
                       <div onClick={() => setSelectedMode("any")} className="card-sm" style={{ border: `2px solid ${selectedMode === "any" ? "var(--purple)" : "transparent"}`, cursor: "pointer" }}>
                         <p style={{ fontWeight: 800 }}>Magic Assign (Soonest)</p>
                       </div>
                     )}
                     {Object.values(slotsData.slotsByBarber).map(b => (
                       <div key={b.barber._id} onClick={() => { setSelectedMode("specific"); setSelectedBarberId(b.barber._id); setSelectedSlotIndex(0); }} className="card-sm" style={{ border: `2px solid ${selectedBarberId === b.barber._id ? "var(--blue)" : "transparent"}`, cursor: "pointer" }}>
                         <p style={{ fontWeight: 800 }}>{b.barber.name} (~{b.waitMinutes}m)</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </div>
            <div style={{ padding: 24, borderTop: "1px solid var(--border)" }}>
              <button disabled={!selectedMode || !wiCustomer} onClick={addWalkIn} className="btn btn-primary">Add to Queue</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState, use } from "react";
import { Clock, CheckCircle, Sparkles, User, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface Salon { _id: string; name: string; slug: string; }
interface Service { _id: string; name: string; durationMinutes: number; price: number; }
interface Slot { startTime: string; label: string; isNow: boolean; }
interface BarberSlots {
  barber: { _id: string; name: string; status: string; avatarColor?: string; };
  slots: Slot[];
  waitMinutes: number;
}
interface AnyAvailable {
  barberId: string; barberName: string; waitMinutes: number; isImmediate: boolean; avatarColor?: string; startTime: string;
}

function getInitials(n: string) { return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

export default function SalonBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [slotsData, setSlotsData] = useState<{ slotsByBarber: Record<string, BarberSlots>, anyAvailable: AnyAvailable | null } | null>(null);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedMode, setSelectedMode] = useState<"any" | "specific" | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmed, setConfirmed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/salons?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        const found = Array.isArray(d) ? d.find((s: any) => s.slug === slug) : null;
        if (found) {
          setSalon(found);
          fetch(`/api/services?salonId=${found._id}`).then(r => r.json()).then(svcs => setServices(Array.isArray(svcs) ? svcs : []));
        }
      });
  }, [slug]);

  useEffect(() => {
    if (selectedService && salon) {
      setSlotsData(null); setSelectedMode(null); setSelectedBarberId(null); setSelectedSlotIndex(null);
      fetch(`/api/slots?salonId=${salon._id}&duration=${selectedService.durationMinutes}`)
        .then(r => r.json())
        .then(d => setSlotsData(d));
    }
  }, [selectedService, salon]);

  const handleBook = async () => {
    if (!selectedService || !name || !selectedMode || !salon) return;
    setLoading(true); setErrorMsg("");

    let finalBarberId = "";
    let finalBarberName = "";
    let chosenTime = "";
    let timeLabel = "";
    
    if (selectedMode === "any" && slotsData?.anyAvailable) {
      finalBarberId = slotsData.anyAvailable.barberId;
      finalBarberName = slotsData.anyAvailable.barberName;
      chosenTime = slotsData.anyAvailable.startTime;
      timeLabel = slotsData.anyAvailable.isImmediate ? "Immediately" : new Date(chosenTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (selectedMode === "specific" && selectedBarberId && selectedSlotIndex !== null) {
      finalBarberId = selectedBarberId;
      finalBarberName = slotsData!.slotsByBarber[selectedBarberId].barber.name;
      const exactSlot = slotsData!.slotsByBarber[selectedBarberId].slots[selectedSlotIndex];
      chosenTime = exactSlot.startTime;
      timeLabel = exactSlot.label;
    } else return;

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name, customerPhone: phone,
          barberId: finalBarberId, barberName: finalBarberName,
          serviceName: selectedService.name, serviceDuration: selectedService.durationMinutes,
          scheduledTime: chosenTime,
          salonId: salon._id,
          type: "online",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setConfirmed({ ...data, barberName: finalBarberName, serviceName: selectedService.name, duration: selectedService.durationMinutes, timeLabel });
    } catch (e: any) {
      setErrorMsg(e.message);
    }
    setLoading(false);
  };

  if (confirmed) {
    return (
      <div className="page" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "85vh" }}>
        <div className="fade-up" style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🎉</div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Booked!</h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Your slot at {salon?.name} is confirmed.</p>
          <div className="card-3d" style={{ padding: "32px 28px", textAlign: "left", width: "100%", marginBottom: 32, background: "rgba(255,255,255,0.9)" }}>
            {[
              ["👤 Name", name],
              ["✂️ Barber", confirmed.barberName],
              ["📅 Time", confirmed.timeLabel],
              ["⏱ Duration", `${confirmed.duration} min`],
            ].map(([l, v], i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>{l}</span>
                <span style={{ fontWeight: 800, fontSize: 15 }}>{v}</span>
              </div>
            ))}
          </div>
          <Link href={`/salon/${slug}/monitor`} className="btn btn-primary" style={{ padding: 16, textDecoration: "none" }}>📊 View Live Monitor</Link>
        </div>
      </div>
    );
  }

  const bgStyle = {
    position: "fixed" as const, top: 0, left: 0, width: "100%", height: "100vh", zIndex: -1,
    backgroundImage: "radial-gradient(at 100% 0%, rgba(216, 180, 254, 0.3) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(147, 197, 253, 0.3) 0px, transparent 50%)",
    backgroundSize: "cover", opacity: 0.8, pointerEvents: "none" as const
  };

  return (
    <>
      <div style={bgStyle} />
      <div className="page" style={{ position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ marginBottom: 48, textAlign: "center" }}>
          <Link href={`/salon/${slug}/monitor`} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--blue)", textDecoration: "none", fontSize: 13, fontWeight: 800, marginBottom: 24, background: "var(--blue-dim)", padding: "10px 20px", borderRadius: 100, border: "1px solid var(--border-glow)" }}>
            <ChevronLeft size={16} /> Back to Live Queue
          </Link>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8, letterSpacing: "-1.5px" }}>{salon?.name || "Initializing..."}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 600 }}>Precision booking for the modern era.</p>
        </div>

        {step === 1 && (
          <div className="fade-up">
            <p className="section-title">Step 1: Choose Service</p>
            <div className="responsive-grid" style={{ marginBottom: 40 }}>
              {services.map(s => (
                <div key={s._id} onClick={() => setSelectedService(s)} className={`card-3d ${selectedService?._id === s._id ? "active-border" : ""}`} style={{
                  border: `2px solid ${selectedService?._id === s._id ? "var(--blue)" : "transparent"}`,
                  padding: "24px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                  background: selectedService?._id === s._id ? "var(--blue-dim)" : "var(--card)"
                }}>
                  <div>
                    <p style={{ fontWeight: 900, fontSize: 18, margin: "0 0 4px", color: selectedService?._id === s._id ? "var(--blue)" : "var(--text)" }}>{s.name}</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, fontWeight: 700 }}>{s.durationMinutes} min session</p>
                  </div>
                  <span style={{ fontWeight: 900, color: "var(--green)", fontSize: 20 }}>₹{s.price}</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setStep(2)} disabled={!selectedService} className="btn btn-primary" style={{ maxWidth: 400, margin: "0 auto", padding: 20, fontSize: 16 }}>Select Appointment Time →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-up">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
              <p className="section-title" style={{ margin: 0 }}>Step 2: Reserve Slot</p>
              <button onClick={() => setStep(1)} className="btn-ghost" style={{ width: "auto", padding: "8px 16px", borderRadius: 100, fontSize: 12, fontWeight: 800 }}>← Adjust Service</button>
            </div>
            
            {slotsData?.anyAvailable && (
              <div style={{ marginBottom: 48 }}>
                <p className="label" style={{ color: "var(--purple)", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}><Sparkles size={14} /> AI Optimization</p>
                <div onClick={() => { setSelectedMode("any"); setSelectedSlotIndex(0); }} className="card-3d" style={{
                  background: selectedMode === "any" ? "var(--purple-dim)" : "linear-gradient(135deg, white, #fafafa)",
                  border: `2px solid ${selectedMode === "any" ? "var(--purple)" : "transparent"}`,
                  padding: "32px", cursor: "pointer", display: "flex", alignItems: "center", gap: 20,
                  boxShadow: selectedMode === "any" ? "0 20px 40px var(--purple-glow)" : "var(--shadow-md)"
                }}>
                  <div style={{ width: 64, height: 64, borderRadius: 24, background: "linear-gradient(135deg, var(--blue), var(--purple))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px var(--purple-glow)" }}>
                    <Sparkles size={32} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 900, fontSize: 22, margin: "0 0 4px", color: "var(--purple)" }}>Earliest Discovery</p>
                    <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0, fontWeight: 600 }}>Instant match with {slotsData.anyAvailable.barberName}</p>
                  </div>
                  <span className={`badge ${slotsData.anyAvailable.isImmediate ? "badge-available" : "badge-away"}`} style={{ fontSize: 14, padding: "10px 20px" }}>
                    {slotsData.anyAvailable.isImmediate ? "⚡ Ready Now" : new Date(slotsData.anyAvailable.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}

            <p className="section-title">Manual Selection</p>
            <div className="responsive-grid" style={{ marginBottom: 40 }}>
              {slotsData && Object.values(slotsData.slotsByBarber).map((bData) => (
                <div key={bData.barber._id} className="card-3d" style={{
                  padding: "24px", border: `2px solid ${selectedMode === "specific" && selectedBarberId === bData.barber._id ? "var(--blue)" : "transparent"}`,
                  background: selectedMode === "specific" && selectedBarberId === bData.barber._id ? "var(--blue-dim)" : "var(--card)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
                     <div className="avatar" style={{ width: 44, height: 44, background: bData.barber.avatarColor || "var(--blue)", fontSize: 15 }}>{getInitials(bData.barber.name)}</div>
                     <p style={{ fontWeight: 900, fontSize: 17, margin: 0 }}>{bData.barber.name}</p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {bData.slots.map((slot, i) => (
                      <button key={i} onClick={() => { setSelectedMode("specific"); setSelectedBarberId(bData.barber._id); setSelectedSlotIndex(i); }} className={`slot-pill ${selectedMode === "specific" && selectedBarberId === bData.barber._id && selectedSlotIndex === i ? "active" : ""}`}>
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setStep(3)} disabled={!selectedMode} className="btn btn-primary" style={{ maxWidth: 400, margin: "0 auto", padding: 20, fontSize: 16 }}>Confirm Identity →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card-3d fade-up" style={{ padding: 32, maxWidth: 500, margin: "0 auto", background: "rgba(255,255,255,0.9)" }}>
            <h2 style={{ fontWeight: 900, fontSize: 20, marginBottom: 24 }}>📝 Finalize Details</h2>
            {errorMsg && <div style={{ padding: 16, background: "var(--red-dim)", color: "var(--red)", borderRadius: 12, marginBottom: 20 }}>❌ {errorMsg}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 }}>
              <div><label className="label">Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
              <div><label className="label">Phone</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            </div>
            <div className="card" style={{ padding: 20, marginBottom: 24, border: "1px dashed var(--border)" }}>
               <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                 <span className="text-muted">Staff</span>
                 <span style={{ fontWeight: 800 }}>{selectedMode === "any" ? slotsData?.anyAvailable?.barberName : slotsData?.slotsByBarber[selectedBarberId!]?.barber.name}</span>
               </div>
               <div style={{ display: "flex", justifyContent: "space-between" }}>
                 <span className="text-muted">Service</span>
                 <span style={{ fontWeight: 900, color: "var(--blue)" }}>{selectedService?.name}</span>
               </div>
            </div>
            <div style={{ display: "flex", gap: 14 }}>
              <button onClick={() => setStep(2)} className="btn btn-ghost" style={{ width: "auto" }}>← Back</button>
              <button onClick={handleBook} disabled={loading || !name} className="btn btn-success" style={{ flex: 1 }}>{loading ? "Booking..." : "Confirm Booking ✨"}</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

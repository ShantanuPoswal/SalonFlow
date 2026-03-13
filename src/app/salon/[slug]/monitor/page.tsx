"use client";
import { useEffect, useState, useCallback, use } from "react";
import { Clock, RefreshCw, LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface Salon { _id: string; name: string; slug: string; }
interface Barber { _id: string; name: string; status: "available" | "busy" | "away"; currentService?: string; currentCustomer?: string; startTime?: string; avatarColor?: string; }
interface Booking { _id: string; customerName: string; barberId: string; barberName: string; serviceName: string; serviceDuration: number; status: string; scheduledTime: string; }

function getInitials(n: string) { return n.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

function ElapsedTimer({ startTime }: { startTime: string }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const start = new Date(startTime).getTime();
    const upd = () => setSecs(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    upd(); const t = setInterval(upd, 1000); return () => clearInterval(t);
  }, [startTime]);
  return <>{Math.floor(secs/60).toString().padStart(2,"0")}:{(secs%60).toString().padStart(2,"0")}</>;
}

export default function SalonMonitorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [queue, setQueue] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      // 1. Get Salon by Slug
      const sres = await fetch(`/api/salons?slug=${slug}`);
      // Note: I need to update the Salon API to support slug filtering if it doesn't already.
      // For now, I'll fetch all and find (unoptimized but works for prototype)
      const salons = await sres.json();
      const currentSalon = Array.isArray(salons) ? salons.find((s: any) => s.slug === slug) : null;
      
      if (!currentSalon) {
        setError("Salon not found");
        setLoading(false);
        return;
      }
      setSalon(currentSalon);

      // 2. Fetch Barbers and Bookings for this Salon
      const [bres, qres] = await Promise.all([
        fetch(`/api/barbers?salonId=${currentSalon._id}`),
        fetch(`/api/bookings?salonId=${currentSalon._id}`)
      ]);
      const bd = await bres.json(); 
      const qd = await qres.json();
      
      if (Array.isArray(bd)) setBarbers(bd);
      if (Array.isArray(qd)) setQueue(qd);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 6000); return () => clearInterval(t); }, [fetchAll]);

  const pending = queue.filter(b => b.status === "pending").sort((a,b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  const waitCount = pending.length;
  const busyCount = barbers.filter(b => b.status === "busy").length;
  const availCount = barbers.filter(b => b.status === "available").length;

  const getEstWait = (barber: Barber) => {
    let waitMinutes = 0;
    
    if (barber.status === "busy" && barber.startTime) {
      const activeJob = queue.find(b => b.barberId === barber._id && b.status === "in-progress");
      if (activeJob) {
        const elapsedMin = Math.floor((Date.now() - new Date(barber.startTime).getTime()) / 60000);
        waitMinutes += Math.max(0, activeJob.serviceDuration - elapsedMin);
      } else {
        waitMinutes += 15; // fallback
      }
    }

    const myPending = pending.filter(b => b.barberId === barber._id);
    waitMinutes += myPending.reduce((acc, curr) => acc + curr.serviceDuration, 0);
    return waitMinutes;
  };

  if (loading) return (
    <div className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
      <Clock size={32} className="spin" color="var(--blue)" />
    </div>
  );

  if (error || !salon) return (
    <div className="page" style={{ textAlign: "center", paddingTop: 100 }}>
       <h1 style={{ fontSize: 48 }}>🏚️</h1>
       <h2>{error || "Salon Not Found"}</h2>
       <Link href="/" className="btn btn-primary" style={{ marginTop: 24, display: "inline-flex", width: "auto" }}>Go Back Home</Link>
    </div>
  );

  return (
    <div className="page">
      <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px", marginBottom: 4 }}>
            {salon.name} <span className="live-dot" style={{ marginLeft: 8 }}></span>
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}>
            <LayoutDashboard size={14} />
            Live Monitor
          </div>
        </div>
        <button onClick={fetchAll} className="btn-icon btn-ghost">
          <RefreshCw size={20} color="var(--text-muted)" />
        </button>
      </div>

      <div className="responsive-grid three-cols fade-up delay-1" style={{ marginBottom: 40 }}>
        {[
          { label: "In Queue", value: waitCount, color: "var(--blue)" },
          { label: "Occupied", value: busyCount, color: "var(--red)" },
          { label: "Available", value: availCount, color: "var(--green)" },
        ].map(stat => (
          <div key={stat.label} className="card-3d" style={{ padding: "18px 12px", textAlign: "center", background: "var(--card)" }}>
            <p style={{ fontSize: 32, fontWeight: 900, margin: "0 0 2px", color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "var(--text-muted)", margin: 0 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="section-title fade-up delay-2">✂️ Team Status</p>
      <div className="responsive-grid fade-up delay-2" style={{ marginBottom: 40 }}>
        {barbers.map((barber) => {
          const myPending = pending.filter(b => b.barberId === barber._id);
          const estWait = getEstWait(barber);

          return (
            <div key={barber._id} className="card-3d" style={{
              padding: 24,
              borderColor: barber.status === "busy" ? "rgba(220,38,38,0.15)" : barber.status === "away" ? "var(--amber)" : "transparent",
              boxShadow: "var(--shadow-md)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div className="avatar" style={{ width: 52, height: 52, background: barber.avatarColor || "var(--blue)", fontSize: 18, opacity: barber.status === "away" ? 0.5 : 1 }}>
                  {getInitials(barber.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 800, fontSize: 18, margin: "0 0 4px", opacity: barber.status === "away" ? 0.5 : 1 }}>{barber.name}</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0, fontWeight: 600 }}>{myPending.length} waiting</p>
                </div>
                <span className={`badge badge-${barber.status}`} style={{ fontSize: 11, padding: "4px 10px" }}>{barber.status}</span>
              </div>

              {barber.status === "busy" && barber.startTime ? (
                <div style={{ background: "rgba(239,68,68,0.05)", borderRadius: 16, padding: "16px", border: "1px solid rgba(220,38,38,0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "var(--red)", textTransform: "uppercase", fontWeight: 900, letterSpacing: 1.5, margin: "0 0 4px" }}>Active</p>
                      <p style={{ fontWeight: 800, margin: "0 0 2px", fontSize: 16 }}>{barber.currentCustomer}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0, fontWeight: 700 }}>{barber.currentService}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 900, letterSpacing: 1.5, margin: "0 0 4px" }}>Wait Time</p>
                      <p style={{ fontWeight: 900, margin: 0, fontSize: 24, fontVariantNumeric: "tabular-nums", color: "var(--red)" }}>
                        ~{estWait}m
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ background: barber.status === "away" ? "transparent" : "var(--surface)", borderRadius: 16, padding: "16px", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, letterSpacing: 1, margin: "0 0 6px" }}>Wait Time</p>
                  <p style={{ fontWeight: 800, margin: 0, fontSize: 20, color: barber.status === "away" ? "var(--amber)" : "var(--green)" }}>
                    {barber.status === "away" ? "On Break" : estWait === 0 ? "Ready Now ✨" : `~${estWait} min`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", zIndex: 50 }}>
        <Link href={`/salon/${slug}/book`} className="btn btn-primary" style={{ padding: "18px 32px", fontSize: 16, borderRadius: 20, textDecoration: "none", boxShadow: "0 10px 40px rgba(37,99,235,0.4)", display: "flex", alignItems: "center", gap: 10 }}>
          <Clock size={20} /> Book Appointment
        </Link>
      </div>
    </div>
  );
}

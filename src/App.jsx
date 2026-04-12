import { useState, useEffect, useRef } from "react";

const FB_URL = "https://wasp-watch-default-rtdb.firebaseio.com";
const MAX_GALLERY = 50; // keep last 50 sightings in Firebase
const RECENT_COUNT = 5; // show 5 on main page

// Returns date string in PST (UTC-8)
function getPSTDateStr() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const pst = new Date(utc + (-8 * 60) * 60000);
  return pst.toISOString().slice(0, 10);
}

async function fbGet(path) {
  const res = await fetch(`${FB_URL}/${path}.json`);
  return await res.json();
}

async function fbSet(path, value) {
  await fetch(`${FB_URL}/${path}.json`, {
    method: "PUT",
    body: JSON.stringify(value),
  });
}

async function fbIncrement(path) {
  const current = await fbGet(path);
  const next = (current || 0) + 1;
  await fbSet(path, next);
  return next;
}

function makeSightingCanvas(ts) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  // Dark background
  ctx.fillStyle = "#1a1209";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Subtle grid
  ctx.strokeStyle = "rgba(245,197,24,0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
  // Border
  ctx.strokeStyle = "#f5c518";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  // Corner brackets
  const b = 20;
  ctx.lineWidth = 3;
  [[10,10],[canvas.width-10,10],[10,canvas.height-10],[canvas.width-10,canvas.height-10]].forEach(([cx,cy]) => {
    const sx = cx < canvas.width/2 ? 1 : -1;
    const sy = cy < canvas.height/2 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(cx, cy + sy*b); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx*b, cy); ctx.stroke();
  });
  // Wasp emoji
  ctx.font = "72px serif";
  ctx.textAlign = "center";
  ctx.fillText("🐝", canvas.width / 2, canvas.height / 2 - 20);
  // Warning text
  ctx.fillStyle = "#f5c518";
  ctx.font = "bold 24px Courier New";
  ctx.fillText("⚠  WASP SPOTTED!", canvas.width / 2, canvas.height / 2 + 40);
  // Timestamp
  ctx.fillStyle = "#f5f0e8";
  ctx.font = "13px Courier New";
  ctx.fillText(new Date(ts).toLocaleString(), canvas.width / 2, canvas.height / 2 + 68);
  // Watermark
  ctx.font = "11px Courier New";
  ctx.fillStyle = "#f5c518";
  ctx.globalAlpha = 0.4;
  ctx.fillText("waspwatch.com", canvas.width / 2, canvas.height - 16);
  ctx.globalAlpha = 1;
  return canvas.toDataURL("image/png");
}

// ── Gallery Page ──────────────────────────────────────────────────────────────
function GalleryPage({ onBack }) {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fbGet("sightings").then((data) => {
      if (data) {
        const list = Object.values(data).sort((a, b) => b.ts - a.ts);
        setSightings(list);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f0e8",
      fontFamily: "'Courier New', Courier, monospace", color: "#2a1f0e",
      padding: "0 16px 60px",
    }}>
      {/* Grain */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <header style={{
          paddingTop: 24, paddingBottom: 12,
          borderBottom: "2px solid #2a1f0e", marginBottom: 28,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", opacity: 0.4, marginBottom: 4 }}>
              Wasp Watch
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(22px, 5vw, 36px)", fontWeight: 700, letterSpacing: -1, color: "#2a1f0e" }}>
              📸 Sightings Gallery
            </h1>
          </div>
          <button onClick={onBack} style={{
            fontFamily: "inherit", fontWeight: 700, fontSize: 11,
            letterSpacing: 2, textTransform: "uppercase",
            background: "#2a1f0e", color: "#f5c518",
            border: "none", padding: "10px 16px", cursor: "pointer",
          }}>
            ← Back to Live
          </button>
        </header>

        {loading && (
          <div style={{ textAlign: "center", opacity: 0.4, paddingTop: 60, fontSize: 13, letterSpacing: 2 }}>
            LOADING SIGHTINGS...
          </div>
        )}

        {!loading && sightings.length === 0 && (
          <div style={{ textAlign: "center", opacity: 0.4, paddingTop: 60, fontSize: 13, letterSpacing: 2 }}>
            NO SIGHTINGS YET — BE THE FIRST TO RING THE ALARM!
          </div>
        )}

        {/* Grid */}
        {!loading && sightings.length > 0 && (
          <>
            <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>
              {sightings.length} sighting{sightings.length !== 1 ? "s" : ""} recorded
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}>
              {sightings.map((s, i) => (
                <div
                  key={s.ts}
                  onClick={() => setLightbox(s)}
                  style={{
                    cursor: "pointer", border: "2px solid #2a1f0e",
                    background: "#2a1f0e", overflow: "hidden",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(42,31,14,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  <img src={s.img} alt={`Sighting ${i + 1}`} style={{ width: "100%", display: "block" }} />
                  <div style={{ padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: "#f5c518", letterSpacing: 1, opacity: 0.7 }}>
                      {new Date(s.ts).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(26,18,9,0.93)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: "100%" }}>
            <img src={lightbox.img} alt="Sighting" style={{ width: "100%", display: "block", border: "2px solid #f5c518" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "#f5c518", letterSpacing: 1 }}>
                {new Date(lightbox.ts).toLocaleString()}
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                <a
                  href={lightbox.img}
                  download={`wasp-sighting-${lightbox.ts}.png`}
                  style={{ fontSize: 10, color: "#f5c518", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", opacity: 0.7 }}
                >
                  ↓ Download
                </a>
                <button onClick={() => setLightbox(null)} style={{
                  fontFamily: "inherit", fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
                  background: "none", border: "1px solid rgba(245,197,24,0.4)", color: "#f5c518",
                  padding: "4px 10px", cursor: "pointer",
                }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      `}</style>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WaspDoorbell() {
  const [page, setPage] = useState("main"); // "main" | "gallery"
  const [count, setCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [justClicked, setJustClicked] = useState(false);
  const [recentPings, setRecentPings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [recentSightings, setRecentSightings] = useState([]); // last 5
  const [lightbox, setLightbox] = useState(null);
  const pingId = useRef(0);
  const toastTimeout = useRef(null);

  const loadData = async () => {
    try {
      const allTime = await fbGet("allTime");
      setCount(allTime || 0);
    } catch (e) {}
    try {
      const todayStr = getPSTDateStr();
      const today = await fbGet(`daily/${todayStr}`);
      setTodayCount(today || 0);
    } catch (e) {}
    try {
      const data = await fbGet("sightings");
      if (data) {
        const list = Object.values(data).sort((a, b) => b.ts - a.ts).slice(0, RECENT_COUNT);
        setRecentSightings(list);
      }
    } catch (e) {}
    setLoaded(true);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle hash routing
  useEffect(() => {
    const onHash = () => setPage(window.location.hash === "#gallery" ? "gallery" : "main");
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goGallery = () => { window.location.hash = "#gallery"; };
  const goMain = () => { window.location.hash = ""; };

  if (page === "gallery") return <GalleryPage onBack={goMain} />;

  const handleSpotted = async () => {
    if (justClicked) return;
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 1400);

    const ts = Date.now();
    const imgData = makeSightingCanvas(ts);
    const newSighting = { ts, img: imgData };

    // Optimistic UI
    setCount((c) => c + 1);
    setTodayCount((t) => t + 1);
    setRecentSightings((prev) => [newSighting, ...prev].slice(0, RECENT_COUNT));

    const id = pingId.current++;
    setRecentPings((prev) => [...prev, { id, x: 30 + Math.random() * 40, y: 30 + Math.random() * 40 }]);
    setTimeout(() => setRecentPings((prev) => prev.filter((p) => p.id !== id)), 1000);

    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setTodayCount((t) => { setToast(t); toastTimeout.current = setTimeout(() => setToast(null), 3500); return t; });

    try {
      const todayStr = getPSTDateStr();
      const [realAll, realToday] = await Promise.all([
        fbIncrement("allTime"),
        fbIncrement(`daily/${todayStr}`),
      ]);
      setCount(realAll);
      setTodayCount(realToday);
      setToast(realToday);

      // Save sighting to Firebase — keep only last MAX_GALLERY
      const existing = await fbGet("sightings");
      let sightingsList = existing ? Object.values(existing) : [];
      sightingsList.push(newSighting);
      sightingsList = sightingsList.sort((a, b) => b.ts - a.ts).slice(0, MAX_GALLERY);
      // Rebuild as keyed object
      const keyed = {};
      sightingsList.forEach((s) => { keyed[`s${s.ts}`] = s; });
      await fbSet("sightings", keyed);
      setRecentSightings(sightingsList.slice(0, RECENT_COUNT));
    } catch (e) {
      console.error("Firebase write failed:", e);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#f5f0e8",
      fontFamily: "'Courier New', Courier, monospace", color: "#2a1f0e",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "0 16px 40px", position: "relative", overflow: "hidden",
    }}>

      {/* Grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Toast */}
      {toast !== null && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 100, background: "#2a1f0e", color: "#f5c518",
          padding: "16px 32px", border: "2px solid #f5c518", fontWeight: 700,
          fontSize: "clamp(13px, 3vw, 18px)", letterSpacing: 1, textAlign: "center",
          animation: "toastIn 0.3s ease-out", boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
        }}>
          🐝 You've spotted <span style={{ color: "#fff", fontSize: "1.2em" }}>{toast}</span> wasp{toast !== 1 ? "s" : ""} today!
        </div>
      )}

      {/* Header */}
      <header style={{
        width: "100%", maxWidth: 720, paddingTop: 24, paddingBottom: 12,
        borderBottom: "2px solid #2a1f0e", marginBottom: 28, zIndex: 1,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <img src="/logo.png" alt="Wasp Watch Logo" style={{ height: 90, width: "auto", objectFit: "contain" }} />
        <div style={{ textAlign: "right", fontSize: 11, opacity: 0.45, lineHeight: 1.6, color: "#2a1f0e" }}>
          CITIZEN<br />SCIENCE<br />PROJECT
        </div>
      </header>

      {/* Stream */}
      <div style={{ width: "100%", maxWidth: 720, zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#c0392b", color: "#fff",
            fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "3px 8px", textTransform: "uppercase",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block", animation: "pulse 1.2s ease-in-out infinite" }} />
            LIVE
          </span>
          <span style={{ fontSize: 11, opacity: 0.45 }}>Office Window Cam</span>
        </div>

        <div style={{
          width: "100%", aspectRatio: "16/9", position: "relative", borderRadius: 4, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(42,31,14,0.35), 0 8px 24px rgba(42,31,14,0.2), 0 2px 6px rgba(42,31,14,0.15)",
          transform: "translateY(-2px)", border: "3px solid #2a1f0e", background: "#1a1209",
        }}>
          <iframe
            width="100%" height="100%"
            src="https://www.youtube.com/embed/zT7jCvmpFX0?si=-DbZRxH5Vt7s9jEi&amp;controls=0"
            title="YouTube video player" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
            style={{ display: "block", border: "none" }}
          />


          {recentPings.map((p) => (
            <div key={p.id} style={{
              position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
              transform: "translate(-50%, -50%)", pointerEvents: "none",
              animation: "pingOut 0.9s ease-out forwards",
            }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", border: "2px solid #f5c518", animation: "ripple 0.9s ease-out forwards" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Counter + Panic Button */}
      <div style={{
        width: "100%", maxWidth: 720, zIndex: 1,
        display: "flex", alignItems: "stretch", marginTop: 28, border: "2px solid #2a1f0e",
      }}>
        {/* Counter */}
        <div style={{
          flex: 1, background: "#2a1f0e", color: "#f5f0e8",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "20px 24px",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, marginBottom: 6 }}>Wasps spotted</div>
          <div style={{
            fontSize: "clamp(48px, 10vw, 80px)", fontWeight: 700, lineHeight: 1, letterSpacing: -2,
            transition: "transform 0.15s", transform: justClicked ? "scale(1.12)" : "scale(1)", color: "#f5c518",
          }}>
            {loaded ? count.toLocaleString() : "—"}
          </div>
          <div style={{ fontSize: 10, opacity: 0.35, marginTop: 4 }}>all time · shared</div>
          {loaded && <div style={{ fontSize: 12, color: "#f5c518", opacity: 0.65, marginTop: 8, letterSpacing: 1 }}>{todayCount} today</div>}
        </div>

        {/* Panic Button */}
        <div style={{
          flex: 1, borderLeft: "2px solid #2a1f0e",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "20px 16px", gap: 12,
          background: "repeating-linear-gradient(45deg, #1a1209 0px, #1a1209 18px, #f5c518 18px, #f5c518 36px)",
        }}>
          <button onClick={handleSpotted} disabled={justClicked} style={{
            background: "none", border: "none", padding: 0,
            cursor: justClicked ? "default" : "pointer", outline: "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 120, height: 120, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #555 0%, #1a1a1a 50%, #000 100%)",
              boxShadow: "0 6px 24px rgba(0,0,0,0.7), inset 0 2px 4px rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 88, height: 88, borderRadius: "50%",
                background: justClicked
                  ? "radial-gradient(circle at 35% 25%, #ff9999 0%, #cc0000 40%, #800000 100%)"
                  : "radial-gradient(circle at 35% 25%, #ff6666 0%, #e02020 45%, #a00000 100%)",
                boxShadow: justClicked
                  ? "0 2px 8px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(0,0,0,0.4), 0 0 20px rgba(255,60,60,0.8)"
                  : "0 6px 16px rgba(0,0,0,0.5), inset 0 4px 8px rgba(255,255,255,0.25), inset 0 -4px 8px rgba(0,0,0,0.3), 0 0 12px rgba(200,0,0,0.4)",
                transform: justClicked ? "scale(0.92) translateY(3px)" : "scale(1) translateY(0)",
                transition: "all 0.1s ease",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 28, filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))", animation: justClicked ? "shake 0.4s ease" : "none" }}>
                  {justClicked ? "🚨" : "🔔"}
                </span>
              </div>
            </div>
            <span style={{
              fontFamily: "'Courier New', monospace", fontWeight: 900,
              fontSize: "clamp(10px, 1.8vw, 14px)", letterSpacing: 2, textTransform: "uppercase",
              color: justClicked ? "#ff4444" : "#f5f0e8", textShadow: "0 1px 3px rgba(0,0,0,0.8)", transition: "color 0.15s",
            }}>
              {justClicked ? "ALARM RAISED!" : "RING THE ALARM"}
            </span>
          </button>
        </div>
      </div>

      {/* Recent Sightings Strip */}
      <div style={{ width: "100%", maxWidth: 720, zIndex: 1, marginTop: 16 }}>
        <div style={{
          background: "#2a1f0e", border: "2px solid #2a1f0e",
          padding: "12px 16px 0",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "#f5c518", textTransform: "uppercase", opacity: 0.8 }}>
              📸 Recent Sightings
            </div>
            <button onClick={goGallery} style={{
              fontFamily: "inherit", fontSize: 9, letterSpacing: 2, textTransform: "uppercase",
              background: "none", border: "1px solid rgba(245,197,24,0.4)", color: "#f5c518",
              padding: "4px 10px", cursor: "pointer",
            }}>
              View Full Gallery →
            </button>
          </div>

          {recentSightings.length === 0 ? (
            <div style={{ fontSize: 10, color: "#f5f0e8", opacity: 0.3, letterSpacing: 2, textAlign: "center", paddingBottom: 16 }}>
              NO SIGHTINGS YET — RING THE ALARM TO ADD ONE!
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, paddingBottom: 14 }}>
              {/* Fill empty slots so grid always shows 5 cells */}
              {Array.from({ length: RECENT_COUNT }).map((_, i) => {
                const s = recentSightings[i];
                return s ? (
                  <div
                    key={s.ts}
                    onClick={() => setLightbox(s)}
                    style={{
                      cursor: "pointer", border: "1px solid rgba(245,197,24,0.25)",
                      overflow: "hidden", aspectRatio: "16/9",
                      transition: "border-color 0.15s, transform 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#f5c518"; e.currentTarget.style.transform = "scale(1.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,197,24,0.25)"; e.currentTarget.style.transform = ""; }}
                  >
                    <img src={s.img} alt={`Sighting ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ) : (
                  <div key={i} style={{
                    border: "1px dashed rgba(245,197,24,0.15)", aspectRatio: "16/9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 14, opacity: 0.2 }}>🐝</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        width: "100%", maxWidth: 720, zIndex: 1,
        marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
      }}>
        {[{ n: "1", t: "Watch the stream" }, { n: "2", t: "Spot a wasp?" }, { n: "3", t: "Ring the alarm!" }].map(({ n, t }) => (
          <div key={n} style={{ border: "2px solid #2a1f0e", background: "#2a1f0e", padding: "14px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 26, height: 26, background: "#f5c518", color: "#2a1f0e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{n}</span>
            <span style={{ fontSize: 13, lineHeight: 1.3, fontWeight: 700, color: "#f5f0e8", letterSpacing: 1 }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, fontSize: 10, opacity: 0.35, letterSpacing: 2, textTransform: "uppercase", zIndex: 1 }}>
        Wasp Watch · Citizen Science · Live 24/7
      </div>

      {/* Lightbox for recent strip */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{
          position: "fixed", inset: 0, zIndex: 200, background: "rgba(26,18,9,0.93)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 680, width: "100%" }}>
            <img src={lightbox.img} alt="Sighting" style={{ width: "100%", display: "block", border: "2px solid #f5c518" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "#f5c518", letterSpacing: 1 }}>{new Date(lightbox.ts).toLocaleString()}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <a href={lightbox.img} download={`wasp-sighting-${lightbox.ts}.png`}
                  style={{ fontSize: 10, color: "#f5c518", letterSpacing: 2, textTransform: "uppercase", textDecoration: "none", opacity: 0.7 }}>
                  ↓ Download
                </a>
                <button onClick={() => setLightbox(null)} style={{
                  fontFamily: "inherit", fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
                  background: "none", border: "1px solid rgba(245,197,24,0.4)", color: "#f5c518", padding: "4px 10px", cursor: "pointer",
                }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.4;transform:scale(0.7);} }
        @keyframes pingOut { 0%{opacity:1;} 100%{opacity:0;} }
        @keyframes ripple { 0%{transform:scale(0.3);opacity:1;} 100%{transform:scale(2.5);opacity:0;} }
        @keyframes toastIn { 0%{opacity:0;transform:translateX(-50%) translateY(-12px);} 100%{opacity:1;transform:translateX(-50%) translateY(0);} }
        @keyframes shake { 0%,100%{transform:rotate(0deg);} 20%{transform:rotate(-20deg);} 40%{transform:rotate(20deg);} 60%{transform:rotate(-15deg);} 80%{transform:rotate(10deg);} }
      `}</style>
    </div>
  );
}

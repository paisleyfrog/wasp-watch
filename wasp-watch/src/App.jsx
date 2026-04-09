import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "wasp-doorbell-count";

export default function WaspDoorbell() {
  const [count, setCount] = useState(0);
  const [justClicked, setJustClicked] = useState(false);
  const [recentPings, setRecentPings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const pingId = useRef(0);

  // Load count from storage
  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, true);
        if (result) setCount(parseInt(result.value) || 0);
      } catch (e) {
        // key doesn't exist yet, start at 0
      }
      setLoaded(true);
    };
    load();

    // Poll for updates every 3 seconds
    const interval = setInterval(async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, true);
        if (result) setCount(parseInt(result.value) || 0);
      } catch (e) { }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSpotted = async () => {
    if (justClicked) return;
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 1200);

    const newCount = count + 1;
    setCount(newCount);

    // Add a ping animation
    const id = pingId.current++;
    const ping = {
      id,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
    };
    setRecentPings((prev) => [...prev, ping]);
    setTimeout(() => {
      setRecentPings((prev) => prev.filter((p) => p.id !== id));
    }, 1000);

    try {
      await window.storage.set(STORAGE_KEY, String(newCount), true);
    } catch (e) { }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f0e8",
      fontFamily: "'Courier New', Courier, monospace",
      color: "#2a1f0e",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "0 16px 40px",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Grain texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Header */}
      <header style={{
        width: "100%", maxWidth: 720, paddingTop: 36, paddingBottom: 8,
        borderBottom: "2px solid #2a1f0e", marginBottom: 28, zIndex: 1,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", opacity: 0.5, marginBottom: 4, color: "#2a1f0e" }}>
            Live Observation
          </div>
          <h1 style={{ margin: 0, fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 700, lineHeight: 1, letterSpacing: -1, color: "#2a1f0e" }}>
            🐝 Wasp Watch
          </h1>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, opacity: 0.45, lineHeight: 1.6 }}>
          CITIZEN<br />SCIENCE<br />PROJECT
        </div>
      </header>

      {/* Live badge + stream */}
      <div style={{ width: "100%", maxWidth: 720, zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#c0392b", color: "#fff",
            fontSize: 10, fontWeight: 700, letterSpacing: 2,
            padding: "3px 8px", textTransform: "uppercase",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "#fff",
              display: "inline-block",
              animation: "pulse 1.2s ease-in-out infinite",
            }} />
            LIVE
          </span>
          <span style={{ fontSize: 11, opacity: 0.45 }}>
            Backyard — Window cam
          </span>
        </div>

        {/* Video container */}
        <div style={{
          width: "100%",
          aspectRatio: "16/9",
          background: "#1a1209",
          border: "2px solid #2a1f0e",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Replace the src below with your actual webcam stream URL */}
          <iframe width="560" height="315" src="https://www.youtube.com/embed/wCbbLlFWy1o?si=lIgOQLxWuT9Pya3i" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen/>
        
          
            </div>
          </div>

          {/* Placeholder overlay — remove once stream is wired up */}
       
            

          {/* Ping animations */}
          {recentPings.map((p) => (
            <div key={p.id} style={{
              position: "absolute",
              left: `${p.x}%`, top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              animation: "pingOut 0.9s ease-out forwards",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "2px solid #f5c518",
                animation: "ripple 0.9s ease-out forwards",
              }} />
            </div>
          ))}
        
        

           {/* Counter + Button */}
     
      <div style={{
        width: "100%", maxWidth: 720, zIndex: 1,
        display: "flex", alignItems: "stretch", gap: 0,
        marginTop: 20, border: "2px solid #2a1f0e",
      }}>
        {/* Counter */}
        <div style={{
          flex: 1, background: "#2a1f0e", color: "#f5f0e8",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "20px 24px",
        }}>
          <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, marginBottom: 6 }}>
            Wasps spotted
          </div>
          <div style={{
            fontSize: "clamp(48px, 10vw, 80px)",
            fontWeight: 700, lineHeight: 1,
            letterSpacing: -2,
            transition: "transform 0.15s",
            transform: justClicked ? "scale(1.12)" : "scale(1)",
            color: "#f5c518",
          }}>
            {loaded ? count.toLocaleString() : "—"}
          </div>
          <div style={{ fontSize: 10, opacity: 0.35, marginTop: 4 }}>all time · shared counter</div>
        </div>

        {/* Button */}
        <button
          onClick={handleSpotted}
          disabled={justClicked}
          style={{
            flex: 1, border: "none", borderLeft: "2px solid #2a1f0e",
            background: justClicked ? "#e8a800" : "#f5c518",
            color: "#2a1f0e", cursor: justClicked ? "default" : "pointer",
            fontFamily: "inherit", fontWeight: 700,
            fontSize: "clamp(13px, 2.5vw, 17px)",
            letterSpacing: 1, textTransform: "uppercase",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "20px 16px", gap: 6,
            transition: "background 0.15s, transform 0.1s",
            transform: justClicked ? "scale(0.97)" : "scale(1)",
          }}
        >
          <span style={{ fontSize: 32 }}>{justClicked ? "✅" : "🐝"}</span>
          <span>{justClicked ? "Logged!" : "I see a wasp!"}</span>
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        width: "100%", maxWidth: 720, zIndex: 1,
        marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 12,
      }}>
        {[
          { n: "1", t: "Watch the stream" },
          { n: "2", t: "Spot a wasp?" },
          { n: "3", t: "Press the button!" },
        ].map(({ n, t }) => (
          <div key={n} style={{
            border: "1.5px solid #2a1f0e", padding: "12px 14px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              width: 22, height: 22, background: "#2a1f0e", color: "#f5f0e8",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>{n}</span>
            <span style={{ fontSize: 12, lineHeight: 1.3 }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
  <div style={{
        marginTop: 32, fontSize: 10, opacity: 0.35, letterSpacing: 2,
        textTransform: "uppercase", zIndex: 1,
      }}>
        Wasp Watch · Citizen Science · Live 24/7
      </div>
 
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes pingOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes ripple {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "wasp-doorbell-count";
const TODAY_KEY = "wasp-doorbell-today";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function WaspDoorbell() {
  const [count, setCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [justClicked, setJustClicked] = useState(false);
  const [recentPings, setRecentPings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const pingId = useRef(0);
  const toastTimeout = useRef(null);

  const loadCounts = async () => {
    try {
      const result = await window.storage.get(STORAGE_KEY, true);
      if (result) setCount(parseInt(result.value) || 0);
    } catch (e) {}
    try {
      const todayStr = getTodayStr();
      const result = await window.storage.get(TODAY_KEY + "-" + todayStr, true);
      if (result) setTodayCount(parseInt(result.value) || 0);
    } catch (e) {}
    setLoaded(true);
  };

  useEffect(() => {
    loadCounts();
    const interval = setInterval(loadCounts, 3000);
    return () => clearInterval(interval);
  }, []);

  const takeScreenshot = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1209";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#f5c518";
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.font = "64px serif";
    ctx.textAlign = "center";
    ctx.fillText("🐝", canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = "#f5c518";
    ctx.font = "bold 22px Courier New";
    ctx.fillText("⚠ WASP SPOTTED!", canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "14px Courier New";
    ctx.fillText(new Date().toLocaleString(), canvas.width / 2, canvas.height / 2 + 60);
    ctx.font = "11px Courier New";
    ctx.fillStyle = "#f5c518";
    ctx.globalAlpha = 0.5;
    ctx.fillText("waspwatch.com", canvas.width / 2, canvas.height - 20);
    setScreenshot(canvas.toDataURL("image/png"));
  };

  const handleSpotted = async () => {
    if (justClicked) return;
    setJustClicked(true);
    setTimeout(() => setJustClicked(false), 1400);

    const newCount = count + 1;
    const newToday = todayCount + 1;
    setCount(newCount);
    setTodayCount(newToday);

    const id = pingId.current++;
    setRecentPings((prev) => [...prev, {
      id,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
    }]);
    setTimeout(() => {
      setRecentPings((prev) => prev.filter((p) => p.id !== id));
    }, 1000);

    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast(newToday);
    toastTimeout.current = setTimeout(() => setToast(null), 3500);

    takeScreenshot();

    try {
      await window.storage.set(STORAGE_KEY, String(newCount), true);
      const todayStr = getTodayStr();
      await window.storage.set(TODAY_KEY + "-" + todayStr, String(newToday), true);
    } catch (e) {}
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

      {/* Grain overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      {/* Toast popup */}
      {toast !== null && (
        <div style={{
          position: "fixed", top: 24, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          background: "#2a1f0e", color: "#f5c518",
          padding: "16px 32px",
          border: "2px solid #f5c518",
          fontWeight: 700,
          fontSize: "clamp(13px, 3vw, 18px)",
          letterSpacing: 1, textAlign: "center",
          animation: "toastIn 0.3s ease-out",
          boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
          whiteSpace: "nowrap",
        }}>
          🐝 You've spotted <span style={{ color: "#fff", fontSize: "1.2em" }}>{toast}</span> wasp{toast !== 1 ? "s" : ""} today!
        </div>
      )}

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
        <div style={{ textAlign: "right", fontSize: 11, opacity: 0.45, lineHeight: 1.6, color: "#2a1f0e" }}>
          CITIZEN<br />SCIENCE<br />PROJECT
        </div>
      </header>

      {/* Stream */}
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
          <span style={{ fontSize: 11, opacity: 0.45 }}>Backyard — Window cam</span>
        </div>

        <div style={{
          width: "100%", aspectRatio: "16/9",
          background: "#1a1209", border: "2px solid #2a1f0e",
          position: "relative", overflow: "hidden",
        }}>
         <iframe width="560" height="315" src="https://www.youtube.com/embed/9bS__Wt2ZGk?si=hIDQWjR6LcUBK_Fh&amp;controls=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

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
        </div>
      </div>

      {/* Counter + 3D Button */}
      <div style={{
        width: "100%", maxWidth: 720, zIndex: 1,
        display: "flex", alignItems: "stretch",
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
            fontWeight: 700, lineHeight: 1, letterSpacing: -2,
            transition: "transform 0.15s",
            transform: justClicked ? "scale(1.12)" : "scale(1)",
            color: "#f5c518",
          }}>
            {loaded ? count.toLocaleString() : "—"}
          </div>
          <div style={{ fontSize: 10, opacity: 0.35, marginTop: 4 }}>all time · shared</div>
          {loaded && (
            <div style={{ fontSize: 12, color: "#f5c518", opacity: 0.65, marginTop: 8, letterSpacing: 1 }}>
              {todayCount} today
            </div>
          )}
        </div>

        {/* 3D Button */}
        <div style={{
          flex: 1, borderLeft: "2px solid #2a1f0e",
          background: "#e8d5a0",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px 20px",
        }}>
          <button
            onClick={handleSpotted}
            disabled={justClicked}
            style={{
              width: "100%",
              fontFamily: "inherit",
              fontWeight: 900,
              fontSize: "clamp(12px, 2.2vw, 17px)",
              letterSpacing: 2,
              textTransform: "uppercase",
              color: justClicked ? "#6b4a00" : "#1a0f00",
              background: justClicked
                ? "linear-gradient(180deg, #c8860a 0%, #a86e08 100%)"
                : "linear-gradient(180deg, #ffe680 0%, #f5c518 35%, #d4a017 100%)",
              border: "none",
              borderRadius: 8,
              padding: "20px 14px",
              cursor: justClicked ? "default" : "pointer",
              boxShadow: justClicked
                ? "0 2px 0 #6b4000, inset 0 2px 4px rgba(0,0,0,0.2)"
                : "0 7px 0 #8a6000, 0 9px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.6)",
              transform: justClicked ? "translateY(5px)" : "translateY(0)",
              transition: "all 0.1s ease",
              display: "flex", flexDirection: "column",
              alignItems: "center", gap: 10,
              outline: "none",
            }}
          >
            <span style={{
              fontSize: 40,
              display: "block",
              animation: justClicked ? "shake 0.4s ease" : "bellRing 3s ease-in-out infinite",
              transformOrigin: "top center",
            }}>
              {justClicked ? "🚨" : "🔔"}
            </span>
            <span>{justClicked ? "ALARM RAISED!" : "RING THE ALARM"}</span>
          </button>
        </div>
      </div>

      {/* Screenshot panel */}
      {screenshot && (
        <div style={{
          width: "100%", maxWidth: 720, zIndex: 1,
          marginTop: 16, border: "2px solid #2a1f0e",
          background: "#2a1f0e", padding: 14,
          animation: "toastIn 0.3s ease-out",
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, color: "#f5c518", textTransform: "uppercase", marginBottom: 10, opacity: 0.8 }}>
            📸 Last sighting — {new Date().toLocaleTimeString()}
          </div>
          <img src={screenshot} alt="Last wasp sighting" style={{
            width: "100%", display: "block",
            border: "1px solid rgba(245,197,24,0.3)",
          }} />
          <a
            href={screenshot}
            download={`wasp-sighting-${Date.now()}.png`}
            style={{
              display: "inline-block", marginTop: 10,
              fontSize: 10, color: "#f5c518", letterSpacing: 2,
              textTransform: "uppercase", textDecoration: "none", opacity: 0.6,
            }}
          >
            ↓ Download snapshot
          </a>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        width: "100%", maxWidth: 720, zIndex: 1,
        marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
      }}>
        {[
          { n: "1", t: "Watch the stream" },
          { n: "2", t: "Spot a wasp?" },
          { n: "3", t: "Ring the alarm!" },
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

      <div style={{ marginTop: 32, fontSize: 10, opacity: 0.35, letterSpacing: 2, textTransform: "uppercase", zIndex: 1 }}>
        Wasp Watch · Citizen Science · Live 24/7
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @keyframes pingOut {
          0% { opacity: 1; } 100% { opacity: 0; }
        }
        @keyframes ripple {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes toastIn {
          0% { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes bellRing {
          0%, 80%, 100% { transform: rotate(0deg); }
          83% { transform: rotate(-18deg); }
          86% { transform: rotate(18deg); }
          89% { transform: rotate(-12deg); }
          92% { transform: rotate(12deg); }
          95% { transform: rotate(-6deg); }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-20deg); }
          40% { transform: rotate(20deg); }
          60% { transform: rotate(-15deg); }
          80% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
}

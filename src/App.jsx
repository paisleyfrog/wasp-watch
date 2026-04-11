<div style={{
  width: "100%", aspectRatio: "16/9",
  background: "#1a1209", border: "2px solid #2a1f0e",
  position: "relative", overflow: "hidden",
}}>
  <iframe
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    src="https://www.youtube.com/embed/_qeVtOgvewk?si=T6LeCw6mpAgYb2mW"
    title="YouTube video player"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />

  {/* ✅ Pings now correctly inside the relative container */}
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
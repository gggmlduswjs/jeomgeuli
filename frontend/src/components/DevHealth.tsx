export default function DevHealth() {
  if (!import.meta.env.DEV) return null;
  return (
    <div style={{
      position: "fixed", right: 8, bottom: 8, zIndex: 9999,
      background: "rgba(49,130,246,0.1)", color: "#1e1e1e",
      padding: "6px 10px", borderRadius: 10, border: "1px solid rgba(49,130,246,0.3)"
    }}>
      🔍 DEV Health Check
    </div>
  );
}


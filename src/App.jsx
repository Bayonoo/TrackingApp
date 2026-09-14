import { useState, useRef } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// ─── Font & Theme ─────────────────────────────────────────────────────────────

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif";
const NAV_BLUE = "#0A84FF"; // iOS system blue, used for bottom nav / neutral UI

function bgGradient(accentHex) {
  return `radial-gradient(circle at 50% -10%, ${accentHex}33, transparent 60%), linear-gradient(180deg, #060B14 0%, #0A121F 55%, #05090F 100%)`;
}
const HOME_BG =
  "radial-gradient(circle at 20% -8%, #2DD4BF22, transparent 55%), radial-gradient(circle at 82% 0%, #38BDF822, transparent 55%), radial-gradient(circle at 50% 35%, #A78BFA18, transparent 60%), linear-gradient(180deg, #050B14 0%, #0A121F 55%, #05090F 100%)";
function cardGradient(accentHex) {
  return `linear-gradient(135deg, ${accentHex}28, rgba(9,15,26,0.78))`;
}

// ─── Types (informal) ─────────────────────────────────────────────────────────
// SavingsEntry:  { id, month, amount, note, kind: "deposit" | "withdraw" }
// InvestEntry:   { id, asset, assetType, amount, date, kind: "deposit" | "withdraw" }
// AssetDef:      { name, type }
// WorkoutSession:{ id, day, type, kcal, detail, date }

// ─── Constants ────────────────────────────────────────────────────────────────

const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const CURRENT_YEAR = 2025;
const YEARS = [2024, 2025, 2026];
const WEEK_DAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const INVEST_TYPES = [
  { label: "หุ้นไทย", color: "#38BDF8" },
  { label: "หุ้นต่างประเทศ", color: "#818CF8" },
  { label: "กองทุน", color: "#34D399" },
  { label: "คริปโต", color: "#F59E0B" },
  { label: "พันธบัตร", color: "#FB7185" },
];

const MUSCLE_GROUPS = ["อก", "หลัง", "ไหล่", "แขน", "ขา", "แกน"];

// ─── Icons ────────────────────────────────────────────────────────────────────

function MoneyIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="9" width="24" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 13h3M25 13h3M4 19h3M25 19h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InvestIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <polyline points="4,24 10,16 15,20 22,10 28,8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="23,8 28,8 28,13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExerciseIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 11v8M13 15l-3 4M19 15l3 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="14" width="5" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <rect x="25" y="14" width="5" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="15.25" x2="12" y2="15.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="15.25" x2="25" y2="15.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Workout type dot
function WorkoutDot({ type, accent, size = 44 }) {
  const cfg = {
    run: { bg: `${accent}25`, content: <span style={{ fontSize: size * 0.38 }}>🏃</span> },
    cycle: { bg: "#818CF825", content: <span style={{ fontSize: size * 0.38 }}>🚴</span> },
    weights: { bg: "#34D39925", content: <span style={{ fontSize: size * 0.38 }}>🏋️</span> },
    rest: { bg: "rgba(255,255,255,0.05)", content: <span style={{ fontSize: size * 0.3, color: "rgba(255,255,255,0.25)", fontWeight: 700, letterSpacing: "-1px" }}>zzz</span> },
  };
  const c = cfg[type];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: c.bg, border: type !== "rest" ? `1.5px solid ${type === "run" ? accent : type === "cycle" ? "#818CF8" : "#34D399"}50` : "1.5px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {c.content}
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const S = {
  input: { background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", padding: "12px 14px", fontSize: "15px", outline: "none", width: "100%", fontFamily: FONT },
  label: { fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px", display: "block" },
  section: { background: "rgba(255,255,255,0.045)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "18px", padding: "16px", marginBottom: "12px", border: "1px solid rgba(255,255,255,0.07)" },
};

function NavBar({ title, accent, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 24px 8px" }}>
      <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "10px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: accent, flexShrink: 0 }}>
        <BackIcon />
      </button>
      <h1 style={{ fontFamily: FONT, fontSize: "22px", fontWeight: 700, letterSpacing: "-0.01em", color: "#fff", margin: 0 }}>{title}</h1>
    </div>
  );
}

function ProgressBar({ value, accent }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall Progress</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: accent }}>{value}%</span>
      </div>
      <div style={{ height: "4px", borderRadius: "3px", background: "rgba(255,255,255,0.1)" }}>
        <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, value))}%`, borderRadius: "3px", background: accent, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

function SubmitButton({ label, accent, onClick }) {
  return (
    <button onClick={onClick} style={{ width: "100%", padding: "15px", borderRadius: "14px", background: accent, color: "#0A0A0F", border: "none", cursor: "pointer", fontFamily: FONT, fontWeight: 700, fontSize: "14px", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "8px" }}
      onMouseDown={(e) => (e.currentTarget.style.opacity = "0.8")}
      onMouseUp={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {label}
    </button>
  );
}

function Toast({ message, accent }) {
  return (
    <div style={{ position: "fixed", top: "60px", left: "50%", transform: "translateX(-50%)", background: accent, color: "#0A0A0F", padding: "10px 20px", borderRadius: "20px", fontWeight: 700, fontSize: "13px", zIndex: 200, whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
      {message}
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ height: "44px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", flexShrink: 0 }}>
      <span>9:41</span>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor" opacity="0.4" />
          <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="currentColor" opacity="0.6" />
          <rect x="9" y="2" width="3" height="10" rx="0.5" fill="currentColor" opacity="0.8" />
          <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" fill="currentColor" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" />
          <rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor" />
          <path d="M23 4.5V7.5C23.8 7.2 24.5 6.7 24.5 6C24.5 5.3 23.8 4.8 23 4.5Z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  );
}

// Long-press wrapper — each instance owns its own timer (safe inside .map())
function LongPressRow({ onLongPress, children, style, ms = 550 }) {
  const timerRef = useRef(null);
  const start = () => { timerRef.current = setTimeout(onLongPress, ms); };
  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current); };
  return (
    <div
      style={{ ...style, userSelect: "none", WebkitUserSelect: "none", touchAction: "manipulation", cursor: "pointer" }}
      onMouseDown={start} onMouseUp={clear} onMouseLeave={clear}
      onTouchStart={start} onTouchEnd={clear}
    >
      {children}
    </div>
  );
}

// Delete confirmation sheet
function ConfirmSheet({ title, message, confirmLabel = "ลบ", onConfirm, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 220, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "300px", background: "rgba(22,26,38,0.92)", backdropFilter: "blur(24px)", borderRadius: "20px", padding: "22px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginBottom: message ? "6px" : "16px", fontFamily: FONT }}>{title}</div>
        {message && <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "18px" }}>{message}</div>}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.7)", fontFamily: FONT, fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "#FB7185", border: "none", color: "#2a0a10", fontFamily: FONT, fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.3)" }}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>{icon}</div>
      <div style={{ fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "12px" }}>{subtitle}</div>}
    </div>
  );
}

// ─── Month Picker Sheet ───────────────────────────────────────────────────────

function MonthPickerSheet({ accent, selected, onSelect, onClose }) {
  const [tempMonth, setTempMonth] = useState(selected.month);
  const [tempYear, setTempYear] = useState(selected.year);
  const ITEM_H = 44;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "430px", background: "rgba(18,22,32,0.96)", backdropFilter: "blur(24px)", borderRadius: "24px 24px 0 0", padding: "0 0 40px", borderTop: `2px solid ${accent}30` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ padding: "16px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff", fontFamily: FONT }}>เลือกเดือน</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "22px", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "flex", position: "relative", margin: "0 24px" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: `${ITEM_H}px`, transform: "translateY(-50%)", background: `${accent}15`, borderRadius: "10px", border: `1px solid ${accent}30`, pointerEvents: "none", zIndex: 1 }} />
          <div style={{ flex: 2, height: `${ITEM_H * 5}px`, overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: "none" }}>
            <div style={{ height: `${ITEM_H * 2}px` }} />
            {THAI_MONTHS.map((m, i) => (
              <div key={i} onClick={() => setTempMonth(i + 1)} style={{ height: `${ITEM_H}px`, display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", cursor: "pointer", fontSize: "16px", fontWeight: tempMonth === i + 1 ? 700 : 400, color: tempMonth === i + 1 ? accent : "rgba(255,255,255,0.5)" }}>
                {m}
              </div>
            ))}
            <div style={{ height: `${ITEM_H * 2}px` }} />
          </div>
          <div style={{ flex: 1, height: `${ITEM_H * 5}px`, overflowY: "scroll", scrollSnapType: "y mandatory", scrollbarWidth: "none" }}>
            <div style={{ height: `${ITEM_H * 2}px` }} />
            {YEARS.map((y) => (
              <div key={y} onClick={() => setTempYear(y)} style={{ height: `${ITEM_H}px`, display: "flex", alignItems: "center", justifyContent: "center", scrollSnapAlign: "center", cursor: "pointer", fontSize: "16px", fontWeight: tempYear === y ? 700 : 400, color: tempYear === y ? accent : "rgba(255,255,255,0.5)" }}>
                {y}
              </div>
            ))}
            <div style={{ height: `${ITEM_H * 2}px` }} />
          </div>
        </div>
        <div style={{ padding: "16px 24px 0" }}>
          <SubmitButton label={`เลือก ${THAI_MONTHS[tempMonth - 1]} ${tempYear}`} accent={accent} onClick={() => { onSelect(tempMonth, tempYear); onClose(); }} />
        </div>
      </div>
    </div>
  );
}

// ─── Kcal Goal Sheet ──────────────────────────────────────────────────────────

function KcalGoalSheet({ accent, current, onSave, onClose }) {
  const [val, setVal] = useState(String(current));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "430px", background: "rgba(18,22,32,0.96)", backdropFilter: "blur(24px)", borderRadius: "24px 24px 0 0", padding: "0 24px 40px", borderTop: `2px solid ${accent}30` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff", fontFamily: FONT }}>ตั้งเป้า Kcal สัปดาห์นี้</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "22px" }}>×</button>
        </div>
        <label style={S.label}>เป้าหมาย (Kcal / สัปดาห์)</label>
        <input type="number" value={val} onChange={(e) => setVal(e.target.value)} style={{ ...S.input, fontSize: "22px", fontWeight: 700, color: accent, textAlign: "center" }} autoFocus />
        <SubmitButton label="บันทึกเป้าหมาย" accent={accent} onClick={() => { const n = parseInt(val); if (n > 0) { onSave(n); onClose(); } }} />
      </div>
    </div>
  );
}

// ─── Mode toggle (deposit / withdraw) ────────────────────────────────────────

function ModeToggle({ mode, onChange, accent, depositLabel, withdrawLabel }) {
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
      <button onClick={() => onChange("deposit")} style={{ flex: 1, padding: "9px 0", borderRadius: "10px", border: mode === "deposit" ? `1.5px solid ${accent}` : "1.5px solid rgba(255,255,255,0.1)", background: mode === "deposit" ? `${accent}18` : "transparent", color: mode === "deposit" ? accent : "rgba(255,255,255,0.4)", fontWeight: mode === "deposit" ? 700 : 400, fontSize: "12px", cursor: "pointer", fontFamily: FONT }}>
        {depositLabel}
      </button>
      <button onClick={() => onChange("withdraw")} style={{ flex: 1, padding: "9px 0", borderRadius: "10px", border: mode === "withdraw" ? "1.5px solid #FB7185" : "1.5px solid rgba(255,255,255,0.1)", background: mode === "withdraw" ? "#FB718518" : "transparent", color: mode === "withdraw" ? "#FB7185" : "rgba(255,255,255,0.4)", fontWeight: mode === "withdraw" ? 700 : 400, fontSize: "12px", cursor: "pointer", fontFamily: FONT }}>
        {withdrawLabel}
      </button>
    </div>
  );
}

function EditTargetSheet({ accent, title, unit, current, onSave, onClose }) {
  const [val, setVal] = useState(String(current));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "430px", background: "rgba(18,22,32,0.96)", backdropFilter: "blur(24px)", borderRadius: "24px 24px 0 0", padding: "0 24px 40px", borderTop: `2px solid ${accent}30` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}><div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#fff", fontFamily: FONT }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "22px" }}>×</button>
        </div>
        <label style={S.label}>เป้าหมาย{unit ? ` (${unit})` : ""}</label>
        <input type="number" value={val} onChange={(e) => setVal(e.target.value)} style={{ ...S.input, fontSize: "22px", fontWeight: 700, color: accent, textAlign: "center" }} autoFocus />
        <SubmitButton label="บันทึกเป้าหมาย" accent={accent} onClick={() => { const n = parseFloat(val); if (n > 0) { onSave(n); onClose(); } }} />
      </div>
    </div>
  );
}

// ─── Money Screen ─────────────────────────────────────────────────────────────

function MoneyScreen({ onBack }) {
  const accent = "#2DD4BF";
  const now = new Date();
  const [mode, setMode] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [entries, setEntries] = useState([]);
  const nextId = useRef(1);
  const [toast, setToast] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [target, setTarget] = useState(500000);
  const [showTargetSheet, setShowTargetSheet] = useState(false);
  const total = entries.reduce((s, e) => s + (e.kind === "withdraw" ? -e.amount : e.amount), 0);
  const progress = Math.min(100, Math.max(0, Math.round((total / target) * 100)));

  function handleSave() {
    const n = parseFloat(amount.replace(/,/g, ""));
    if (!n || n <= 0) return;
    const label = `${THAI_MONTHS[selectedMonth - 1]} ${selectedYear}`;
    setEntries((prev) => [...prev, { id: nextId.current++, month: label, amount: n, note, kind: mode }]);
    setAmount(""); setNote("");
    setToast(mode === "deposit" ? `+€${n.toLocaleString()} บันทึกแล้ว` : `-€${n.toLocaleString()} ถอนแล้ว`);
    setTimeout(() => setToast(""), 2500);
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmId(null);
  }

  const confirmEntry = entries.find((e) => e.id === confirmId);

  return (
    <div style={{ minHeight: "100%", background: bgGradient(accent), color: "#fff", fontFamily: FONT, maxWidth: "430px", margin: "0 auto", paddingBottom: "40px" }}>
      {toast && <Toast message={toast} accent={accent} />}
      {showMonthPicker && <MonthPickerSheet accent={accent} selected={{ month: selectedMonth, year: selectedYear }} onSelect={(m, y) => { setSelectedMonth(m); setSelectedYear(y); }} onClose={() => setShowMonthPicker(false)} />}
      {confirmEntry && (
        <ConfirmSheet
          title="ลบรายการนี้?"
          message={`${confirmEntry.month} · ${confirmEntry.kind === "withdraw" ? "-" : "+"}€${confirmEntry.amount.toLocaleString()}`}
          onConfirm={() => handleDelete(confirmId)}
          onClose={() => setConfirmId(null)}
        />
      )}
      {showTargetSheet && <EditTargetSheet accent={accent} title="ตั้งเป้าหมายการออม" unit="ยูโร" current={target} onSave={setTarget} onClose={() => setShowTargetSheet(false)} />}
      <StatusBar />
      <NavBar title="Money Goal" accent={accent} onBack={onBack} />
      <div style={{ padding: "12px 24px" }}>
        <div style={{ background: cardGradient(accent), backdropFilter: "blur(20px)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: `1px solid ${accent}25` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <div style={S.label}>ออมแล้ว</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: accent }}>€{total.toLocaleString()}</div>
            </div>
            <button onClick={() => setShowTargetSheet(true)} style={{ textAlign: "right", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{ ...S.label, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>เป้าหมาย <span style={{ fontSize: "10px", opacity: 0.7 }}>✎</span></div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>€{target.toLocaleString()}</div>
            </button>
          </div>
          <ProgressBar value={progress} accent={accent} />
        </div>
        <div style={S.section}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <MoneyIcon size={18} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>เพิ่มรายการ</span>
          </div>
          <ModeToggle mode={mode} onChange={setMode} accent={accent} depositLabel="ฝากเงิน" withdrawLabel="ถอนเงิน" />
          <div style={{ marginBottom: "12px" }}>
            <label style={S.label}>เดือน</label>
            <button onClick={() => setShowMonthPicker(true)} style={{ ...S.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", border: `1px solid ${accent}40` }}>
              <span style={{ color: accent, fontWeight: 600 }}>{THAI_MONTHS[selectedMonth - 1]} {selectedYear}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke={accent} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={S.label}>จำนวนเงิน (ยูโร)</label>
            <input type="number" placeholder="เช่น 500" value={amount} onChange={(e) => setAmount(e.target.value)} style={S.input} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={S.label}>หมายเหตุ (ถ้ามี)</label>
            <input type="text" placeholder={mode === "deposit" ? "เช่น โบนัสประจำเดือน" : "เช่น ถอนไปจ่ายค่าเช่า"} value={note} onChange={(e) => setNote(e.target.value)} style={S.input} />
          </div>
          <SubmitButton label={mode === "deposit" ? "บันทึกยอดออม" : "บันทึกการถอนเงิน"} accent={mode === "deposit" ? accent : "#FB7185"} onClick={handleSave} />
        </div>
        <div style={S.section}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>ประวัติ <span style={{ opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>· กดค้างเพื่อลบ</span></div>
          {entries.length === 0 && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px", padding: "16px 0" }}>ยังไม่มีรายการ</div>}
          {[...entries].reverse().map((e, i) => (
            <LongPressRow key={e.id} onLongPress={() => setConfirmId(e.id)}>
              <div style={{ padding: "10px 0", borderBottom: i < entries.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{e.month}</span>
                    <div style={{ fontSize: "11px", color: e.kind === "withdraw" ? "#FB7185" : "rgba(255,255,255,0.35)", marginTop: "2px" }}>{e.note || (e.kind === "withdraw" ? "ถอนเงิน" : "")}</div>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: e.kind === "withdraw" ? "#FB7185" : accent, marginLeft: "12px" }}>{e.kind === "withdraw" ? "-" : "+"}€{e.amount.toLocaleString()}</span>
                </div>
              </div>
            </LongPressRow>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Investment ───────────────────────────────────────────────────────────────

function AddAssetSheet({ accent, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [type, setType] = useState(INVEST_TYPES[0].label);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} />
      <div style={{ position: "relative", width: "100%", maxWidth: "430px", background: "rgba(18,22,32,0.96)", backdropFilter: "blur(24px)", borderRadius: "24px 24px 0 0", padding: "0 24px 40px", borderTop: `2px solid ${accent}30` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0" }}><div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.15)" }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "#fff", fontFamily: FONT }}>เพิ่มสินทรัพย์ใหม่</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: "22px" }}>×</button>
        </div>
        <div style={{ marginBottom: "14px" }}>
          <label style={S.label}>ชื่อ / สัญลักษณ์</label>
          <input type="text" placeholder="เช่น PTT, BTC, K-EQUITY" value={name} onChange={(e) => setName(e.target.value)} style={S.input} autoFocus />
        </div>
        <div style={{ marginBottom: "16px" }}>
          <label style={S.label}>ประเภทสินทรัพย์</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {INVEST_TYPES.map((t) => (
              <button key={t.label} onClick={() => setType(t.label)} style={{ padding: "6px 12px", borderRadius: "20px", border: type === t.label ? `1.5px solid ${t.color}` : "1.5px solid rgba(255,255,255,0.12)", background: type === t.label ? `${t.color}22` : "transparent", color: type === t.label ? t.color : "rgba(255,255,255,0.5)", fontSize: "12px", cursor: "pointer", fontFamily: FONT }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <SubmitButton label="เพิ่มสินทรัพย์" accent={accent} onClick={() => { if (name.trim()) { onAdd({ name: name.trim().toUpperCase(), type }); onClose(); } }} />
      </div>
    </div>
  );
}

function InvestmentScreen({ onBack }) {
  const accent = "#38BDF8";
  const [mode, setMode] = useState("deposit");
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [amount, setAmount] = useState("");
  const [entries, setEntries] = useState([]);
  const nextId = useRef(1);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [toast, setToast] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [target, setTarget] = useState(200000);
  const [showTargetSheet, setShowTargetSheet] = useState(false);
  const total = entries.reduce((s, e) => s + (e.kind === "withdraw" ? -e.amount : e.amount), 0);
  const progress = Math.min(100, Math.max(0, Math.round((total / target) * 100)));
  const pieData = INVEST_TYPES.map((t) => ({
    name: t.label,
    value: entries.filter((e) => e.assetType === t.label).reduce((s, e) => s + (e.kind === "withdraw" ? -e.amount : e.amount), 0),
    color: t.color,
  })).filter((d) => d.value > 0);
  const selectedType = selectedAsset ? INVEST_TYPES.find((t) => t.label === selectedAsset.type) : null;

  function handleSave() {
    if (!selectedAsset) return;
    const n = parseFloat(amount.replace(/,/g, ""));
    if (!n || n <= 0) return;
    const date = `${THAI_MONTHS[new Date().getMonth()]} ${CURRENT_YEAR}`;
    setEntries((prev) => [...prev, { id: nextId.current++, asset: selectedAsset.name, assetType: selectedAsset.type, amount: n, date, kind: mode }]);
    setAmount("");
    setToast(mode === "deposit" ? `${selectedAsset.name} บันทึกแล้ว` : `ขาย/ถอน ${selectedAsset.name} แล้ว`);
    setTimeout(() => setToast(""), 2500);
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setConfirmId(null);
  }

  const confirmEntry = entries.find((e) => e.id === confirmId);

  return (
    <div style={{ minHeight: "100%", background: bgGradient(accent), color: "#fff", fontFamily: FONT, maxWidth: "430px", margin: "0 auto", paddingBottom: "40px" }}>
      {toast && <Toast message={toast} accent={accent} />}
      {showAddAsset && <AddAssetSheet accent={accent} onAdd={(a) => { setAssets((p) => [...p, a]); setSelectedAsset(a); }} onClose={() => setShowAddAsset(false)} />}
      {confirmEntry && (
        <ConfirmSheet
          title="ลบรายการนี้?"
          message={`${confirmEntry.asset} · ${confirmEntry.kind === "withdraw" ? "-" : "+"}€${confirmEntry.amount.toLocaleString()}`}
          onConfirm={() => handleDelete(confirmId)}
          onClose={() => setConfirmId(null)}
        />
      )}
      {showTargetSheet && <EditTargetSheet accent={accent} title="ตั้งเป้าหมายพอร์ต" unit="ยูโร" current={target} onSave={setTarget} onClose={() => setShowTargetSheet(false)} />}
      <StatusBar />
      <NavBar title="Investment" accent={accent} onBack={onBack} />
      <div style={{ padding: "12px 24px" }}>
        <div style={{ background: cardGradient(accent), backdropFilter: "blur(20px)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: `1px solid ${accent}25` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <div><div style={S.label}>พอร์ตรวม</div><div style={{ fontSize: "28px", fontWeight: 700, color: accent }}>€{total.toLocaleString()}</div></div>
            <button onClick={() => setShowTargetSheet(true)} style={{ textAlign: "right", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{ ...S.label, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>เป้าหมาย <span style={{ fontSize: "10px", opacity: 0.7 }}>✎</span></div>
              <div style={{ fontSize: "20px", fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>€{target.toLocaleString()}</div>
            </button>
          </div>
          <ProgressBar value={progress} accent={accent} />
        </div>
        <div style={{ ...S.section, padding: "20px" }}>
          <div style={S.label}>สัดส่วนสินทรัพย์</div>
          {pieData.length === 0 ? (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px", padding: "20px 0" }}>ยังไม่มีข้อมูล</div>
          ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#111827", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} formatter={(v) => [`€${v.toLocaleString()}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: d.color }} />
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: d.color }}>{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
        <div style={S.section}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <InvestIcon size={18} />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>บันทึกการลงทุน</span>
            </div>
            <button onClick={() => setShowAddAsset(true)} style={{ display: "flex", alignItems: "center", gap: "4px", background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: "8px", padding: "4px 8px", cursor: "pointer", color: accent, fontSize: "11px", fontFamily: FONT, fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
              เพิ่มสินทรัพย์
            </button>
          </div>
          <ModeToggle mode={mode} onChange={setMode} accent={accent} depositLabel="ซื้อ/ลงทุนเพิ่ม" withdrawLabel="ขาย/ถอน" />
          <div style={{ marginBottom: "12px" }}>
            <label style={S.label}>เลือกสินทรัพย์</label>
            {assets.length === 0 && <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", padding: "6px 0" }}>ยังไม่มีสินทรัพย์ กด "เพิ่มสินทรัพย์" ด้านบนเพื่อเริ่ม</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {assets.map((a) => {
                const col = INVEST_TYPES.find((t) => t.label === a.type)?.color ?? "#fff";
                const isSel = selectedAsset?.name === a.name;
                return (
                  <button key={a.name} onClick={() => setSelectedAsset(isSel ? null : a)} style={{ padding: "7px 12px", borderRadius: "10px", border: isSel ? `1.5px solid ${col}` : "1.5px solid rgba(255,255,255,0.1)", background: isSel ? `${col}20` : "rgba(255,255,255,0.04)", cursor: "pointer", fontFamily: FONT }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: isSel ? col : "rgba(255,255,255,0.75)" }}>{a.name}</div>
                    <div style={{ fontSize: "10px", color: isSel ? col : "rgba(255,255,255,0.3)" }}>{a.type}</div>
                  </button>
                );
              })}
            </div>
          </div>
          {selectedAsset && selectedType && (
            <div style={{ background: `${selectedType.color}12`, border: `1px solid ${selectedType.color}30`, borderRadius: "10px", padding: "8px 12px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: selectedType.color }} />
              <span style={{ fontSize: "13px", color: selectedType.color, fontWeight: 600 }}>{selectedAsset.name}</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>·</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{selectedAsset.type}</span>
            </div>
          )}
          <div style={{ marginBottom: "12px" }}>
            <label style={S.label}>มูลค่า (ยูโร)</label>
            <input type="number" placeholder="เช่น 1000" value={amount} onChange={(e) => setAmount(e.target.value)} style={S.input} />
          </div>
          <SubmitButton label={mode === "deposit" ? "บันทึกการลงทุน" : "บันทึกการขาย/ถอน"} accent={mode === "deposit" ? accent : "#FB7185"} onClick={handleSave} />
        </div>
        <div style={S.section}>
          <div style={S.label}>รายการล่าสุด <span style={{ opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>· กดค้างเพื่อลบ</span></div>
          {entries.length === 0 && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px", padding: "16px 0" }}>ยังไม่มีรายการ</div>}
          {[...entries].reverse().slice(0, 8).map((e, i, arr) => {
            const col = INVEST_TYPES.find((t) => t.label === e.assetType)?.color ?? "#fff";
            return (
              <LongPressRow key={e.id} onLongPress={() => setConfirmId(e.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{e.asset}</div>
                    <div style={{ fontSize: "11px", color: e.kind === "withdraw" ? "#FB7185" : col, marginTop: "1px" }}>{e.assetType} · {e.date}{e.kind === "withdraw" ? " · ขาย/ถอน" : ""}</div>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: 600, color: e.kind === "withdraw" ? "#FB7185" : col }}>{e.kind === "withdraw" ? "-" : "+"}€{e.amount.toLocaleString()}</span>
                </div>
              </LongPressRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Exercise Screen ──────────────────────────────────────────────────────────

function ExerciseScreen({ onBack }) {
  const accent = "#A78BFA";
  const [workoutType, setWorkoutType] = useState("run");
  const [runKm, setRunKm] = useState(""); const [runPace, setRunPace] = useState(""); const [runHr, setRunHr] = useState("");
  const [cycleKm, setCycleKm] = useState(""); const [cyclePace, setCyclePace] = useState(""); const [cycleHr, setCycleHr] = useState("");
  const [muscle, setMuscle] = useState(MUSCLE_GROUPS[0]);
  const [exerciseName, setExerciseName] = useState(""); const [weightKg, setWeightKg] = useState(""); const [weightSets, setWeightSets] = useState("");
  const [toast, setToast] = useState("");
  const [kcalGoal, setKcalGoal] = useState(2000);
  const [showKcalSheet, setShowKcalSheet] = useState(false);
  const [weekDays, setWeekDays] = useState(["rest", "rest", "rest", "rest", "rest", "rest", "rest"]);
  const [sessions, setSessions] = useState([]);
  const nextId = useRef(1);
  const [confirmId, setConfirmId] = useState(null);

  const totalKcal = sessions.reduce((s, e) => s + e.kcal, 0);
  const kcalPct = Math.min(100, Math.round((totalKcal / kcalGoal) * 100));
  const activeDays = weekDays.filter((d) => d !== "rest").length;

  function handleSave() {
    let kcal = 0;
    let detail = "";
    if (workoutType === "run") { kcal = Math.round((parseFloat(runKm) || 5) * 65); detail = `วิ่ง ${runKm || "?"} กม. · Pace ${runPace || "?"} · HR ${runHr || "??"}`; }
    else if (workoutType === "cycle") { kcal = Math.round((parseFloat(cycleKm) || 20) * 25); detail = `ปั่น ${cycleKm || "?"} กม. · Pace ${cyclePace || "?"} · HR ${cycleHr || "??"}`; }
    else { kcal = Math.round((parseInt(weightSets) || 4) * 40); detail = `${muscle} · ${exerciseName || "??"} · ${weightKg || "??"} กก. ${weightSets || "?"} เซ็ท`; }

    const today = new Date();
    const date = `${WEEK_DAYS[today.getDay() === 0 ? 6 : today.getDay() - 1]}. ก.ย.`;
    const newSession = { id: nextId.current++, day: today.getDay(), type: workoutType, kcal, detail, date };
    setSessions((prev) => [...prev, newSession]);

    const dayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;
    setWeekDays((prev) => { const next = [...prev]; next[dayIdx] = workoutType; return next; });

    setToast(`บันทึกแล้ว +${kcal} Kcal`);
    setTimeout(() => setToast(""), 2500);
    setRunKm(""); setRunPace(""); setRunHr("");
    setCycleKm(""); setCyclePace(""); setCycleHr("");
    setExerciseName(""); setWeightKg(""); setWeightSets("");
  }

  function handleDelete(id) {
    setSessions((prev) => {
      const target = prev.find((s) => s.id === id);
      const next = prev.filter((s) => s.id !== id);
      if (target) {
        const dayIdx = target.day === 0 ? 6 : target.day - 1;
        const remaining = next.filter((s) => (s.day === 0 ? 6 : s.day - 1) === dayIdx);
        setWeekDays((wd) => { const nw = [...wd]; nw[dayIdx] = remaining.length ? remaining[remaining.length - 1].type : "rest"; return nw; });
      }
      return next;
    });
    setConfirmId(null);
  }

  const confirmSession = sessions.find((s) => s.id === confirmId);

  const workoutTabs = [
    { key: "run", label: "วิ่ง", emoji: "🏃" },
    { key: "cycle", label: "ปั่นจักรยาน", emoji: "🚴" },
    { key: "weights", label: "ยกเวท", emoji: "🏋️" },
  ];

  const typeColor = { run: accent, cycle: "#818CF8", weights: "#34D399", rest: "rgba(255,255,255,0.2)" };

  return (
    <div style={{ minHeight: "100%", background: bgGradient(accent), color: "#fff", fontFamily: FONT, maxWidth: "430px", margin: "0 auto", paddingBottom: "40px" }}>
      {toast && <Toast message={toast} accent={accent} />}
      {showKcalSheet && <KcalGoalSheet accent={accent} current={kcalGoal} onSave={setKcalGoal} onClose={() => setShowKcalSheet(false)} />}
      {confirmSession && (
        <ConfirmSheet
          title="ลบรายการนี้?"
          message={`${confirmSession.date} · ${confirmSession.detail}`}
          onConfirm={() => handleDelete(confirmId)}
          onClose={() => setConfirmId(null)}
        />
      )}
      <StatusBar />
      <NavBar title="Exercise" accent={accent} onBack={onBack} />

      <div style={{ padding: "12px 24px" }}>
        {/* Overview card */}
        <div style={{ background: cardGradient(accent), backdropFilter: "blur(20px)", borderRadius: "20px", padding: "20px", marginBottom: "16px", border: `1px solid ${accent}25` }}>
          {/* Week dots */}
          <div style={{ marginBottom: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              {WEEK_DAYS.map((label, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>{label}</span>
                  <WorkoutDot type={weekDays[i]} accent={accent} size={38} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
              {["run", "cycle", "weights", "rest"].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: typeColor[t] }} />
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{t === "run" ? "วิ่ง" : t === "cycle" ? "ปั่น" : t === "weights" ? "เวท" : "พัก"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Kcal progress */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>Kcal สัปดาห์นี้</div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: accent }}>{totalKcal.toLocaleString()} <span style={{ fontSize: "13px", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/ {kcalGoal.toLocaleString()} kcal</span></div>
              </div>
              <button onClick={() => setShowKcalSheet(true)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "5px 10px", color: "rgba(255,255,255,0.5)", fontSize: "11px", cursor: "pointer", fontFamily: FONT, letterSpacing: "0.06em" }}>
                ตั้งเป้า
              </button>
            </div>
            <div style={{ height: "6px", borderRadius: "4px", background: "rgba(255,255,255,0.08)" }}>
              <div style={{ height: "100%", width: `${kcalPct}%`, borderRadius: "4px", background: `linear-gradient(90deg, ${accent}, #38BDF8)`, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>ออก {activeDays} วัน</span>
              <span style={{ fontSize: "11px", fontWeight: 600, color: accent }}>{kcalPct}%</span>
            </div>
          </div>
        </div>

        {/* Workout type tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {workoutTabs.map((t) => (
            <button key={t.key} onClick={() => setWorkoutType(t.key)} style={{ flex: 1, padding: "12px 8px", borderRadius: "14px", border: workoutType === t.key ? `1.5px solid ${accent}` : "1.5px solid rgba(255,255,255,0.1)", background: workoutType === t.key ? `${accent}18` : "rgba(255,255,255,0.03)", color: workoutType === t.key ? accent : "rgba(255,255,255,0.45)", cursor: "pointer", fontFamily: FONT, fontSize: "12px", fontWeight: workoutType === t.key ? 600 : 400, textAlign: "center" }}>
              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{t.emoji}</div>
              {t.label}
            </button>
          ))}
        </div>

        {/* Run */}
        {workoutType === "run" && (
          <div style={S.section}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "18px" }}>🏃</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>บันทึกการวิ่ง</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div><label style={S.label}>ระยะทาง (กม.)</label><input type="number" placeholder="เช่น 5.2" value={runKm} onChange={(e) => setRunKm(e.target.value)} style={S.input} /></div>
              <div><label style={S.label}>Pace (นาที/กม.)</label><input type="text" placeholder="เช่น 6:30" value={runPace} onChange={(e) => setRunPace(e.target.value)} style={S.input} /></div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={S.label}>Heart Rate เฉลี่ย (bpm)</label>
              <input type="number" placeholder="เช่น 152" value={runHr} onChange={(e) => setRunHr(e.target.value)} style={S.input} />
            </div>
            <SubmitButton label="บันทึก" accent={accent} onClick={handleSave} />
          </div>
        )}

        {/* Cycle */}
        {workoutType === "cycle" && (
          <div style={S.section}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "18px" }}>🚴</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>บันทึกการปั่น</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div><label style={S.label}>ระยะทาง (กม.)</label><input type="number" placeholder="เช่น 30" value={cycleKm} onChange={(e) => setCycleKm(e.target.value)} style={S.input} /></div>
              <div><label style={S.label}>Pace (นาที/กม.)</label><input type="text" placeholder="เช่น 3:20" value={cyclePace} onChange={(e) => setCyclePace(e.target.value)} style={S.input} /></div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={S.label}>Heart Rate เฉลี่ย (bpm)</label>
              <input type="number" placeholder="เช่น 138" value={cycleHr} onChange={(e) => setCycleHr(e.target.value)} style={S.input} />
            </div>
            <SubmitButton label="บันทึก" accent={accent} onClick={handleSave} />
          </div>
        )}

        {/* Weights */}
        {workoutType === "weights" && (
          <div style={S.section}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <span style={{ fontSize: "18px" }}>🏋️</span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em" }}>บันทึกยกเวท</span>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={S.label}>กลุ่มกล้ามเนื้อ</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {MUSCLE_GROUPS.map((m) => (
                  <button key={m} onClick={() => setMuscle(m)} style={{ padding: "7px 14px", borderRadius: "20px", border: muscle === m ? `1.5px solid ${accent}` : "1.5px solid rgba(255,255,255,0.12)", background: muscle === m ? `${accent}22` : "transparent", color: muscle === m ? accent : "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer", fontFamily: FONT }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={S.label}>ชื่อท่า</label>
              <input type="text" placeholder="เช่น Bench Press, Squat, Deadlift" value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} style={S.input} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div><label style={S.label}>น้ำหนัก (กก.)</label><input type="number" placeholder="เช่น 60" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} style={S.input} /></div>
              <div><label style={S.label}>จำนวนเซ็ท</label><input type="number" placeholder="เช่น 4" value={weightSets} onChange={(e) => setWeightSets(e.target.value)} style={S.input} /></div>
            </div>
            <SubmitButton label="บันทึก" accent={accent} onClick={handleSave} />
          </div>
        )}

        {/* History */}
        <div style={S.section}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={S.label}>ประวัติสัปดาห์นี้ <span style={{ opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>· กดค้างเพื่อลบ</span></div>
            <span style={{ fontSize: "12px", color: accent, fontWeight: 600 }}>{activeDays} / 7 วัน</span>
          </div>
          {sessions.length === 0 && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px", padding: "16px 0" }}>ยังไม่มีการออกกำลังกาย</div>
          )}
          {[...sessions].reverse().map((s, i, arr) => {
            const col = typeColor[s.type];
            const emoji = s.type === "run" ? "🏃" : s.type === "cycle" ? "🚴" : "🏋️";
            return (
              <LongPressRow key={s.id} onLongPress={() => setConfirmId(s.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `${col}20`, border: `1px solid ${col}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                    {emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginBottom: "1px" }}>{s.date}</div>
                    <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.detail}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: col }}>{s.kcal}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>kcal</div>
                  </div>
                </div>
              </LongPressRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stats Screen ─────────────────────────────────────────────────────────────

const MONEY_MONTHLY = [];
const MONEY_YEARLY = [];
const INVEST_ENTRIES_STATS = [];
const EX_WEEKLY = [];
const EX_MONTHLY = [];
const EX_YEARLY = [];

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(14px)", borderRadius: "14px", padding: "14px 14px", flex: 1, border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

function StatsScreen({ onBack }) {
  const [tab, setTab] = useState("money");
  const [exRange, setExRange] = useState("month");

  const hasMoneyData = MONEY_MONTHLY.length > 0 && MONEY_YEARLY.length > 0;
  const hasInvestData = INVEST_ENTRIES_STATS.length > 0;
  const hasExData = EX_WEEKLY.length > 0 && EX_MONTHLY.length > 0 && EX_YEARLY.length > 0;

  const investTotal = INVEST_ENTRIES_STATS.reduce((s, e) => s + e.amount, 0);
  const pieData = INVEST_TYPES.map((t) => ({ name: t.label, value: INVEST_ENTRIES_STATS.filter((e) => e.type === t.label).reduce((s, e) => s + e.amount, 0), color: t.color })).filter((d) => d.value > 0);
  const topAsset = hasInvestData ? [...INVEST_ENTRIES_STATS].sort((a, b) => b.amount - a.amount)[0] : null;
  const moneyTotal = MONEY_MONTHLY.reduce((s, e) => s + e.amount, 0);
  const moneyAvg = MONEY_MONTHLY.length ? Math.round(moneyTotal / MONEY_MONTHLY.length) : 0;
  const bestMoneyYear = hasMoneyData ? MONEY_YEARLY.reduce((a, b) => (b.amount > a.amount ? b : a)) : null;

  const tabs = [
    { key: "money", label: "Money", accent: "#2DD4BF" },
    { key: "invest", label: "Invest", accent: "#38BDF8" },
    { key: "exercise", label: "Exercise", accent: "#A78BFA" },
  ];

  const accent = tabs.find((t) => t.key === tab).accent;

  return (
    <div style={{ minHeight: "100%", background: bgGradient(accent), color: "#fff", fontFamily: FONT, maxWidth: "430px", margin: "0 auto", paddingBottom: "40px" }}>
      <StatusBar />
      <NavBar title="Stats" accent={accent} onBack={onBack} />

      <div style={{ padding: "8px 24px 4px", display: "flex", gap: "6px" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "9px 0", borderRadius: "10px", border: tab === t.key ? `1.5px solid ${t.accent}` : "1.5px solid rgba(255,255,255,0.08)", background: tab === t.key ? `${t.accent}15` : "transparent", color: tab === t.key ? t.accent : "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", fontFamily: FONT, letterSpacing: "0.04em" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 24px" }}>

        {/* ── Money Stats ─────────────────────────────── */}
        {tab === "money" && (
          !hasMoneyData ? (
            <EmptyState icon="💰" title="ยังไม่มีข้อมูลการออม" subtitle="เริ่มบันทึกยอดออมในหน้า Money Goal" />
          ) : (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <StatCard label="ออมรวม" value={`€${moneyTotal.toLocaleString()}`} sub="จาก 3 เดือน" accent="#2DD4BF" />
              <StatCard label="เฉลี่ย/เดือน" value={`€${moneyAvg.toLocaleString()}`} sub="avg" accent="#2DD4BF" />
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <StatCard label="เดือนที่ดีที่สุด" value="ส.ค." sub="€15,000" accent="#2DD4BF" />
              <StatCard label="เหลืออีก" value={`€${(500000 - moneyTotal).toLocaleString()}`} sub="สู่เป้าหมาย" accent="rgba(255,255,255,0.5)" />
            </div>
            <div style={{ ...S.section, padding: "20px" }}>
              <div style={S.label}>ยอดออมรายเดือน</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={MONEY_MONTHLY} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: "#111827", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} formatter={(v) => [`€${v.toLocaleString()}`, ""]} />
                  <Bar dataKey="amount" fill="#2DD4BF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <StatCard label="ปีที่ออมมากสุด" value={String(bestMoneyYear.year)} sub={`€${bestMoneyYear.amount.toLocaleString()}`} accent="#2DD4BF" />
              <StatCard
                label="เติบโตจากปีก่อน"
                value={`${MONEY_YEARLY[MONEY_YEARLY.length - 1].amount >= MONEY_YEARLY[MONEY_YEARLY.length - 2].amount ? "+" : ""}${Math.round(((MONEY_YEARLY[MONEY_YEARLY.length - 1].amount - MONEY_YEARLY[MONEY_YEARLY.length - 2].amount) / MONEY_YEARLY[MONEY_YEARLY.length - 2].amount) * 100)}%`}
                sub={`${MONEY_YEARLY[MONEY_YEARLY.length - 2].year} → ${MONEY_YEARLY[MONEY_YEARLY.length - 1].year}`}
                accent="#2DD4BF"
              />
            </div>
            <div style={S.section}>
              <div style={S.label}>ภาพรวมรายปี</div>
              {MONEY_YEARLY.map((y, i) => {
                const prev = MONEY_YEARLY[i - 1];
                const growth = prev ? Math.round(((y.amount - prev.amount) / prev.amount) * 100) : null;
                const isBest = y.amount === bestMoneyYear.amount;
                return (
                  <div key={y.year} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < MONEY_YEARLY.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", gap: "6px" }}>
                        ปี {y.year}
                        {isBest && <span style={{ fontSize: "10px", color: "#2DD4BF", border: "1px solid #2DD4BF50", borderRadius: "6px", padding: "1px 6px" }}>สูงสุด</span>}
                      </div>
                      {growth !== null && <div style={{ fontSize: "11px", color: growth >= 0 ? "#34D399" : "#FB7185", marginTop: "1px" }}>{growth >= 0 ? "+" : ""}{growth}% จากปีก่อน</div>}
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#2DD4BF" }}>€{y.amount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </>
          )
        )}

        {/* ── Investment Stats ──────────────────────── */}
        {tab === "invest" && (
          !hasInvestData ? (
            <EmptyState icon="📈" title="ยังไม่มีข้อมูลการลงทุน" subtitle="เริ่มบันทึกการลงทุนในหน้า Investment" />
          ) : (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <StatCard label="พอร์ตรวม" value={`€${investTotal.toLocaleString()}`} sub={`${new Set(INVEST_ENTRIES_STATS.map((e) => e.asset)).size} สินทรัพย์`} accent="#38BDF8" />
              <StatCard label="สินทรัพย์หลัก" value={topAsset.asset} sub={`€${topAsset.amount.toLocaleString()}`} accent="#38BDF8" />
            </div>
            <div style={{ ...S.section, padding: "20px" }}>
              <div style={S.label}>สัดส่วนพอร์ต</div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#111827", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} formatter={(v) => [`€${v.toLocaleString()}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {pieData.map((d, i) => (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{d.name}</span>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: d.color }}>{Math.round((d.value / investTotal) * 100)}%</span>
                      </div>
                      <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.08)" }}>
                        <div style={{ height: "100%", width: `${Math.round((d.value / investTotal) * 100)}%`, borderRadius: "2px", background: d.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={S.section}>
              <div style={S.label}>รายละเอียดสินทรัพย์</div>
              {INVEST_ENTRIES_STATS.map((e, i) => {
                const col = INVEST_TYPES.find((t) => t.label === e.type)?.color ?? "#fff";
                const pct = Math.round((e.amount / investTotal) * 100);
                return (
                  <div key={i} style={{ padding: "10px 0", borderBottom: i < INVEST_ENTRIES_STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff" }}>{e.asset}</span>
                        <span style={{ fontSize: "11px", color: col, marginLeft: "8px" }}>{e.type}</span>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: col }}>€{e.amount.toLocaleString()}</span>
                    </div>
                    <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: "2px", background: col }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
          )
        )}

        {/* ── Exercise Stats ────────────────────────── */}
        {tab === "exercise" && (
          !hasExData ? (
            <EmptyState icon="🏃" title="ยังไม่มีข้อมูลการออกกำลังกาย" subtitle="เริ่มบันทึกกิจกรรมในหน้า Exercise" />
          ) : (
          <>
            {/* Kcal weekly bar */}
            <div style={{ ...S.section, padding: "20px" }}>
              <div style={S.label}>Kcal รายสัปดาห์</div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={EX_WEEKLY} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111827", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} formatter={(v) => [`${v} kcal`, ""]} />
                  <Bar dataKey="kcal" fill="#A78BFA" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Workout type breakdown */}
            <div style={S.section}>
              <div style={S.label}>ประเภทการออกกำลังกาย</div>
              {[
                { type: "วิ่ง 🏃", days: 14, pct: 58, col: "#A78BFA" },
                { type: "ปั่นจักรยาน 🚴", days: 6, pct: 25, col: "#818CF8" },
                { type: "ยกเวท 🏋️", days: 4, pct: 17, col: "#34D399" },
              ].map((r, i) => (
                <div key={i} style={{ marginBottom: i < 2 ? "14px" : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                    <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)" }}>{r.type}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: r.col }}>{r.days} ครั้ง · {r.pct}%</span>
                  </div>
                  <div style={{ height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.08)" }}>
                    <div style={{ height: "100%", width: `${r.pct}%`, borderRadius: "3px", background: r.col }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly / Yearly overview (replaces Personal Records) */}
            <div style={S.section}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={S.label}>สรุปกิจกรรม</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => setExRange("month")} style={{ padding: "5px 10px", borderRadius: "8px", border: exRange === "month" ? "1.5px solid #A78BFA" : "1px solid rgba(255,255,255,0.1)", background: exRange === "month" ? "#A78BFA18" : "transparent", color: exRange === "month" ? "#A78BFA" : "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>รายเดือน</button>
                  <button onClick={() => setExRange("year")} style={{ padding: "5px 10px", borderRadius: "8px", border: exRange === "year" ? "1.5px solid #A78BFA" : "1px solid rgba(255,255,255,0.1)", background: exRange === "year" ? "#A78BFA18" : "transparent", color: exRange === "year" ? "#A78BFA" : "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>รายปี</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={exRange === "month" ? EX_MONTHLY : EX_YEARLY} barSize={exRange === "month" ? 20 : 44}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey={exRange === "month" ? "month" : "year"} tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ background: "#111827", border: "none", borderRadius: "10px", color: "#fff", fontSize: "12px" }} formatter={(v) => [`${v.toLocaleString()} kcal`, ""]} />
                  <Bar dataKey="kcal" fill="#A78BFA" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
          )
        )}
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

const goals = [
  { id: 1, label: "Money Goal", sublabel: "Annual savings target", accentColor: "#2DD4BF", progress: 0, target: "€500,000", current: "€0", icon: <MoneyIcon />, tag: "Finance", screen: "money" },
  { id: 2, label: "Investment", sublabel: "Portfolio growth", accentColor: "#38BDF8", progress: 0, target: "€200,000", current: "€0", icon: <InvestIcon />, tag: "Wealth", screen: "investment" },
  { id: 3, label: "Exercise", sublabel: "Weekly workout streak", accentColor: "#A78BFA", progress: 0, target: "52 weeks", current: "0 weeks", icon: <ExerciseIcon />, tag: "Health", screen: "exercise" },
];

function GoalCardItem({ goal, onClick }) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-2xl relative flex flex-col" style={{ background: cardGradient(goal.accentColor), backdropFilter: "blur(20px)", color: "#fff", minHeight: "160px", padding: "20px", border: `1px solid ${goal.accentColor}30`, cursor: "pointer", transition: "transform 0.15s ease" }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <div className="flex items-start justify-between mb-auto">
        <div>
          <span style={{ color: goal.accentColor, fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" }}>{goal.tag}</span>
          <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: "20px", marginTop: "2px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>{goal.label}</h2>
          <p style={{ opacity: 0.55, fontSize: "12px", marginTop: "2px" }}>{goal.sublabel}</p>
        </div>
        <div style={{ color: goal.accentColor, opacity: 0.9, flexShrink: 0 }}>{goal.icon}</div>
      </div>
      <div style={{ marginTop: "20px" }}>
        <div style={{ height: "3px", borderRadius: "2px", background: "rgba(255,255,255,0.12)", marginBottom: "8px" }}>
          <div style={{ height: "100%", width: `${goal.progress}%`, borderRadius: "2px", background: goal.accentColor }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ opacity: 0.5, fontSize: "11px" }}>{goal.current} of {goal.target}</span>
          <span style={{ color: goal.accentColor, fontSize: "14px", fontWeight: 700 }}>{goal.progress}%</span>
        </div>
      </div>
    </button>
  );
}

function BottomNav({ active, onNavigate }) {
  const items = [
    {
      key: "home", label: "Goals",
      icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="2" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" /></svg>,
    },
    {
      key: "stats", label: "Stats",
      icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><polyline points="3,18 7,12 11,14 16,7 19,5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    },
    {
      key: "home", label: "Profile",
      icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" /><path d="M3 19c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>,
    },
  ];

  return (
    <div style={{ position: "sticky", bottom: 0, background: "rgba(6,10,18,0.85)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-around", padding: "12px 0 24px" }}>
      {items.map((item, i) => {
        const isActive = (item.label === "Goals" && active === "home") || (item.label === "Stats" && active === "stats");
        return (
          <button key={i} onClick={() => onNavigate(item.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", color: isActive ? NAV_BLUE : "rgba(255,255,255,0.3)" }}>
            {item.icon}
            <span style={{ fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function HomeScreen({ onNavigate }) {
  return (
    <div style={{ minHeight: "100%", background: HOME_BG, color: "#fff", fontFamily: FONT, maxWidth: "430px", margin: "0 auto", display: "flex", flexDirection: "column" }}>
      <StatusBar />
      <div style={{ padding: "20px 24px 8px" }}>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "4px" }}>Overview</p>
        <h1 style={{ fontFamily: FONT, fontSize: "32px", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff" }}>My Goals</h1>
      </div>
      <div style={{ padding: "16px 24px", display: "flex", gap: "8px" }}>
        {[{ label: "Active", value: "3" }, { label: "Avg. Progress", value: "0%" }, { label: "This Month", value: "0%" }].map((s) => (
          <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.05)", backdropFilter: "blur(14px)", borderRadius: "12px", padding: "10px", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 24px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {goals.map((g) => <GoalCardItem key={g.id} goal={g} onClick={() => onNavigate(g.screen)} />)}
        <div style={{ paddingBottom: "8px" }} />
      </div>
      <BottomNav active="home" onNavigate={onNavigate} />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("home");
  if (screen === "money") return <MoneyScreen onBack={() => setScreen("home")} />;
  if (screen === "investment") return <InvestmentScreen onBack={() => setScreen("home")} />;
  if (screen === "exercise") return <ExerciseScreen onBack={() => setScreen("home")} />;
  if (screen === "stats") return <StatsScreen onBack={() => setScreen("home")} />;
  return <HomeScreen onNavigate={setScreen} />;
}

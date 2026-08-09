import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const MOCK_DATA = {
    success: true,
    totalInterviews: 12,
    avgScore: "7.34",
    strongestArea: "correctness",
    weakestArea: "depth",
    topics: {
        DSA: { total: 38.5, count: 4 },
        OS: { total: 21.0, count: 3 },
        CN: { total: 15.2, count: 2 },
        DBMS: { total: 22.1, count: 3 },
        HR: { total: 0, count: 0 },
    },
    topGaps: [
        { concept: "Isolation Levels in ACID", frequency: 7 },
        { concept: "Big-O Space Complexity", frequency: 5 },
        { concept: "TCP Three-way Handshake", frequency: 4 },
        { concept: "B-Tree vs Hash Index", frequency: 3 },
        { concept: "Process Scheduling Algorithms", frequency: 2 },
    ],
};

const TOPIC_META = {
    DSA: { icon: "◈", color: "#3b82f6", glow: "rgba(59,130,246,0.25)", label: "DSA" },
    OS: { icon: "◉", color: "#818cf8", glow: "rgba(129,140,248,0.25)", label: "OS" },
    CN: { icon: "⬡", color: "#22d3ee", glow: "rgba(34,211,238,0.25)", label: "CN" },
    DBMS: { icon: "◎", color: "#a78bfa", glow: "rgba(167,139,250,0.25)", label: "DBMS" },
    HR: { icon: "◷", color: "#f472b6", glow: "rgba(244,114,182,0.25)", label: "HR" },
};

const AREA_COLOR = {
    clarity: { bar: "#3b82f6", label: "Clarity" },
    depth: { bar: "#818cf8", label: "Depth" },
    correctness: { bar: "#22d3ee", label: "Correctness" },
};

const GAP_COLORS = ["#3b82f6", "#818cf8", "#22d3ee", "#a78bfa", "#f472b6"];

function AnimNum({ target, decimals = 0, duration = 1200 }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const end = parseFloat(target);
        const step = end / (duration / 16);
        let cur = 0;
        const t = setInterval(() => {
            cur = Math.min(cur + step, end);
            setVal(cur);
            if (cur >= end) clearInterval(t);
        }, 16);
        return () => clearInterval(t);
    }, [target]);
    return <>{val.toFixed(decimals)}</>;
}

function ScoreRing({ score, max = 10, size = 120, strokeW = 7 }) {
    const r = (size / 2) - strokeW - 2;
    const c = 2 * Math.PI * r;
    const pct = Math.min(score / max, 1);
    const color = score >= 8 ? "#22d3ee" : score >= 6 ? "#3b82f6" : "#818cf8";
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth={strokeW} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
                strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
                strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)" }} />
            <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="white"
                fontSize={size * 0.18} fontWeight="800" fontFamily="Syne">{score}</text>
            <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="rgba(100,116,139,0.7)"
                fontSize={size * 0.09} fontFamily="JetBrains Mono">/ {max}</text>
        </svg>
    );
}

function HBar({ value, max, color, glow, height = 6 }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div style={{ height, borderRadius: 99, background: "rgba(30,41,59,0.8)", overflow: "hidden" }}>
            <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 99, background: color,
                boxShadow: `0 0 8px ${glow}`, transition: "width 1.1s cubic-bezier(.16,1,.3,1)"
            }} />
        </div>
    );
}

export default function AnalyticsDashboard() {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState(MOCK_DATA);


    useEffect(() => {
        const fetchQuestion = async () => {
            const res = await axios.get(`http://localhost:8000/api/interview/analytics/overall`, {
                withCredentials: true,
            });

            if (res.data.success) {
                console.log(res);
                setData(res.data);
            }

        }
        fetchQuestion();
    }, []);

    useEffect(() => { setMounted(true); }, []);

    if (!data) return null;

    const { totalInterviews, avgScore, strongestArea, weakestArea, topics, topGaps } = data;

    const activeTopics = Object.entries(topics)
        .filter(([, v]) => v.count > 0)
        .map(([key, v]) => ({ key, avg: Number((v.total / v.count).toFixed(2)), count: v.count, ...TOPIC_META[key] }));

    const maxTopicAvg = Math.max(...activeTopics.map(t => t.avg), 10);
    const maxGapFreq = Math.max(...topGaps.map(g => g.frequency), 1);

    return (
        <div className={`relative min-h-screen w-full bg-[#020409] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; }
        .mono { font-family:'JetBrains Mono',monospace; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fu  { animation:fadeUp .55s cubic-bezier(.16,1,.3,1) both; }
        .fu2 { animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .08s both; }
        .fu3 { animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .16s both; }
        .fu4 { animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .24s both; }
        .fu5 { animation:fadeUp .55s cubic-bezier(.16,1,.3,1) .32s both; }
        .card { background:rgba(10,15,30,0.85); backdrop-filter:blur(24px); border:1px solid rgba(100,116,139,0.22); border-radius:18px; outline:1px solid rgba(255,255,255,0.025); }
        .btn-dash:hover { box-shadow:0 8px 28px rgba(37,99,235,0.45); transform:translateY(-1px); }
        .btn-dash:active { transform:scale(0.98); }
        .topic-row:hover { background:rgba(59,130,246,0.04); }
      `}</style>

            <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
                style={{ backgroundImage: `linear-gradient(rgba(59,130,246,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.2) 1px,transparent 1px)`, backgroundSize: "56px 56px" }} />
            <div className="fixed -top-40 -left-40 w-[560px] h-[560px] rounded-full z-0 pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(37,99,235,.13) 0%,transparent 70%)" }} />
            <div className="fixed -bottom-40 -right-40 w-[480px] h-[480px] rounded-full z-0 pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 70%)" }} />

            <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 border-b border-slate-800/60"
                style={{ background: "rgba(2,4,9,0.88)", backdropFilter: "blur(20px)" }}>
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-3.5 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="mono text-blue-400 text-[11px] tracking-[0.14em]">AI INTERVIEW ENGINE</span>
                    </div>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="mono text-slate-600 text-[11px] tracking-wider">ANALYTICS DASHBOARD</span>
                </div>
                <button onClick={() => navigate("/")}
                    className="btn-dash mono text-slate-400 text-xs border border-slate-700/60 rounded-xl px-4 py-2 hover:border-blue-500/40 hover:text-blue-400 transition-all duration-200 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Dashboard
                </button>
            </header>

            <div className="relative z-10 max-w-[1040px] mx-auto px-6 py-8 flex flex-col gap-5">

                <div className="fu grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "TOTAL INTERVIEWS", value: totalInterviews, suffix: "", color: "#3b82f6" },
                        { label: "AVERAGE SCORE", value: avgScore, suffix: "/10", color: Number(avgScore) >= 8 ? "#22d3ee" : Number(avgScore) >= 6 ? "#3b82f6" : "#818cf8" },
                        { label: "STRONGEST AREA", value: AREA_COLOR[strongestArea]?.label, raw: true, color: "#22d3ee" },
                        { label: "WEAKEST AREA", value: AREA_COLOR[weakestArea]?.label, raw: true, color: "#f472b6" },
                    ].map(({ label, value, suffix, color, raw }) => (
                        <div key={label} className="card px-5 py-4 flex flex-col gap-1.5">
                            <div className="mono text-slate-500 text-[10px] tracking-widest">{label}</div>
                            <div className="font-extrabold text-[20px]" style={{ color }}>
                                {raw ? value : <><AnimNum target={parseFloat(value)} decimals={suffix ? 2 : 0} />{suffix}</>}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── ROW 2 : score ring + strongest/weakest + top gaps ── */}
                <div className="fu2 grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Score ring */}
                    <div className="card flex flex-col items-center justify-center py-8 gap-3">
                        <div className="mono text-slate-500 text-[10px] tracking-widest">OVERALL SCORE</div>
                        <ScoreRing score={Number(avgScore)} />
                        <div className="mono text-xs tracking-wider"
                            style={{ color: Number(avgScore) >= 8 ? "#22d3ee" : Number(avgScore) >= 6 ? "#3b82f6" : "#818cf8" }}>
                            {Number(avgScore) >= 8 ? "Excellent" : Number(avgScore) >= 6 ? "Good" : "Needs Work"}
                        </div>
                    </div>

                    {/* Strongest / Weakest + interview count */}
                    <div className="card px-6 py-5 flex flex-col justify-between gap-4">
                        <div className="mono text-slate-600 text-[10px] tracking-widest">PERFORMANCE AREAS</div>

                        <div className="flex flex-col gap-3">
                            {[
                                { key: strongestArea, icon: "↑", label: "Strongest", textColor: "#22d3ee", borderColor: "rgba(34,211,238,0.2)", bgColor: "rgba(34,211,238,0.05)" },
                                { key: weakestArea, icon: "↓", label: "Weakest", textColor: "#f472b6", borderColor: "rgba(244,114,182,0.2)", bgColor: "rgba(244,114,182,0.05)" },
                            ].map(({ key, icon, label, textColor, borderColor, bgColor }) => (
                                <div key={key} className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                                    style={{ borderColor, background: bgColor }}>
                                    <span className="text-xl font-black" style={{ color: textColor }}>{icon}</span>
                                    <div>
                                        <div className="mono text-[10px] tracking-wider text-slate-500">{label.toUpperCase()}</div>
                                        <div className="font-bold text-sm mt-0.5" style={{ color: textColor }}>
                                            {AREA_COLOR[key]?.label}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
                            <span className="mono text-slate-500 text-xs">Sessions completed</span>
                            <span className="mono font-bold text-blue-400 text-sm">{totalInterviews}</span>
                        </div>
                    </div>

                    {/* Top Conceptual Gaps */}
                    <div className="card px-6 py-5 flex flex-col gap-4">
                        <div className="mono text-slate-600 text-[10px] tracking-widest">TOP CONCEPTUAL GAPS</div>
                        <div className="flex flex-col gap-3">
                            {topGaps.map(({ concept, frequency }, i) => (
                                <div key={concept} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-300 text-xs font-medium leading-snug" style={{ maxWidth: "75%" }}>{concept}</span>
                                        <span className="mono text-[10px] font-bold" style={{ color: GAP_COLORS[i] }}>×{frequency}</span>
                                    </div>
                                    <HBar value={frequency} max={maxGapFreq} color={GAP_COLORS[i]} glow={GAP_COLORS[i] + "55"} height={4} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── ROW 3 : topic breakdown ── */}
                <div className="fu3 card px-6 py-5 flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                        <div className="mono text-slate-600 text-[10px] tracking-widest">TOPIC PERFORMANCE</div>
                        <div className="flex-1 h-px bg-slate-800/60" />
                        <div className="mono text-slate-700 text-[10px]">{activeTopics.length} active topics</div>
                    </div>

                    {activeTopics.length === 0 ? (
                        <div className="text-slate-600 text-sm text-center py-6">No completed interviews yet.</div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {activeTopics
                                .sort((a, b) => b.avg - a.avg)
                                .map(({ key, icon, color, glow, label, avg, count }) => (
                                    <div key={key} className="topic-row rounded-xl border border-slate-800/50 px-4 py-3 transition-colors duration-150 flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-lg" style={{ color }}>{icon}</span>
                                                <span className="text-slate-200 text-sm font-bold">{label}</span>
                                                <span className="mono text-[10px] text-slate-600 border border-slate-700/50 rounded-md px-1.5 py-0.5">{count} session{count > 1 ? "s" : ""}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="mono font-bold text-sm" style={{ color }}>{avg}</span>
                                                <span className="mono text-slate-600 text-xs">/10</span>
                                            </div>
                                        </div>
                                        <HBar value={avg} max={maxTopicAvg} color={color} glow={glow} height={5} />
                                    </div>
                                ))}

                            {/* Empty topics */}
                            {Object.entries(topics)
                                .filter(([, v]) => v.count === 0)
                                .map(([key]) => (
                                    <div key={key} className="rounded-xl border border-slate-800/30 px-4 py-3 flex items-center justify-between opacity-40">
                                        <div className="flex items-center gap-2.5">
                                            <span className="text-lg text-slate-600">{TOPIC_META[key].icon}</span>
                                            <span className="text-slate-600 text-sm font-medium">{TOPIC_META[key].label}</span>
                                        </div>
                                        <span className="mono text-slate-700 text-xs">No sessions</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* ── ROW 4 : gap frequency detail ── */}
                <div className="fu4 card px-6 py-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="mono text-slate-600 text-[10px] tracking-widest">KNOWLEDGE GAP ANALYSIS</div>
                        <div className="flex-1 h-px bg-slate-800/60" />
                        <div className="mono text-slate-700 text-[10px]">top 5 recurring gaps</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {topGaps.map(({ concept, frequency }, i) => {
                            const pct = Math.round((frequency / maxGapFreq) * 100);
                            return (
                                <div key={concept} className="rounded-xl border flex flex-col gap-3 px-4 py-4"
                                    style={{ borderColor: `${GAP_COLORS[i]}33`, background: `${GAP_COLORS[i]}08` }}>
                                    <div className="flex items-end gap-1 h-10">
                                        <div className="w-full rounded-md transition-all duration-1000"
                                            style={{ height: `${pct}%`, minHeight: 8, background: GAP_COLORS[i], boxShadow: `0 0 8px ${GAP_COLORS[i]}55` }} />
                                    </div>
                                    <div>
                                        <div className="text-slate-200 text-xs font-semibold leading-snug">{concept}</div>
                                        <div className="mono mt-1.5 text-[10px]" style={{ color: GAP_COLORS[i] }}>×{frequency} occurrences</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── FOOTER ── */}
                <div className="fu5 flex items-center justify-between pb-6">
                    <p className="mono text-slate-800 text-[10px] tracking-widest">
                        Adaptive AI · Real-time Feedback · Detailed Analysis
                    </p>
                    <button onClick={() => navigate("/interview")}
                        className="btn-dash py-3 px-6 rounded-[13px] font-bold text-sm tracking-wider text-white transition-all duration-200"
                        style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,99,235,0.5)"}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.3)"}>
                        Start New Interview
                    </button>
                </div>

            </div>
        </div>
    );
}
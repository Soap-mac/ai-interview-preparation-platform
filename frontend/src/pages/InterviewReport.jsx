import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const MOCK_REPORT = {
    success: true,
    interview: {
        topic: "Database Systems",
        finalScore: 7.4,
        createdAt: new Date().toISOString(),
        totalQuestions: 3,
    },
    analytics: {
        averageClarity: 7.2,
        averageDepth: 6.8,
        averageCorrectness: 8.1,
        testCasePassPercentage: 5,
        strongestArea: "correctness",
        weakestArea: "depth",
    },
    questions: [
        {
            id: "q1",
            question: "Explain the difference between INNER JOIN and LEFT JOIN in SQL.",
            difficulty: "medium",
            userAnswer: "INNER JOIN returns rows where there's a match in both tables. LEFT JOIN returns all rows from the left table and matching rows from the right table, with NULLs where there's no match.",
            clarity: 8,
            depth: 7,
            correctness: 9,
            score: 8,
            strengths: ["Correct definition of both joins", "Good use of NULL explanation"],
            weaknesses: ["Could add practical use cases", "No mention of performance implications"],
            conceptualGaps: ["Difference between LEFT and FULL OUTER JOIN"],
            feedback: "Solid understanding of join types. Consider elaborating on when to use each join type in real-world scenarios.",
            improvedAnswer: "INNER JOIN returns only the rows where there's a matching value in both tables. LEFT JOIN (or LEFT OUTER JOIN) returns all rows from the left table, and the matching rows from the right table — if no match exists, NULL values appear in the right table's columns. Use INNER JOIN when you only need matched data, and LEFT JOIN when you want to preserve all records from the primary (left) table regardless of matches.",
        },
        {
            id: "q2",
            question: "What are ACID properties in database transactions?",
            difficulty: "hard",
            userAnswer: "ACID stands for Atomicity, Consistency, Isolation, Durability. Atomicity means all or nothing. Consistency means data stays valid. I'm not entirely sure about Isolation and Durability details.",
            clarity: 6,
            depth: 5,
            correctness: 7,
            score: 6,
            strengths: ["Correct acronym expansion", "Atomicity explained correctly"],
            weaknesses: ["Isolation not explained", "Durability not explained", "Shallow depth overall"],
            conceptualGaps: ["Isolation levels (READ COMMITTED, SERIALIZABLE)", "Durability and write-ahead logging"],
            feedback: "You have a partial understanding of ACID. Focus on Isolation levels and how Durability is achieved through logging mechanisms.",
            improvedAnswer: "ACID ensures reliable database transactions. Atomicity: all operations in a transaction succeed or all are rolled back. Consistency: a transaction brings the DB from one valid state to another. Isolation: concurrent transactions execute as if sequential — controlled via isolation levels like READ COMMITTED or SERIALIZABLE. Durability: once committed, data persists even on system failure, typically via write-ahead logging (WAL).",
        },
        {
            id: "q3",
            question: "Explain database indexing and when you would avoid using an index.",
            difficulty: "medium",
            userAnswer: "Indexes speed up data retrieval by creating a data structure (usually B-tree) that allows faster lookup. You'd avoid indexes on small tables, columns with low cardinality like boolean fields, and tables with heavy write operations since indexes slow down inserts and updates.",
            clarity: 8,
            depth: 8,
            correctness: 8,
            score: 8,
            strengths: ["Mentioned B-tree structure", "Good coverage of when to avoid indexes", "Low cardinality point is excellent"],
            weaknesses: ["Could mention composite indexes", "No mention of covering indexes"],
            conceptualGaps: ["Partial indexes", "Index-only scans"],
            feedback: "Strong answer overall. Mentioning composite and covering indexes would elevate this to an expert-level response.",
            improvedAnswer: "Indexes (typically B-tree) improve query performance by enabling fast lookups without full table scans. Avoid indexes when: the table is small (full scan is faster), the column has low cardinality (e.g., boolean), or the table is write-heavy (indexes add overhead to INSERT/UPDATE/DELETE). Also consider composite indexes for multi-column queries and covering indexes to avoid table lookups entirely.",
        },
    ],
};

const AREA_LABELS = { clarity: "Clarity", depth: "Depth", correctness: "Correctness", testCasePassPercentage: "Test Cases Passed Rate", readability: "Readability", modularity: "Modularity", naming: "Naming", codeQuality: "Code Quality" };
const AREA_COLORS = {
    clarity: { bar: "#3b82f6", glow: "rgba(59,130,246,0.3)", text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/8" },
    readability: { bar: "#3b82f6", glow: "rgba(59,130,246,0.3)", text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/8" },
    depth: { bar: "#818cf8", glow: "rgba(129,140,248,0.3)", text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/8" },
    modularity: { bar: "#818cf8", glow: "rgba(129,140,248,0.3)", text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/8" },
    testCasePassPercentage: { bar: "#818cf8", glow: "rgba(129,140,248,0.3)", text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/8" },
    correctness: { bar: "#22d3ee", glow: "rgba(34,211,238,0.3)", text: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/8" },
    codeQuality: { bar: "#818cf8", glow: "rgba(129,140,248,0.3)", text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/8" },
    naming: { bar: "#818cf8", glow: "rgba(129,140,248,0.3)", text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/8" },
};
const DIFF_STYLE = {
    easy: { text: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/8" },
    medium: { text: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/8" },
    hard: { text: "text-indigo-400", border: "border-indigo-500/30", bg: "bg-indigo-500/8" },
};

function ScoreRing({ score, max = 10, size = 96 }) {
    const r = 36; const c = 2 * Math.PI * r;
    const pct = score / max;
    const color = score >= 8 ? "#22d3ee" : score >= 6 ? "#3b82f6" : "#818cf8";
    return (
        <svg width={size} height={size} viewBox="0 0 96 96">
            <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(30,41,59,0.8)" strokeWidth="6" />
            <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
                strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
                strokeLinecap="round" transform="rotate(-90 48 48)"
                style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)" }} />
            <text x="48" y="44" textAnchor="middle" fill="white" fontSize="15" fontWeight="800" fontFamily="Syne">{score}</text>
            <text x="48" y="58" textAnchor="middle" fill="rgba(100,116,139,0.8)" fontSize="9" fontFamily="JetBrains Mono">/ {max}</text>
        </svg>
    );
}

function MetricBar({ label, value, max = 10, color }) {
    const pct = (value / max) * 100;
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
                {console.log(label)}
                <span className="mono text-slate-400 text-xs tracking-wider">{label.toUpperCase()}</span>
                <span className="mono font-bold text-xs" style={{ color: color.bar }}>{value}/{max}</span>
            </div>
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${pct}%`, background: color.bar, boxShadow: `0 0 8px ${color.glow}` }} />
            </div>
        </div>
    );
}

function QuestionCard({ q, index, topic, analytics }) {
    const [expanded, setExpanded] = useState(false);
    const diff = DIFF_STYLE[q.difficulty] || DIFF_STYLE.medium;
    const scoreColor = q.score >= 8 ? "#22d3ee" : q.score >= 6 ? "#3b82f6" : "#818cf8";
    { console.log(topic) }
    if (topic == "DSA") {
        return (
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden transition-all duration-300"
                style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(24px)", outline: "1px solid rgba(255,255,255,0.025)" }}>

                {/* Card header — always visible */}
                <button className="w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-slate-800/20 transition-colors duration-150"
                    onClick={() => setExpanded(e => !e)}>
                    <ScoreRing score={q.score} size={72} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="mono text-slate-600 text-[10px] tracking-widest">Q{index + 1}</span>
                            <span className={`mono text-[10px] px-2 py-0.5 rounded-md border ${diff.text} ${diff.border} ${diff.bg}`}>
                                {q.difficulty}
                            </span>
                        </div>
                        <p className="text-slate-200 text-sm font-semibold leading-snug">{q.question}</p>
                        <div className="flex gap-4 mt-2.5">
                            {["readability", "modularity", "naming", "correctness"].map(k => (
                                <div key={k} className="flex items-center gap-1.5">
                                    <div className="w-10 h-1 rounded-full bg-slate-800 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(q[k] / 10) * 10}%`, background: AREA_COLORS[k].bar }} />
                                    </div>
                                    {console.log(q)}
                                    <span className="mono text-[10px] text-slate-500">{AREA_LABELS[k][0]} {q[k] / 10}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.6)" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                </button>

                {/* Expanded content */}
                {expanded && (
                    <div className="border-t border-slate-800/60 px-6 py-5 flex flex-col gap-5">

                        {/* Metrics row */}
                        <div className="grid grid-cols-3 gap-4">
                            {["testCasePassPercentage", "correctness"].map(k => (
                                <MetricBar key={k} label={AREA_LABELS[k]} value={q[k] / 10} color={AREA_COLORS[k]} />
                            ))}
                        </div>

                        <div className="h-px bg-slate-800/60" />

                        {/* Your answer */}
                        <div>
                            <div className="mono text-slate-500 text-[10px] tracking-widest mb-2">YOUR ANSWER</div>
                            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
                                <p className="text-slate-300 text-sm leading-relaxed">{q.userAnswer}</p>
                            </div>
                        </div>

                        {/* Feedback */}
                        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
                            <div className="mono text-blue-400/70 text-[10px] tracking-widest mb-1.5">AI FEEDBACK</div>
                            <p className="text-slate-300 text-sm leading-relaxed">{q.feedback}</p>
                        </div>

                        {/* Strengths + Weaknesses */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="mono text-emerald-400/70 text-[10px] tracking-widest mb-2">STRENGTHS</div>
                                <div className="flex flex-col gap-1.5">
                                    {q.strengths.map((s, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">✓</span>
                                            <span className="text-slate-400 text-xs leading-relaxed">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="mono text-rose-400/70 text-[10px] tracking-widest mb-2">WEAKNESSES</div>
                                <div className="flex flex-col gap-1.5">
                                    {q.weaknesses.map((w, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="text-rose-400 text-xs mt-0.5 flex-shrink-0">✗</span>
                                            <span className="text-slate-400 text-xs leading-relaxed">{w}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Conceptual gaps */}
                        {q.conceptualGaps?.length > 0 && (
                            <div>
                                <div className="mono text-amber-400/70 text-[10px] tracking-widest mb-2">CONCEPTUAL GAPS</div>
                                <div className="flex flex-wrap gap-2">
                                    {q.conceptualGaps.map((g, i) => (
                                        <span key={i} className="mono text-[10px] text-amber-400 border border-amber-500/25 bg-amber-500/8 rounded-lg px-2.5 py-1">{g}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Improved answer */}
                        <div>
                            <div className="mono text-indigo-400/70 text-[10px] tracking-widest mb-2">IMPROVED ANSWER</div>
                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                                <p className="text-slate-300 text-sm leading-relaxed">{q.improvedAnswer}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    } else {
        return (
            <div className="rounded-2xl border border-slate-700/50 overflow-hidden transition-all duration-300"
                style={{ background: "rgba(10,15,30,0.85)", backdropFilter: "blur(24px)", outline: "1px solid rgba(255,255,255,0.025)" }}>

                {/* Card header   */}
                <button className="w-full text-left px-6 py-5 flex items-start gap-4 hover:bg-slate-800/20 transition-colors duration-150"
                    onClick={() => setExpanded(e => !e)}>
                    <ScoreRing score={q.score} size={72} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="mono text-slate-600 text-[10px] tracking-widest">Q{index + 1}</span>
                            <span className={`mono text-[10px] px-2 py-0.5 rounded-md border ${diff.text} ${diff.border} ${diff.bg}`}>
                                {q.difficulty}
                            </span>
                        </div>
                        <p className="text-slate-200 text-sm font-semibold leading-snug">{q.question}</p>
                        <div className="flex gap-4 mt-2.5">
                            {["clarity", "depth", "correctness"].map(k => (
                                <div key={k} className="flex items-center gap-1.5">
                                    <div className="w-10 h-1 rounded-full bg-slate-800 overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${(q[k] / 10) * 100}%`, background: AREA_COLORS[k].bar }} />
                                    </div>
                                    <span className="mono text-[10px] text-slate-500">{AREA_LABELS[k][0]} {q[k]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(100,116,139,0.6)" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s ease" }}>
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </div>
                </button>

                {/* Expand the content */}
                {expanded && (
                    <div className="border-t border-slate-800/60 px-6 py-5 flex flex-col gap-5">

                        {/* Metrics row */}
                        <div className="grid grid-cols-3 gap-4">
                            {["clarity", "depth", "correctness"].map(k => (
                                <MetricBar key={k} label={AREA_LABELS[k]} value={q[k]} color={AREA_COLORS[k]} />
                            ))}
                        </div>

                        <div className="h-px bg-slate-800/60" />

                        {/* Your answer */}
                        <div>
                            <div className="mono text-slate-500 text-[10px] tracking-widest mb-2">YOUR ANSWER</div>
                            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
                                <p className="text-slate-300 text-sm leading-relaxed">{q.userAnswer}</p>
                            </div>
                        </div>

                        {/* Feedback */}
                        <div className="rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
                            <div className="mono text-blue-400/70 text-[10px] tracking-widest mb-1.5">AI FEEDBACK</div>
                            <p className="text-slate-300 text-sm leading-relaxed">{q.feedback}</p>
                        </div>

                        {/* Strengths + Weaknesses */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="mono text-emerald-400/70 text-[10px] tracking-widest mb-2">STRENGTHS</div>
                                <div className="flex flex-col gap-1.5">
                                    {q.strengths.map((s, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="text-emerald-400 text-xs mt-0.5 flex-shrink-0">✓</span>
                                            <span className="text-slate-400 text-xs leading-relaxed">{s}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="mono text-rose-400/70 text-[10px] tracking-widest mb-2">WEAKNESSES</div>
                                <div className="flex flex-col gap-1.5">
                                    {q.weaknesses.map((w, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="text-rose-400 text-xs mt-0.5 flex-shrink-0">✗</span>
                                            <span className="text-slate-400 text-xs leading-relaxed">{w}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Conceptual gaps */}
                        {q.conceptualGaps?.length > 0 && (
                            <div>
                                <div className="mono text-amber-400/70 text-[10px] tracking-widest mb-2">CONCEPTUAL GAPS</div>
                                <div className="flex flex-wrap gap-2">
                                    {q.conceptualGaps.map((g, i) => (
                                        <span key={i} className="mono text-[10px] text-amber-400 border border-amber-500/25 bg-amber-500/8 rounded-lg px-2.5 py-1">{g}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Improved answer */}
                        <div>
                            <div className="mono text-indigo-400/70 text-[10px] tracking-widest mb-2">IMPROVED ANSWER</div>
                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3">
                                <p className="text-slate-300 text-sm leading-relaxed">{q.improvedAnswer}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    };
}

export default function InterviewReport() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [mounted, setMounted] = useState(false);
    const [data, setData] = useState(MOCK_REPORT);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        const interviewData = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/api/interview/report/${id}`,
                    {
                        withCredentials: true,
                    }
                );
                console.log(res.data);
                setData(res.data);

            } catch (error) {

            }
        }
        interviewData();
    }, []);

    if (!data) return null;


    const { interview, analytics, questions } = data;
    const scoreColor = interview.finalScore >= 8 ? "#22d3ee" : interview.finalScore >= 6 ? "#3b82f6" : "#818cf8";
    const formattedDate = new Date(interview.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
        <div
            className={`relative min-h-screen w-full bg-[#020409] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .fu  { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
        .fu2 { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.08s both; }
        .fu3 { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.16s both; }
        .fu4 { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.24s both; }
        .fu5 { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.32s both; }
      `}</style>

            <div className="fixed inset-0 z-0 pointer-events-none opacity-20"
                style={{ backgroundImage: `linear-gradient(rgba(59,130,246,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.2) 1px,transparent 1px)`, backgroundSize: '56px 56px' }} />
            <div className="fixed -top-40 -left-40 w-[560px] h-[560px] rounded-full z-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle,rgba(37,99,235,.13) 0%,transparent 70%)' }} />
            <div className="fixed -bottom-40 -right-40 w-[480px] h-[480px] rounded-full z-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 70%)' }} />

            <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 border-b border-slate-800/60"
                style={{ background: 'rgba(2,4,9,0.85)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-3.5 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span className="mono text-blue-400 text-[11px] tracking-[0.14em]">AI INTERVIEW ENGINE</span>
                    </div>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="mono text-slate-600 text-[11px] tracking-wider">INTERVIEW REPORT</span>
                </div>
                <button onClick={() => navigate("/")}
                    className="mono text-slate-400 text-xs border border-slate-700/60 rounded-xl px-4 py-2 hover:border-blue-500/40 hover:text-blue-400 transition-all duration-200 flex items-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    Dashboard
                </button>
            </header>

            <div className="relative z-10 max-w-[1000px] mx-auto px-6 py-8 flex flex-col gap-6">

                <div className="fu grid grid-cols-1 md:grid-cols-3 gap-4">

                    <div className="md:col-span-1 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center py-8 gap-3"
                        style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(24px)', outline: '1px solid rgba(255,255,255,0.025)' }}>
                        <div className="mono text-slate-500 text-[11px] tracking-widest">FINAL SCORE</div>
                        <ScoreRing score={interview.finalScore} size={110} />
                        <div className="mono text-xs tracking-wider" style={{ color: scoreColor }}>
                            {interview.finalScore >= 8 ? "Excellent" : interview.finalScore >= 6 ? "Good" : "Needs Work"}
                        </div>
                    </div>

                    <div className="md:col-span-2 rounded-2xl border border-slate-700/50 px-6 py-5 flex flex-col justify-between gap-5"
                        style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(24px)', outline: '1px solid rgba(255,255,255,0.025)' }}>

                        <div>
                            <div className="mono text-slate-500 text-[10px] tracking-widest mb-1.5">SESSION DETAILS</div>
                            <h1 className="text-2xl font-extrabold text-slate-100">{interview.topic}</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="mono text-slate-500 text-xs">{formattedDate}</span>
                                <span className="text-slate-700 text-xs">·</span>
                                <span className="mono text-slate-500 text-xs">{interview.totalQuestions} Questions</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {interview.topic === "DSA"
                                ? [
                                    { key: "testCasePassPercentage", analyticsKey: "averageTestCasePassPercentage" },
                                    { key: "correctness", analyticsKey: "averageCorrectness" },
                                    { key: "codeQuality", analyticsKey: "averageCodeQuality" }
                                ].map(({ key, analyticsKey }) => (
                                    <MetricBar
                                        key={key}
                                        label={AREA_LABELS[key]}
                                        value={analytics[analyticsKey]}
                                        color={AREA_COLORS[key]}
                                    />
                                ))
                                : ["clarity", "depth", "correctness"].map(k => (
                                    <MetricBar
                                        key={k}
                                        label={AREA_LABELS[k]}
                                        value={analytics[`average${k.charAt(0).toUpperCase() + k.slice(1)}`]}
                                        color={AREA_COLORS[k]}
                                    />
                                ))
                            }
                        </div>
                    </div>
                </div>

                <div className="fu2 grid grid-cols-2 gap-4">
                    {[
                        { label: "STRONGEST AREA", key: analytics.strongestArea, icon: "↑", textColor: "text-emerald-400", borderColor: "border-emerald-500/25", bgColor: "bg-emerald-500/6" },
                        { label: "WEAKEST AREA", key: analytics.weakestArea, icon: "↓", textColor: "text-rose-400", borderColor: "border-rose-500/25", bgColor: "bg-rose-500/6" },
                    ].map(({ label, key, icon, textColor, borderColor, bgColor }) => (
                        <div key={label} className={`rounded-xl border ${borderColor} ${bgColor} px-5 py-4 flex items-center gap-4`}>
                            <div className={`text-2xl font-black ${textColor}`}>{icon}</div>
                            <div>
                                <div className="mono text-slate-500 text-[10px] tracking-widest">{label}</div>
                                <div className={`font-bold text-base mt-0.5 ${textColor}`}>{AREA_LABELS[key]}</div>
                                <div className="mono text-slate-500 text-xs mt-0.5">
                                    {console.log(analytics)}
                                    {console.log(analytics[`average${key.charAt(0).toUpperCase() + key.slice(1)}`])}
                                    Avg: {analytics[`average${key.charAt(0).toUpperCase() + key.slice(1)}`]} / 10
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {console.log(analytics)}
                <div className="fu3 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="mono text-slate-500 text-[11px] tracking-[0.16em]">QUESTION BREAKDOWN</div>
                        <div className="flex-1 h-px bg-slate-800/60" />
                        <div className="mono text-slate-600 text-[10px]">{questions.length} questions — click to expand</div>
                    </div>
                    <div className="flex flex-col gap-3">

                        {questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} topic={interview.topic} analytics={analytics} />)}
                    </div>
                </div>

                <div className="fu4 flex items-center justify-between pt-2 pb-6">
                    <p className="mono text-slate-700 text-[10px] tracking-widest">
                        Adaptive AI · Real-time Feedback · Detailed Analysis
                    </p>
                    <button onClick={() => navigate("/")}
                        className="py-3 px-6 rounded-[13px] font-bold text-sm tracking-wider text-white transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}

                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.3)'}>
                        Back to Dashboard
                    </button>
                </div>

            </div>
        </div>
    );
}
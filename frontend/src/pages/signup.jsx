import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { myContext } from "../App";
import api from "../api";

const STATS = [
    { label: "Questions", value: "10K+", x: "18%", y: "22%", delay: 0 },
    { label: "Sessions", value: "3.2K", x: "72%", y: "15%", delay: 0.4 },
    { label: "Avg Score", value: "7.8", x: "12%", y: "68%", delay: 0.8 },
    { label: "Accuracy", value: "94%", x: "68%", y: "72%", delay: 1.2 },
    { label: "Domains", value: "5", x: "42%", y: "85%", delay: 0.6 },
];

function FloatNode({ stat }) {
    return (
        <div className="absolute flex flex-col items-center gap-1 select-none pointer-events-none"
            style={{ left: stat.x, top: stat.y, animation: `float ${3 + parseFloat(stat.delay)}s ease-in-out ${stat.delay}s infinite alternate` }}>
            <div className="text-2xl font-extrabold" style={{ color: "#3b82f6", textShadow: "0 0 20px rgba(59,130,246,0.6)" }}>{stat.value}</div>
            <div className="mono text-[10px] text-slate-500 tracking-widest">{stat.label.toUpperCase()}</div>
            <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: "#3b82f6", boxShadow: "0 0 6px #3b82f6" }} />
        </div>
    );
}

function useSequentialTyper(lines, charDelay = 38) {
    const [lineStates, setLineStates] = useState(lines.map(() => ""));
    const [currentLine, setCurrentLine] = useState(0);
    const [allDone, setAllDone] = useState(false);
    const stopped = useRef(false);

    useEffect(() => {
        stopped.current = false;
        setLineStates(lines.map(() => ""));
        setCurrentLine(0);
        setAllDone(false);
        return () => { stopped.current = true; };
    }, []);

    useEffect(() => {
        if (stopped.current) return;
        if (currentLine >= lines.length) { setAllDone(true); return; }
        if (lines[currentLine]?.skip) { setCurrentLine(c => c + 1); return; }

        const text = lines[currentLine].text;
        const typed = lineStates[currentLine].length;

        if (typed >= text.length) {
            const t = setTimeout(() => { if (!stopped.current) setCurrentLine(c => c + 1); }, 110);
            return () => clearTimeout(t);
        }

        const t = setTimeout(() => {
            if (!stopped.current) {
                setLineStates(prev => {
                    const n = [...prev];
                    n[currentLine] = text.slice(0, typed + 1);
                    return n;
                });
            }
        }, charDelay);
        return () => clearTimeout(t);
    }, [currentLine, lineStates]);

    return { lineStates, currentLine, allDone };
}

const SIGNUP_FIELDS = [
    { key: "name", prompt: "what should we call you?", type: "text", placeholder: "your full name" },
    { key: "email", prompt: "your email address", type: "email", placeholder: "you@example.com" },
    { key: "password", prompt: "create a strong password", type: "password", placeholder: "min 8 characters" },
    { key: "confirm", prompt: "confirm your password", type: "password", placeholder: "repeat password" },
];

const HEADER_LINES = [
    { text: "// create_account.sh", color: "rgba(59,130,246,0.45)" },
    { text: "session@ai-interview ~ signup", color: "rgba(100,116,139,0.6)" },
    { text: "", color: "", skip: true },
    { text: "$ initializing secure channel...", color: "rgba(100,116,139,0.55)" },
    { text: "  ✓ connected", color: "rgba(52,211,153,0.7)" },
    { text: "$ preparing registration flow...", color: "rgba(100,116,139,0.55)" },
    { text: "  ✓ ready", color: "rgba(52,211,153,0.7)" },
    { text: "", color: "", skip: true },
];

export default function SignupPage() {
    const context = useContext(myContext);
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);

    const [step, setStep] = useState(0);
    const [fields, setFields] = useState({});
    const [current, setCurrent] = useState("");
    const [fieldError, setFieldError] = useState("");
    const [history, setHistory] = useState([]);
    const [submitted, setSubmitted] = useState(false);

    const inputRef = useRef(null);
    const { lineStates: headerStates, allDone: headerDone } = useSequentialTyper(HEADER_LINES, 36);

    const currentField = SIGNUP_FIELDS[step];

    const [promptText, setPromptText] = useState("");
    const [promptDone, setPromptDone] = useState(false);

    useEffect(() => {
        if (!headerDone || submitted) return;
        const target = currentField ? `› ${currentField.prompt}` : "";
        setPromptText("");
        setPromptDone(false);
        let i = 0;
        const iv = setInterval(() => {
            i++;
            setPromptText(target.slice(0, i));
            if (i >= target.length) { clearInterval(iv); setPromptDone(true); }
        }, 36);
        return () => clearInterval(iv);
    }, [headerDone, step, submitted]);

    useEffect(() => {
        if (promptDone && inputRef.current) inputRef.current.focus();
    }, [promptDone]);

    const register = async (userData) => {
        try {
            const res = await api.post(`/auth/signup`, userData);
            console.log(res);
            if (res.data.success) {
                context.setIsLoggedIn(true);
                navigate("/");
            }
        } catch (error) {
            console.log(error);
        }
    }

    const handleKey = async (e) => {
        if (e.key !== "Enter") return;
        const val = current.trim();
        if (!val) { setFieldError("this field cannot be empty"); return; }
        if (currentField.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            setFieldError("enter a valid email address"); return;
        }
        if (currentField.key === "password" && val.length < 8) {
            setFieldError("password must be at least 8 characters"); return;
        }
        if (currentField.key === "confirm" && val !== fields["password"]) {
            setFieldError("passwords do not match"); return;
        }
        setFieldError("");
        const masked = currentField.type === "password" ? "•".repeat(val.length) : val;
        setHistory(h => [...h, { prompt: currentField.prompt, value: masked }]);
        setFields(f => ({ ...f, [currentField.key]: val }));
        setCurrent("");
        if (step + 1 >= SIGNUP_FIELDS.length) {
            setSubmitted(true);
            console.log("Signup:", { ...fields, [currentField.key]: val });
            try {
                const userData = {
                    name: fields.name,
                    email: fields.email,
                    password: val
                };

                await register(userData);

                setSubmitted(true);
            } catch (err) {
                setFieldError(err.message);
            }

        } else {
            setStep(s => s + 1);
        }
    };

    useEffect(() => { setMounted(true); }, []);

    return (
        <div className={`relative w-screen h-screen overflow-hidden flex bg-[#020409] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; }
        .mono { font-family:'JetBrains Mono',monospace; }
        @keyframes float    { from{transform:translateY(0)} to{transform:translateY(-14px)} }
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulseGlow{ 0%,100%{opacity:.4} 50%{opacity:.9} }
        @keyframes scanline { 0%{top:-4%} 100%{top:104%} }
        @keyframes radarSweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dotPulse { 0%,100%{opacity:.3;r:2} 50%{opacity:1;r:3.5} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .cursor { display:inline-block; width:8px; height:.85em; background:#3b82f6; margin-left:1px; vertical-align:text-bottom; animation:blink 1s step-end infinite; }
        .scanline-el { position:absolute; left:0; right:0; height:2px; background:linear-gradient(transparent,rgba(59,130,246,0.07),transparent); animation:scanline 6s linear infinite; pointer-events:none; }
        .ring { position:absolute; border:1px solid rgba(59,130,246,0.07); border-radius:50%; animation:pulseGlow 3s ease-in-out infinite; }
        .term-input { background:transparent; border:none; outline:none; color:#e2e8f0; caret-color:#3b82f6; font-family:'JetBrains Mono',monospace; font-size:14px; width:100%; }
        .term-input::placeholder { color:rgba(100,116,139,0.3); }
        .grid-bg { background-image:linear-gradient(rgba(59,130,246,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.12) 1px,transparent 1px); background-size:48px 48px; }
        .fi { animation:fadeIn .35s ease both; }
        .su { animation:slideUp .35s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

            {/* ══ LEFT  ══ */}
            <div className="relative hidden lg:flex flex-col justify-between" style={{ width: "48%", borderRight: "1px solid rgba(59,130,246,0.08)" }}>
                <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
                <div className="scanline-el" />
                <div className="absolute -top-20 -left-20 w-[420px] h-[420px] rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle,rgba(37,99,235,.16) 0%,transparent 65%)" }} />
                <div className="absolute -bottom-16 -right-16 w-[320px] h-[320px] rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 65%)" }} />
                <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <radialGradient id="radarFade" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.07" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <circle cx="250" cy="250" r="220" fill="url(#radarFade)" />
                    {[60, 110, 160, 210].map((r, i) => (
                        <circle key={r} cx="250" cy="250" r={r}
                            fill="none" stroke="#3b82f6"
                            strokeWidth={i === 3 ? "0.5" : "0.4"}
                            strokeOpacity={i === 3 ? "0.18" : "0.1"}
                            strokeDasharray={i % 2 === 0 ? "4 8" : "2 12"}
                        />
                    ))}
                    <circle cx="250" cy="250" r="215" fill="none" stroke="#3b82f6" strokeWidth="0.6" strokeOpacity="0.12" />
                    <line x1="250" y1="40" x2="250" y2="460" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.08" strokeDasharray="3 10" />
                    <line x1="40" y1="250" x2="460" y2="250" stroke="#3b82f6" strokeWidth="0.4" strokeOpacity="0.08" strokeDasharray="3 10" />
                    <line x1="98" y1="98" x2="402" y2="402" stroke="#3b82f6" strokeWidth="0.3" strokeOpacity="0.05" strokeDasharray="3 14" />
                    <line x1="402" y1="98" x2="98" y2="402" stroke="#3b82f6" strokeWidth="0.3" strokeOpacity="0.05" strokeDasharray="3 14" />

                    {[
                        { cx: 310, cy: 90, r: 2.5, delay: "0s", dur: "2.4s" },
                        { cx: 420, cy: 220, r: 2, delay: "0.6s", dur: "3.1s" },
                        { cx: 370, cy: 380, r: 3, delay: "1.2s", dur: "2.7s" },
                        { cx: 140, cy: 390, r: 2, delay: "0.3s", dur: "3.4s" },
                        { cx: 80, cy: 180, r: 2.5, delay: "0.9s", dur: "2.2s" },
                        { cx: 250, cy: 45, r: 2, delay: "1.5s", dur: "3s" },
                    ].map((d, i) => (
                        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill="#3b82f6"
                            style={{ filter: "drop-shadow(0 0 4px #3b82f6)", animation: `dotPulse ${d.dur} ease-in-out ${d.delay} infinite` }} />
                    ))}
                    <circle cx="250" cy="250" r="3.5" fill="#3b82f6" fillOpacity="0.6"
                        style={{ filter: "drop-shadow(0 0 8px rgba(59,130,246,0.9))" }} />
                    <circle cx="250" cy="250" r="1.5" fill="#93c5fd" />
                </svg>
                {STATS.map(s => <FloatNode key={s.label} stat={s} />)}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-12 text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="mono text-blue-400 text-[11px] tracking-[0.14em]">AI INTERVIEW ENGINE</span>
                    </div>
                    <h1 className="text-5xl font-extrabold text-slate-100 leading-[1.05] tracking-tight">
                        Your journey<br />
                        <span style={{ background: "linear-gradient(135deg,#3b82f6,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            starts here.
                        </span>
                    </h1>
                    <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                        Join thousands preparing smarter with AI-driven mock interviews and real-time feedback.
                    </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-10 py-4 flex items-center justify-between border-t border-slate-800/30">
                    {["DSA", "OS", "CN", "DBMS", "HR"].map(t => (
                        <span key={t} className="mono text-[11px] text-slate-700 tracking-wider">{t}</span>
                    ))}
                </div>
            </div>

            <div className="relative flex-1 flex flex-col" style={{ background: "rgba(3,6,16,0.98)" }}>
                <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.35),transparent)" }} />

                <div className="flex items-center justify-between px-8 py-5">
                    <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/60 rounded-full p-1">
                        <button onClick={() => navigate("/login")}
                            className="mono text-xs tracking-wider px-4 py-1.5 rounded-full text-slate-500 hover:text-slate-300 transition-colors">
                            Sign In
                        </button>
                        <button onClick={() => navigate("/register")}
                            className="mono text-xs tracking-wider px-4 py-1.5 rounded-full bg-blue-600 text-white shadow-lg">
                            Sign Up
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {["bg-red-500/40", "bg-amber-500/40", "bg-emerald-500/40"].map((c, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center px-10 lg:px-16 pb-10 gap-2"
                    onClick={() => inputRef.current?.focus()}>

                    {HEADER_LINES.map((line, i) => {
                        if (line.skip) return <div key={i} className="h-2" />;
                        const typed = headerStates[i];
                        const isTyping = typed.length > 0 && typed.length < line.text.length;
                        return (
                            <div key={i} className="mono text-sm leading-snug" style={{ color: line.color, minHeight: "1.4em" }}>
                                {typed}
                                {isTyping && <span className="cursor" />}
                            </div>
                        );
                    })}

                    {headerDone && (
                        <div className="fi h-px my-2" style={{ background: "rgba(30,41,59,0.7)" }} />
                    )}

                    {history.map((h, i) => (
                        <div key={i} className="su flex flex-col gap-0.5 mb-1">
                            <div className="mono text-xs" style={{ color: "rgba(100,116,139,0.55)" }}>
                                <span style={{ color: "rgba(59,130,246,0.5)" }}>›</span> {h.prompt}
                            </div>
                            <div className="mono text-sm text-slate-300 pl-4">{h.value}</div>
                        </div>
                    ))}

                    {headerDone && !submitted && (
                        <div className="flex flex-col gap-4 mt-2">
                            <div className="mono text-sm leading-snug" style={{ color: "rgba(148,163,184,0.85)", minHeight: "1.4em" }}>
                                {promptText}
                                {!promptDone && promptText.length > 0 && <span className="cursor" />}
                            </div>

                            {promptDone && (
                                <>
                                    <div className="fi flex items-center gap-3 pb-2"
                                        style={{ borderBottom: `1px solid ${fieldError ? "rgba(248,113,113,0.35)" : "rgba(51,65,85,0.7)"}` }}>
                                        <span className="mono text-blue-500 text-sm flex-shrink-0">$</span>
                                        <input ref={inputRef} type={currentField?.type} value={current}
                                            onChange={e => { setCurrent(e.target.value); setFieldError(""); }}
                                            onKeyDown={handleKey} placeholder={currentField?.placeholder}
                                            className="term-input" autoComplete="off" />
                                        <span className="cursor flex-shrink-0" />
                                    </div>

                                    {fieldError && (
                                        <div className="fi mono text-xs flex items-center gap-2" style={{ color: "rgba(248,113,113,0.8)" }}>
                                            <span>✗</span> {fieldError}
                                        </div>
                                    )}

                                    <div className="fi flex items-center gap-3">
                                        <div className="flex gap-1.5">
                                            {SIGNUP_FIELDS.map((_, i) => (
                                                <div key={i} className="transition-all duration-300" style={{
                                                    width: i === step ? 20 : 6, height: 4, borderRadius: 99,
                                                    background: i < step ? "#3b82f6" : i === step ? "#3b82f6" : "rgba(51,65,85,0.8)",
                                                    boxShadow: i === step ? "0 0 8px rgba(59,130,246,0.6)" : "none"
                                                }} />
                                            ))}
                                        </div>
                                        <span className="mono text-[10px] tracking-wider" style={{ color: "rgba(71,85,105,0.8)" }}>
                                            step {step + 1} of {SIGNUP_FIELDS.length} — press Enter
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {submitted && (
                        <div className="fi flex flex-col gap-4 mt-2">
                            <div className="mono text-sm" style={{ color: "rgba(52,211,153,0.85)" }}>
                                ✓ account created successfully. welcome aboard.
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(30,41,59,0.8)" }}>
                                    <div className="h-full rounded-full" style={{ width: "100%", background: "linear-gradient(90deg,#1d4ed8,#4f46e5)", boxShadow: "0 0 10px rgba(59,130,246,0.5)", transition: "width 0.8s ease" }} />
                                </div>
                                <span className="mono text-blue-400 text-xs">100%</span>
                            </div>
                            <button onClick={() => navigate("/")}
                                className="self-start mono text-sm border rounded-xl px-5 py-2.5 transition-all duration-200"
                                style={{ color: "#3b82f6", borderColor: "rgba(59,130,246,0.3)" }}
                                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.08)"}
                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                → continue to dashboard
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-10 lg:px-16 pb-6 flex items-center justify-between">
                    <p className="mono text-[10px] tracking-widest" style={{ color: "rgba(30,41,59,1)" }}>
                        Adaptive AI · Real-time Feedback
                    </p>
                    <button onClick={() => navigate("/login")}
                        className="mono text-[10px] transition-colors"
                        style={{ color: "rgba(71,85,105,0.7)" }}
                        onMouseEnter={e => e.currentTarget.style.color = "rgba(148,163,184,0.8)"}
                        onMouseLeave={e => e.currentTarget.style.color = "rgba(71,85,105,0.7)"}>
                        have an account? sign in →
                    </button>
                </div>
            </div>
        </div>
    );
}
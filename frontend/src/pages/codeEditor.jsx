import Editor from "@monaco-editor/react";
import axios from "axios";
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";

const LANGUAGES = [
    { id: "javascript", label: "JavaScript", icon: "JS", iconColor: "#f7df1e", iconBg: "rgba(247,223,30,0.12)", monacoLang: "javascript", ext: "js", defaultCode: `function solve(input) {\n  // Write your solution here\n  \n}\n` },
    { id: "python", label: "Python", icon: "PY", iconColor: "#4b8bbe", iconBg: "rgba(75,139,190,0.12)", monacoLang: "python", ext: "py", defaultCode: `def solve(input):\n    # Write your solution here\n    pass\n` },
    { id: "cpp", label: "C++", icon: "C++", iconColor: "#00bcd4", iconBg: "rgba(0,188,212,0.1)", monacoLang: "cpp", ext: "cpp", defaultCode: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    \n    return 0;\n}\n` },
    { id: "java", label: "Java", icon: "JV", iconColor: "#f89820", iconBg: "rgba(248,152,32,0.12)", monacoLang: "java", ext: "java", defaultCode: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n        \n    }\n}\n` },
];

const MOCK_QUESTION = {
    number: 1,
    title: "Two Sum",
    difficulty: "easy",
    topic: "Arrays · Hash Map",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
    examples: [
        { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
        { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "nums[1] + nums[2] = 2 + 4 = 6" },
    ],
    constraints: [
        "2 ≤ nums.length ≤ 10⁴",
        "-10⁹ ≤ nums[i] ≤ 10⁹",
        "Only one valid answer exists",
    ],
    InputFormat: "",
};

const MOCK_TESTCASES = [
    { id: 1, label: "Case 1", input: "nums = [2, 7, 11, 15]\ntarget = 9", expected: "[0, 1]", status: null, output: null },
    { id: 2, label: "Case 2", input: "nums = [3, 2, 4]\ntarget = 6", expected: "[1, 2]", status: null, output: null },
    { id: 3, label: "Case 3", input: "nums = [3, 3]\ntarget = 6", expected: "[0, 1]", status: null, output: null },
];

const DIFF_STYLE = {
    easy: { color: "#22d3ee", bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.25)" },
    medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
    hard: { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)" },
};

const STATUS_STYLE = {
    pass: { dot: "#22d3ee", text: "#22d3ee", borderColor: "rgba(34,211,238,0.25)", bgColor: "rgba(34,211,238,0.05)", label: "PASS" },
    fail: { dot: "#f87171", text: "#f87171", borderColor: "rgba(248,113,113,0.25)", bgColor: "rgba(248,113,113,0.05)", label: "FAIL" },
    null: { dot: "rgba(100,116,139,0.35)", text: "#475569", borderColor: "rgba(51,65,85,0.5)", bgColor: "rgba(15,20,40,0.6)", label: "" },
};

function QuestionText({ text }) {
    const parts = text.split(/(`[^`]+`)/g);
    return (
        <p className="text-slate-400 text-sm leading-relaxed">
            {parts.map((p, i) =>
                p.startsWith("`") && p.endsWith("`")
                    ? <code key={i} className="mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded text-xs">{p.slice(1, -1)}</code>
                    : p
            )}
        </p>
    );
}

export default function CodingPage({ question = MOCK_QUESTION, testcases = MOCK_TESTCASES, onSubmit }) {
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const [code, setCode] = useState(LANGUAGES[0].defaultCode);
    const [activeTab, setActiveTab] = useState(0);
    const [cases, setCases] = useState(testcases);
    const [running, setRunning] = useState(false);
    const [runDone, setRunDone] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitDone, setSubmitDone] = useState(false);
    const editorRef = useRef(null);

    const [qData, setQData] = useState(MOCK_QUESTION);
    const [starterCodes, setStarterCodes] = useState({});
    const [driverCode, setDriverCode] = useState({});
    const InterviewId = useParams().id;
    const navigate = useNavigate();

    const [finished, setFinished] = useState(false);
    const [mounted, setMounted] = useState(false);
    const totalQuestions = 5;

    useEffect(() => {
        setMounted(true);
    }, []);

    const applyQuestionData = (backend, currentLang) => {
        setQData({
            number: 5,
            title: backend.title,
            difficulty: backend.difficulty,
            topic: backend.topic,
            description: backend.description,
            examples: backend.examples,
            constraints: backend.constraints,
            InputFormat: backend.InputFormat,
        });

        const mappedTestcases = backend.examples.map((tc, index) => ({
            id: index + 1,
            label: `Case ${index + 1}`,
            input: tc.input,
            expected: tc.output,
            status: null,
            output: null,
        }));
        setCases(mappedTestcases);

        setStarterCodes(backend.functionSignature);
        setCode(backend.functionSignature[currentLang.id] ?? currentLang.defaultCode);
        setDriverCode(backend.driverCode);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/interview/${InterviewId}/currentDSA`);
                applyQuestionData(res.data.question, selectedLang);
            } catch (error) {
                console.error("Failed to fetch question:", error);
            }
        };
        fetchData();
    }, [InterviewId]);

    const handleLangChange = (lang) => {
        setSelectedLang(lang);
        setCode(starterCodes[lang.id] ?? lang.defaultCode);
        setRunDone(false);
        setCases(prev => prev.map(t => ({ ...t, status: null, output: null })));
    };

    const handleRun = async () => {
        setRunning(true);
        setRunDone(false);

        try {
            const data = {
                code: code,
                language: selectedLang.id,
                InterviewId,
            };

            const res = await api.post(
                `/interview/run`,
                data,

            );

            console.log(res);

            const mappedTestcases = res.data.results.map((tc, index) => ({
                id: index + 1,
                label: `Case ${index + 1}`,
                input: tc.input,
                expected: tc.expected,
                output: tc.output,
                status: tc.output === tc.expected ? "pass" : "fail",
            }));

            console.log(mappedTestcases);

            setCases(mappedTestcases);
            setRunDone(true);
        } catch (error) {
            console.error(error);
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setSubmitDone(false);
        const data = {
            code: code,
            language: selectedLang.id,
            InterviewId,
        };
        try {
            const res = await api.post(
                `/interview/submitDSA`,
                data,

            );
            console.log(res);

            const backend = res.data.question;
            if (!backend) {
                setFinished(true);
                return;
            }

            applyQuestionData(backend, selectedLang);
            setSubmitDone(true);
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const report = () => {
        navigate(`/report/${InterviewId}`);
    };

    const passCount = cases.filter(c => c.status === "pass").length;
    const failCount = cases.filter(c => c.status === "fail").length;
    const activeCase = cases[activeTab];
    const st = STATUS_STYLE[activeCase?.status ?? "null"];
    const diff = DIFF_STYLE[qData.difficulty] ?? DIFF_STYLE.easy;

    const TOP_H = 48;
    const TESTCASE_H = 188;
    const EDITOR_H = `calc(100vh - ${TOP_H}px - ${TESTCASE_H}px)`;

    if (finished) {
        return (
            <div
                className={`relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#020409] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
                style={{ fontFamily: "'Syne', sans-serif" }}
            >
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
          .mono { font-family: 'JetBrains Mono', monospace; }
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px);} to {opacity:1;transform:translateY(0);} }
          @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.15);opacity:.1} }
          .fu { animation: fadeUp 0.6s cubic-bezier(.16,1,.3,1) both; }
          .fu2 { animation: fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.1s both; }
          .fu3 { animation: fadeUp 0.6s cubic-bezier(.16,1,.3,1) 0.2s both; }
          .ring { animation: pulse-ring 2s ease-in-out infinite; }
        `}</style>
                <div
                    className="absolute inset-0 z-0 pointer-events-none opacity-20"
                    style={{
                        backgroundImage: `linear-gradient(rgba(59,130,246,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.2) 1px,transparent 1px)`,
                        backgroundSize: "56px 56px",
                    }}
                />
                <div
                    className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle,rgba(37,99,235,.13) 0%,transparent 70%)", transform: "translate(-30%,-30%)" }}
                />

                <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-md px-6">
                    <div className="relative fu">
                        <div className="ring absolute inset-0 rounded-full border-2 border-emerald-500/30" style={{ margin: "-10px" }} />
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                    </div>
                    <div className="fu2 flex flex-col gap-2">
                        <h2 className="text-3xl font-extrabold text-slate-100">Session Complete</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            You've answered all {totalQuestions} questions. Your responses have been recorded.
                        </p>
                    </div>
                    <div className="fu3 grid grid-cols-3 gap-3 w-full">
                        {[["5", "Answered"], ["100%", "Completion"], ["✓", "Submitted"]].map(([v, l]) => (
                            <div key={l} className="bg-slate-900/60 border border-slate-800/70 rounded-xl py-3 px-2 text-center">
                                <div className="text-blue-500 font-bold text-lg">{v}</div>
                                <div className="mono text-slate-500 text-[10px] mt-0.5 tracking-wider">{l}</div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={report}
                        className="fu3 w-full py-3.5 rounded-[13px] font-bold text-sm tracking-wider text-white transition-all duration-200"
                        style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 28px rgba(37,99,235,0.5)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.3)")}
                    >
                        View Results
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Syne',sans-serif", width: "100vw", height: "100vh", display: "flex", flexDirection: "column", background: "#020409", overflow: "hidden" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; }
        .mono { font-family:'JetBrains Mono',monospace; }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes pulseDot  { 0%,100%{opacity:.5} 50%{opacity:1} }
        .fi      { animation:fadeIn .25s ease both; }
        .spinner { animation:spin .8s linear infinite; }
        .run-btn:not(:disabled):hover   { box-shadow:0 0 18px rgba(34,211,238,0.28); transform:translateY(-1px); }
        .run-btn:not(:disabled):active  { transform:scale(0.97); }
        .sub-btn:hover  { box-shadow:0 6px 20px rgba(37,99,235,0.4); transform:translateY(-1px); }
        .sub-btn:active { transform:scale(0.97); }
        .lang-btn:hover { border-color:rgba(59,130,246,0.45) !important; }
        .tc-tab:hover   { background:rgba(59,130,246,0.06); }
        .q-scroll::-webkit-scrollbar { width:4px; }
        .q-scroll::-webkit-scrollbar-track { background:transparent; }
        .q-scroll::-webkit-scrollbar-thumb { background:rgba(59,130,246,0.2); border-radius:99px; }
        .e-scroll::-webkit-scrollbar { width:4px; }
        .e-scroll::-webkit-scrollbar-thumb { background:rgba(59,130,246,0.15); border-radius:99px; }
      `}</style>

            <div style={{ height: TOP_H, background: "rgba(4,8,20,0.98)", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, zIndex: 10 }}>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)", borderRadius: 99, padding: "4px 12px" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", boxShadow: "0 0 6px #3b82f6", animation: "pulseDot 2s ease-in-out infinite" }} />
                        <span className="mono" style={{ color: "#60a5fa", fontSize: 10, letterSpacing: "0.14em" }}>AI INTERVIEW ENGINE</span>
                    </div>
                    <span style={{ color: "rgba(51,65,85,0.8)", fontSize: 12 }}>·</span>
                    <span style={{ color: "rgba(100,116,139,0.6)", fontSize: 12, fontWeight: 600 }}>
                        #{qData.number} {qData.title}
                    </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {LANGUAGES.map(lang => (
                        <button key={lang.id} onClick={() => handleLangChange(lang)}
                            className="lang-btn mono"
                            style={{
                                fontSize: 11, padding: "5px 12px", borderRadius: 8,
                                border: `1px solid ${selectedLang.id === lang.id ? lang.iconColor + "55" : "rgba(51,65,85,0.55)"}`,
                                background: selectedLang.id === lang.id ? lang.iconBg : "transparent",
                                color: selectedLang.id === lang.id ? lang.iconColor : "rgba(100,116,139,0.65)",
                                fontWeight: selectedLang.id === lang.id ? 600 : 400,
                                cursor: "pointer", transition: "all .15s ease",
                            }}>
                            {lang.label}
                        </button>
                    ))}
                </div>

                =                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={handleRun} disabled={running}
                        className="run-btn mono"
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 10,
                            border: `1px solid ${running ? "rgba(34,211,238,0.18)" : "rgba(34,211,238,0.35)"}`,
                            color: running ? "rgba(34,211,238,0.45)" : "#22d3ee",
                            background: "rgba(34,211,238,0.06)",
                            cursor: running ? "not-allowed" : "pointer",
                            transition: "all .2s ease",
                        }}>
                        {running ? (
                            <><svg className="spinner" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>Running...</>
                        ) : (
                            <><svg width="11" height="11" viewBox="0 0 24 24" fill="#22d3ee"><polygon points="5 3 19 12 5 21 5 3" /></svg>Run</>
                        )}
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} className="sub-btn mono"
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            fontSize: 13, fontWeight: 700, padding: "6px 18px", borderRadius: 10, color: "white", cursor: submitting ? "not-allowed" : "pointer", transition: "all .2s ease", background: "linear-gradient(135deg,#1d4ed8,#4f46e5)", boxShadow: "0 2px 12px rgba(37,99,235,0.25)", border: "none"
                        }}>
                        {submitting ? (
                            <><svg className="spinner" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>Submitting...</>
                        ) : (
                            <><svg width="11" height="11" viewBox="0 0 24 24" fill="#22d3ee"><polygon points="5 3 19 12 5 21 5 3" /></svg>Submit</>
                        )}
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

                <div className="q-scroll" style={{ width: "50%", borderRight: "1px solid rgba(30,41,59,0.8)", overflowY: "auto", background: "rgba(4,8,20,0.6)" }}>
                    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <span className="mono" style={{ fontSize: 11, color: "rgba(100,116,139,0.5)", letterSpacing: "0.12em" }}>#{qData.number}</span>
                                <h2 style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>{qData.title}</h2>
                                <span className="mono" style={{ fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6, color: diff.color, background: diff.bg, border: `1px solid ${diff.border}`, letterSpacing: "0.1em" }}>
                                    {qData.difficulty.toUpperCase()}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.1em" }}>{qData.topic}</span>
                            </div>
                        </div>

                        <div style={{ height: 1, background: "rgba(30,41,59,0.8)" }} />

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.15em" }}>DESCRIPTION</div>
                            {qData.description.split("\n\n").map((para, i) => (
                                <QuestionText key={i} text={para} />
                            ))}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.15em" }}>INPUT FORMAT</div>
                            {(Array.isArray(qData.InputFormat)
                                ? qData.InputFormat
                                : qData.InputFormat?.split("\n")
                            )?.map((para, i) => (
                                <QuestionText key={i} text={para} />
                            ))}
                        </div>

                        {/* Examples */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.15em" }}>EXAMPLES</div>
                            {qData.examples.map((ex, i) => (
                                <div key={i} style={{ borderRadius: 14, border: "1px solid rgba(30,41,59,0.9)", background: "rgba(10,15,30,0.7)", overflow: "hidden" }}>
                                    <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
                                        <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.35)", letterSpacing: "0.12em" }}>EXAMPLE {i + 1}</div>

                                        {/* Input Block */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            <span className="mono" style={{ fontSize: 11, color: "rgba(100,116,139,0.45)" }}>Input</span>
                                            <div className="mono" style={{
                                                fontSize: 12, color: "#94a3b8", background: "rgba(15,20,40,0.8)",
                                                padding: "10px", borderRadius: 8, border: "1px solid rgba(51,65,85,0.4)",
                                                display: "flex", flexDirection: "column", gap: "2px",
                                            }}>
                                                {ex.input.split('\n').map((line, idx) => (
                                                    <div key={idx} style={{ display: "flex", gap: 10 }}>
                                                        <span style={{ color: "rgba(100,116,139,0.2)", width: "12px", textAlign: "right", userSelect: "none" }}>{idx + 1}</span>
                                                        <span style={{ color: "#94a3b8", whiteSpace: "pre-wrap" }}>{line}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Output Block */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            <span className="mono" style={{ fontSize: 11, color: "rgba(100,116,139,0.45)" }}>Output</span>
                                            <div className="mono" style={{
                                                fontSize: 12, color: "#22d3ee", background: "rgba(34,211,238,0.04)",
                                                padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(34,211,238,0.15)", whiteSpace: "pre-wrap",
                                            }}>
                                                {ex.output}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Explanation Footer */}
                                    {ex.explanation && (
                                        <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(30,41,59,0.5)", background: "rgba(15,20,40,0.3)" }}>
                                            <span style={{ fontSize: 12, color: "rgba(148,163,184,0.7)", lineHeight: "1.5" }}>
                                                <span className="mono" style={{ color: "rgba(100,116,139,0.5)", fontSize: 10, marginRight: 8 }}>EXPLANATION</span>
                                                {ex.explanation}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Constraints */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.15em" }}>CONSTRAINTS</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {qData.constraints.map((c, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(59,130,246,0.5)", flexShrink: 0 }} />
                                        <code className="mono" style={{ fontSize: 12, color: "#64748b" }}>{c}</code>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── RIGHT: Editor and my Testcases ── */}
                <div style={{ width: "50%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {/* Editor top */}
                    <div style={{ height: 36, background: "rgba(6,10,22,0.98)", borderBottom: "1px solid rgba(30,41,59,0.7)", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", flexShrink: 0 }}>
                        <div style={{ display: "flex", gap: 5 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(239,68,68,0.45)", border: "1px solid rgba(239,68,68,0.3)" }} />
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(245,158,11,0.45)", border: "1px solid rgba(245,158,11,0.3)" }} />
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(34,197,94,0.45)", border: "1px solid rgba(34,197,94,0.3)" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span className="mono" style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 5, color: selectedLang.iconColor, background: selectedLang.iconBg }}>{selectedLang.icon}</span>
                            <span className="mono" style={{ fontSize: 11, color: "rgba(100,116,139,0.55)" }}>solution.{selectedLang.ext}</span>
                        </div>
                    </div>

                    {/* Monaco Editor */}
                    <div style={{ height: EDITOR_H, minHeight: 200 }}>
                        <Editor
                            height="100%"
                            language={selectedLang.monacoLang}
                            value={code}
                            onChange={val => setCode(val || "")}
                            onMount={e => { editorRef.current = e; }}
                            theme="vs-dark"
                            options={{
                                fontSize: 13.5,
                                fontFamily: "'JetBrains Mono', monospace",
                                fontLigatures: true,
                                lineHeight: 22,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                padding: { top: 14, bottom: 14 },
                                renderLineHighlight: "gutter",
                                cursorBlinking: "phase",
                                cursorSmoothCaretAnimation: "on",
                                smoothScrolling: true,
                                tabSize: 4,
                                wordWrap: "on",
                                lineNumbers: "on",
                                glyphMargin: false,
                                folding: true,
                                bracketPairColorization: { enabled: true },
                                overviewRulerLanes: 0,
                                scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                            }}
                        />
                    </div>

                    {/* ── Testcase Panel ── */}
                    <div style={{ height: TESTCASE_H, flexShrink: 0, background: "rgba(4,8,20,0.98)", borderTop: "1px solid rgba(30,41,59,0.8)", display: "flex", flexDirection: "column" }}>

                        {/* Tabs row */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(30,41,59,0.7)", padding: "0 16px", flexShrink: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                {cases.map((tc, i) => {
                                    const s = STATUS_STYLE[tc.status ?? "null"];
                                    const isActive = i === activeTab;
                                    return (
                                        <button key={tc.id} onClick={() => setActiveTab(i)}
                                            className="tc-tab mono"
                                            style={{
                                                fontSize: 11, padding: "10px 14px",
                                                color: isActive ? "#e2e8f0" : "rgba(100,116,139,0.55)",
                                                background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                                                borderBottom: isActive ? "1.5px solid #3b82f6" : "1.5px solid transparent",
                                                border: "none", borderRadius: "6px 6px 0 0",
                                                cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                                                transition: "all .15s ease",
                                            }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0,
                                                boxShadow: tc.status ? `0 0 5px ${s.dot}` : "none",
                                                animation: tc.status ? "pulseDot 2s ease-in-out infinite" : "none",
                                            }} />
                                            {tc.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {runDone && (
                                <div className="fi" style={{ display: "flex", gap: 10, paddingRight: 4 }}>
                                    <span className="mono" style={{ fontSize: 10, color: "#34d399" }}>{passCount} passed</span>
                                    {failCount > 0 && <span className="mono" style={{ fontSize: 10, color: "#f87171" }}>{failCount} failed</span>}
                                </div>
                            )}
                        </div>

                        {activeCase && (
                            <div className="fi" style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, padding: "12px 16px" }}>

                                {/* Input */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.15em" }}>INPUT</div>
                                    <div className="mono e-scroll" style={{
                                        fontSize: 12, color: "#94a3b8", background: "rgba(10,15,30,0.8)",
                                        border: "1px solid rgba(51,65,85,0.45)", borderRadius: 10, padding: "12px",
                                        flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px",
                                    }}>
                                        {activeCase.input.split('\n').map((line, idx) => (
                                            <div key={idx} style={{ display: "flex", gap: 12 }}>
                                                <span style={{ color: "rgba(100,116,139,0.25)", userSelect: "none", width: "14px", textAlign: "right", fontSize: "10px" }}>
                                                    {idx + 1}
                                                </span>
                                                <span style={{ color: "#cbd5e1", wordBreak: "break-all" }}>
                                                    {line || " "}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Expected */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.15em" }}>EXPECTED OUTPUT</div>
                                    <div className="mono" style={{ fontSize: 12, color: "#94a3b8", background: "rgba(15,20,40,0.8)", border: "1px solid rgba(51,65,85,0.45)", borderRadius: 10, padding: "10px 12px", flex: 1 }}>
                                        {activeCase.expected}
                                    </div>
                                </div>

                                {/* Your output */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <div className="mono" style={{ fontSize: 10, color: "rgba(100,116,139,0.45)", letterSpacing: "0.15em" }}>YOUR OUTPUT</div>
                                        {activeCase.status && (
                                            <span className="mono" style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: st.text, border: `1px solid ${st.borderColor}`, background: st.bgColor }}>
                                                {st.label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mono" style={{ fontSize: 12, background: st.bgColor, border: `1px solid ${st.borderColor}`, borderRadius: 10, padding: "10px 12px", flex: 1, transition: "all .3s ease" }}>
                                        {running ? (
                                            <span style={{ color: "rgba(100,116,139,0.5)", display: "flex", alignItems: "center", gap: 6 }}>
                                                <svg className="spinner" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
                                                executing...
                                            </span>
                                        ) : activeCase.output ? (
                                            <span style={{ color: st.text }}>{activeCase.output}</span>
                                        ) : (
                                            <span style={{ color: "rgba(51,65,85,0.8)" }}>— run to see output</span>
                                        )}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
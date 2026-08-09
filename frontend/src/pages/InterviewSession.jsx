import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function InterviewSession() {
    const [question, setQuestion] = useState("");
    const [qIndex, setQIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [charCount, setCharCount] = useState(0);
    const [mounted, setMounted] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const [finished, setFinished] = useState(false);
    const textareaRef = useRef(null);
    const [qId, setQid] = useState("");
    const [total, setTotal] = useState(0);
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("");

    const navigate = useNavigate();

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { setCharCount(answer.length); }, [answer]);

    const InterviewId = useParams().id;
    console.log(InterviewId);

    useEffect(() => {
        const fetchQuestion = async () => {
            // /:id/current
            const res = await axios.get(`http://localhost:8000/api/interview/${InterviewId}/current`,
                {
                    withCredentials: true,
                }
            );
            if (res.data.success) {
                console.log(res);
                console.log(res.data.question);
                setQuestion(res.data.question);
                setQid(res.data.id);
                setTotal(res.data.totalQuestions);
                setQIndex(res.data.currentQuestionIndex);
                setTopic(res.data.topic);
                setDifficulty(res.data.difficulty);
            } else {
                setFinished(true);
            }

        }
        fetchQuestion();
    }, []);

    const totalQuestions = total;
    console.log("totalQuestions ", totalQuestions);
    const progress = (qIndex / totalQuestions) * 100;

    const submitAnswer = async () => {
        if (!answer.trim()) return;
        console.log("User Answer:", answer);
        console.log("before checking the condition ", qIndex);
        const answerData = {
            interviewId: InterviewId,
            answer: answer,
            questionId: qId,
        }
        if (qIndex + 1 >= totalQuestions) {
            const res = await axios.post(`http://localhost:8000/api/interview/answer`, answerData, {
                withCredentials: true
            });
            setSubmitted(true);
            setTimeout(() => setFinished(true), 600);
        } else {
            setSubmitted(true);
            // console.log(qId);


            const res = await axios.post(`http://localhost:8000/api/interview/answer`, answerData, {
                withCredentials: true
            });
            setQuestion(res.data.question);
            setQid(res.data.questionId);

            setTimeout(() => {
                setQIndex(i => i + 1);
                console.log(qIndex);
                setAnswer("");
                setSubmitted(false);
                setAnimKey(k => k + 1);
                setTimeout(() => textareaRef.current?.focus(), 100);
            }, 500);
        }
    };

    const report = async (req, res) => {
        navigate(`/report/${InterviewId}`);
    }


    if (finished) {
        return (
            <div className={`relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#020409] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
                style={{ fontFamily: "'Syne', sans-serif" }}>
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
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
                    style={{ backgroundImage: `linear-gradient(rgba(59,130,246,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.2) 1px,transparent 1px)`, backgroundSize: '56px 56px' }} />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle,rgba(37,99,235,.13) 0%,transparent 70%)', transform: 'translate(-30%,-30%)' }} />

                <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-md px-6">
                    <div className="relative fu">
                        <div className="ring absolute inset-0 rounded-full border-2 border-emerald-500/30" style={{ margin: '-10px' }} />
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
                    <button onClick={report} className="fu3 w-full py-3.5 rounded-[13px] font-bold text-sm tracking-wider text-white transition-all duration-200"
                        style={{ background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 28px rgba(37,99,235,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,0.3)'}
                    >
                        View Results
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div
            className={`relative w-screen h-screen overflow-hidden flex flex-col bg-[#020409] transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
            style={{ fontFamily: "'Syne', sans-serif" }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .fu  { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
        .fu2 { animation: fadeUp 0.5s cubic-bezier(.16,1,.3,1) 0.08s both; }
        .fi  { animation: fadeIn 0.35s ease both; }
        textarea { resize:none; outline:none; background:transparent; caret-color:#3b82f6; }
        textarea::placeholder { color:rgba(100,116,139,0.45); }
        textarea:focus { border-color:rgba(59,130,246,0.45) !important; box-shadow:0 0 0 2px rgba(59,130,246,0.07), 0 0 18px rgba(59,130,246,0.06); }
        .progress-bar { transition: width 0.6s cubic-bezier(.16,1,.3,1); }
        .btn-submit:not(:disabled):hover { box-shadow:0 8px 28px rgba(37,99,235,0.48); transform:translateY(-1px); }
        .btn-submit:not(:disabled):active { transform:scale(0.98); }
      `}</style>


            <div className="absolute inset-0 z-0 pointer-events-none opacity-20"
                style={{ backgroundImage: `linear-gradient(rgba(59,130,246,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.2) 1px,transparent 1px)`, backgroundSize: '56px 56px' }} />
            <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full z-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle,rgba(37,99,235,.14) 0%,transparent 70%)' }} />
            <div className="absolute -bottom-40 -right-40 w-[460px] h-[460px] rounded-full z-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 70%)' }} />

            <header className="relative z-10 flex items-center justify-between px-8 py-4 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/25 rounded-full px-3.5 py-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="mono text-blue-400 text-[11px] tracking-[0.14em]">AI INTERVIEW ENGINE</span>
                    </div>
                    <span className="text-slate-700 text-xs">·</span>
                    <span className="mono text-slate-600 text-[11px] tracking-wider">LIVE SESSION</span>
                </div>

                <div className="flex items-center gap-4">
                    <span className="mono text-slate-500 text-[11px] tracking-wider">
                        <span className="text-blue-400 font-semibold">{qIndex + 1}</span>
                        <span className="text-slate-700"> / {totalQuestions}</span>
                    </span>
                    <div className="w-36 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
                        <div className="progress-bar h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500"
                            style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 flex items-stretch gap-5 px-8 py-5 overflow-hidden">

                <div key={`q-${animKey}`} className="fu flex flex-col gap-4" style={{ flex: '0 0 42%' }}>

                    <div className="flex items-center gap-3">
                        <div className="mono text-[11px] tracking-[0.16em] text-slate-500">QUESTION</div>
                        <div className="mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-0.5">
                            {String(qIndex + 1).padStart(2, '0')} / {String(totalQuestions).padStart(2, '0')}
                        </div>
                    </div>

                    <div className="flex-1 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden"
                        style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(24px)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', outline: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800/60">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/30 border border-blue-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500/30 border border-indigo-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60 border border-slate-600/50" />
                            <span className="mono text-slate-700 text-[10px] tracking-widest ml-2">QUESTION.md</span>
                        </div>
                        <div className="flex-1 p-6 flex flex-col justify-between">
                            <div>
                                <div className="mono text-blue-500/50 text-xs mb-3"># Question {qIndex + 1}</div>
                                <p className="text-slate-100 text-lg font-semibold leading-relaxed">
                                    {question}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-6">
                                {[topic, difficulty].map((tag, i) => (
                                    <span key={i} className={`mono text-[10px] px-2.5 py-1 rounded-lg border tracking-wider
                    ${i === 0 ? "border-blue-500/25 text-blue-400 bg-blue-500/8"
                                            : "border-indigo-500/25 text-indigo-400 bg-indigo-500/8"}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800/50 px-4 py-3 bg-slate-900/40">
                        <div className="mono text-slate-600 text-[10px] tracking-widest mb-1.5">💡 TIP</div>
                        <p className="text-slate-500 text-xs leading-relaxed">
                            Structure your answer with a brief definition, then explain with a concrete example. Be concise and precise.
                        </p>
                    </div>
                </div>

                <div key={`a-${animKey}`} className="fu2 flex flex-col gap-4" style={{ flex: 1 }}>

                    <div className="flex items-center justify-between">
                        <div className="mono text-[11px] tracking-[0.16em] text-slate-500">YOUR ANSWER</div>
                        <div className="flex items-center gap-3">
                            <span className={`mono text-[11px] ${charCount > 0 ? 'text-blue-400' : 'text-slate-700'}`}>
                                {charCount} chars
                            </span>
                            {submitted && (
                                <span className="fi mono text-[11px] text-emerald-400 border border-emerald-500/25 bg-emerald-500/8 rounded-full px-2.5 py-0.5">
                                    ✓ Submitted
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden transition-all duration-300"
                        style={{ background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(24px)', boxShadow: submitted ? '0 0 0 1px rgba(52,211,153,0.15),0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.4)', outline: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800/60">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60 border border-slate-600/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-slate-700/60 border border-slate-600/50" />
                            <span className="mono text-slate-700 text-[10px] tracking-widest ml-2">answer.txt</span>
                            {!submitted && answer.length > 0 && (
                                <span className="ml-auto flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                    <span className="mono text-amber-400/60 text-[10px]">editing</span>
                                </span>
                            )}
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={answer}
                            onChange={e => { if (!submitted) setAnswer(e.target.value); }}
                            placeholder="Type your answer here..."
                            disabled={submitted}
                            className="flex-1 w-full px-6 py-5 text-slate-200 text-sm leading-relaxed border border-transparent transition-all duration-200"
                            style={{ fontFamily: "'Syne', sans-serif", color: submitted ? 'rgba(148,163,184,0.6)' : undefined }}
                        />
                        <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-800/50">
                            <span className="mono text-slate-700 text-[10px]">Aim for 50–150 words</span>
                            <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`w-5 h-1 rounded-full transition-all duration-300 ${charCount > i * 40 ? 'bg-blue-500/70' : 'bg-slate-800'}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit only */}
                    <button
                        onClick={submitAnswer}
                        disabled={!answer.trim() || submitted}
                        className="btn-submit w-full py-3.5 rounded-[13px] font-bold text-sm tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5"
                        style={!answer.trim() || submitted
                            ? { background: 'rgba(30,41,59,0.4)', color: 'rgba(100,116,139,0.35)', cursor: 'not-allowed' }
                            : { background: 'linear-gradient(135deg,#1d4ed8,#4f46e5)', color: 'white', boxShadow: '0 4px 20px rgba(37,99,235,0.3)', cursor: 'pointer' }}
                    >
                        {submitted ? (
                            <><span>✓</span> Moving to Next...</>
                        ) : (
                            <><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                                {qIndex + 1 === totalQuestions ? "Submit & Finish" : "Submit Answer"}</>
                        )}
                    </button>

                    <p className="mono text-center text-slate-800 text-[10px] tracking-widest -mt-1">
                        Adaptive AI · Real-time Feedback · Detailed Analysis
                    </p>
                </div>
            </main>
        </div>
    );
}
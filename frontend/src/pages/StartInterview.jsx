import { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { myContext } from "../App";
import { useContext } from "react";
import api from "../api";
const TOPICS = [
    { value: "CN", label: "Computer Networking", icon: "⬡", desc: "Protocols, OSI, TCP/IP" },
    { value: "OS", label: "Operating Systems", icon: "◈", desc: "Processes, Memory, Scheduling" },
    { value: "DBMS", label: "Database Systems", icon: "◉", desc: "SQL, Normalization, Indexing" },
    { value: "HR", label: "Human Resources", icon: "◎", desc: "Behavioral, Situational" },
    { value: "DSA", label: "Data Structure and Algorithm", icon: "◎", desc: "Data Structures, Algorithms" },
];

const DIFFICULTIES = [
    { value: "easy", label: "Easy", desc: "Fundamentals" },
    { value: "medium", label: "Medium", desc: "Applied" },
    { value: "hard", label: "Hard", desc: "Expert" },
];

const Q_COUNTS = [5, 10, 15, 20, 25, 30];

export default function App() {
    const [topic, setTopic] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [questions, setQuestions] = useState(10);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { setMounted(true); }, []);

    const sumbit = async () => {
        setLoading(true);
        if (topic !== "DSA") {
            const interviewData = { topic, difficulty, questionNo: questions };
            const res = api.post("/interview/start", interviewData);
            res.then(data => { navigate(`/interview/${data.data.interviewId}`); })
                .catch(() => setLoading(false));
        } else {
            try {
                const interviewData = { topic, difficulty, questionNo: questions };
                const res = await api.post(`/interview/dsa/start`, interviewData);
                navigate(`/editor/${res.data.interviewId}`);
            } catch (error) { console.log(error); setLoading(false); }
        }
    };

    const handleLogout = async () => {
        try {
            const res = await api.post(`/auth/logout`);
            if (res.data.success) {
                context.setIsLoggedIn(false);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const selTopic = TOPICS.find(t => t.value === topic);
    const selDiff = DIFFICULTIES.find(d => d.value === difficulty);
    const canStart = !!topic;
    const btnActive = canStart && !loading;
    const pct = ((questions - 5) / 25) * 100;
    const accentOf = (v) => v === 'easy' ? '#22d3ee' : v === 'medium' ? '#3b82f6' : '#818cf8';

    const context = useContext(myContext);
    return (
        <div
            className={`relative transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{
                fontFamily: "'Syne', sans-serif",
                background: '#020409',
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; overflow: hidden; background: #020409; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.16,1,.3,1) both; }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        input[type=range] { -webkit-appearance: none; outline: none; border: none; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #3b82f6; cursor: pointer;
          border: 2px solid #1d4ed8;
          box-shadow: 0 0 10px rgba(59,130,246,0.55);
        }
        input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 4px; }
        .topic-btn:hover { border-color: rgba(59,130,246,0.45) !important; background: rgba(59,130,246,0.05) !important; }
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.75); }
          40% { opacity: 1; transform: scale(1); }
        }
        .dot-1 { animation: dotPulse 1.2s ease-in-out infinite; }
        .dot-2 { animation: dotPulse 1.2s ease-in-out 0.2s infinite; }
        .dot-3 { animation: dotPulse 1.2s ease-in-out 0.4s infinite; }
      `}</style>

            {/* BG grid */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.18,
                backgroundImage: `linear-gradient(rgba(59,130,246,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.2) 1px,transparent 1px)`,
                backgroundSize: '56px 56px'
            }} />
            <div style={{ position: 'fixed', top: -150, left: -130, width: 580, height: 580, borderRadius: '50%', zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(circle, rgba(37,99,235,.16) 0%, transparent 70%)' }} />
            <div style={{ position: 'fixed', bottom: -150, right: -130, width: 480, height: 480, borderRadius: '50%', zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(circle, rgba(99,102,241,.12) 0%, transparent 70%)' }} />

            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* ── NAVBAR ── */}
                <header style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 200px', flexShrink: 0,
                    background: 'rgba(2,4,9,0.95)', borderBottom: '1px solid rgba(100,116,139,0.18)',
                    backdropFilter: 'blur(20px)', zIndex: 20,
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start',
                        background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)',
                        borderRadius: '999px', padding: '7px 20px',
                    }}>
                        <span className="pulse" style={{ width: 9, height: 9, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
                        <span className="mono" style={{ color: '#60a5fa', fontSize: '11.5px', letterSpacing: '0.14em', fontWeight: 500 }}>AI INTERVIEW ENGINE</span>
                    </div>

                    <div style={{ display: 'flex', gap: '50px' }}>
                        <span onClick={() => navigate('/dashboard')} className="mono" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start',
                            background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)',
                            borderRadius: '999px', padding: '7px 20px', color: '#ffffff', fontSize: '13px', letterSpacing: '0.14em', fontWeight: 500, cursor: 'pointer', boxShadow: '0 0px 22px 0px rgba(37,99,235,0.32)', transition: 'box-shadow 0.5s ease',
                        }}
                            onMouseEnter={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 0px 29px 0px rgba(37,99,235,0.45)'; }}
                            onMouseLeave={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 0px 22px rgba(37,99,235,0.32)'; }}
                        >DASHBOARD</span>
                        {
                            context.isLoggedIn ?
                                <span onClick={handleLogout} className="mono" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start',
                                    background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)',
                                    borderRadius: '999px', padding: '7px 20px', color: '#ffffff', fontSize: '13px', letterSpacing: '0.14em', fontWeight: 500, cursor: 'pointer', boxShadow: '0 0px 22px 0px rgba(37,99,235,0.32)', transition: 'box-shadow 0.5s ease',
                                }}

                                    onMouseEnter={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 0px 29px 0px rgba(37,99,235,0.45)'; }}
                                    onMouseLeave={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 0px 22px rgba(37,99,235,0.32)'; }}
                                >Logout</span> :
                                <span onClick={() => navigate('/login')} className="mono" style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '10px', alignSelf: 'flex-start',
                                    background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.25)',
                                    borderRadius: '999px', padding: '7px 20px', color: '#ffffff', fontSize: '13px', letterSpacing: '0.14em', fontWeight: 500, cursor: 'pointer', boxShadow: '0 0px 22px 0px rgba(37,99,235,0.32)', transition: 'box-shadow 0.5s ease',
                                }}
                                    onMouseEnter={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 0px 29px 0px rgba(37,99,235,0.45)'; }}
                                    onMouseLeave={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 0px 22px rgba(37,99,235,0.32)'; }}
                                >LOGIN</span>
                        }

                    </div>
                </header>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div className="fade-up" style={{
                        position: 'relative', zIndex: 10,
                        width: '92%', maxWidth: '1140px',
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px',
                        alignItems: 'start',
                    }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                            <div>
                                <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#f1f5f9', lineHeight: 1.05, letterSpacing: '-0.02em', margin: 0 }}>
                                    Prepare to{' '}
                                    <span style={{ background: 'linear-gradient(135deg, #3b82f6, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        Dominate
                                    </span>
                                </h1>
                                <p style={{ marginTop: '10px', marginBottom: 0, color: '#94a3b8', fontSize: '15px', lineHeight: 1.65, maxWidth: '460px' }}>
                                    Configure your session and face AI-curated questions tailored to your exact goals.
                                </p>
                            </div>

                            <div className="mono" style={{
                                fontSize: '11px', letterSpacing: '0.16em', fontWeight: 600, marginBottom: '-10px',
                                background: 'linear-gradient(135deg, #3b82f6, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>SELECT DOMAIN</div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {TOPICS.map(t => {
                                    const isActive = topic === t.value;
                                    return (
                                        <button key={t.value} onClick={() => setTopic(t.value)}
                                            className={isActive ? '' : 'topic-btn'}
                                            style={{
                                                textAlign: 'left', padding: '18px 18px', borderRadius: '18px', cursor: 'pointer',
                                                border: isActive ? '1px solid rgba(59,130,246,0.75)' : '1px solid rgba(51,65,85,0.6)',
                                                background: isActive ? 'rgba(59,130,246,0.09)' : 'rgba(2,6,23,0.7)',
                                                boxShadow: isActive ? '0 0 24px rgba(59,130,246,0.14)' : 'none',
                                                display: 'flex', flexDirection: 'column', gap: '5px',
                                                transition: 'all 0.18s ease',
                                            }}>
                                            <span style={{ fontSize: '26px', lineHeight: 1, color: '#fff' }}>{t.icon}</span>
                                            <span style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{t.label}</span>
                                            <span className="mono" style={{ color: '#64748b', fontSize: '11px', fontWeight: 500 }}>{t.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(10,15,30,0.88)', backdropFilter: 'blur(32px)',
                            border: '1px solid rgba(100,116,139,0.3)', borderRadius: '24px',
                            padding: '30px 30px', outline: '1px solid rgba(255,255,255,0.03)',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', gap: '22px',
                        }}>

                            <div className="mono" style={{
                                fontSize: '11px', letterSpacing: '0.16em', fontWeight: 600,
                                background: 'linear-gradient(135deg, #3b82f6, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                            }}>SESSION CONFIGURATION</div>

                            <div>
                                <div className="mono" style={{ color: '#94a3b8', fontSize: '10.5px', letterSpacing: '0.14em', fontWeight: 500, marginBottom: '11px' }}>DIFFICULTY</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                    {DIFFICULTIES.map(d => {
                                        const isActive = difficulty === d.value;
                                        const color = accentOf(d.value);
                                        return (
                                            <button key={d.value} onClick={() => setDifficulty(d.value)} style={{
                                                padding: '14px 8px', borderRadius: '14px', cursor: 'pointer', textAlign: 'center',
                                                border: isActive ? `1px solid ${color}` : '1px solid rgba(51,65,85,0.55)',
                                                background: isActive ? `${color}18` : 'rgba(2,6,23,0.6)',
                                                boxShadow: isActive ? `0 4px 18px ${color}28` : 'none',
                                                transition: 'all 0.18s ease',
                                            }}>
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: isActive ? color : '#94a3b8' }}>{d.label}</div>
                                                <div className="mono" style={{ fontSize: '10px', marginTop: '4px', color: isActive ? '#cbd5e1' : '#475569' }}>{d.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '11px' }}>
                                    <span className="mono" style={{ color: '#94a3b8', fontSize: '10.5px', letterSpacing: '0.14em', fontWeight: 500 }}>QUESTION COUNT</span>
                                    <span className="mono" style={{
                                        color: '#60a5fa', fontSize: '13px', fontWeight: 600,
                                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                                        borderRadius: '999px', padding: '3px 14px',
                                    }}>{questions}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '14px' }}>
                                    {Q_COUNTS.map(n => {
                                        const isActive = questions === n;
                                        return (
                                            <button key={n} onClick={() => setQuestions(n)} style={{
                                                padding: '10px 0', borderRadius: '11px', cursor: 'pointer',
                                                border: isActive ? '1px solid rgba(59,130,246,0.6)' : '1px solid rgba(51,65,85,0.5)',
                                                background: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(2,6,23,0.6)',
                                                color: isActive ? '#60a5fa' : '#64748b',
                                                fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 600,
                                                transition: 'all 0.15s ease',
                                            }}>{n}</button>
                                        );
                                    })}
                                </div>
                                <input type="range" min={5} max={30} step={5} value={questions}
                                    onChange={e => setQuestions(Number(e.target.value))}
                                    style={{
                                        width: '100%', height: '4px', borderRadius: '4px', cursor: 'pointer',
                                        background: `linear-gradient(to right, #3b82f6 ${pct}%, rgba(51,65,85,0.5) ${pct}%)`
                                    }}
                                />
                            </div>

                            <div style={{ height: '1px', background: 'rgba(30,41,59,0.8)' }} />

                            <div style={{
                                borderRadius: '16px', padding: '16px 18px',
                                border: canStart ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(30,41,59,0.5)',
                                background: canStart ? 'rgba(59,130,246,0.05)' : 'rgba(15,23,42,0.4)',
                                transition: 'all 0.3s ease',
                            }}>
                                <div className="mono" style={{ color: '#475569', fontSize: '9.5px', letterSpacing: '0.18em', marginBottom: '9px', fontWeight: 500 }}>SESSION PREVIEW</div>
                                {canStart ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                                        <div>
                                            <div style={{ color: '#f1f5f9', fontSize: '15px', fontWeight: 700 }}>{selTopic?.icon} {selTopic?.label}</div>
                                            <div className="mono" style={{ color: '#94a3b8', fontSize: '12.5px', marginTop: '5px' }}>
                                                {questions} questions · {selDiff?.label} difficulty
                                            </div>
                                        </div>
                                        <div style={{
                                            width: 13, height: 13, borderRadius: '50%', flexShrink: 0,
                                            background: accentOf(selDiff?.value),
                                            boxShadow: `0 0 14px ${accentOf(selDiff?.value)}`
                                        }} />
                                    </div>
                                ) : (
                                    <div style={{ color: '#475569', fontSize: '14px' }}>Select a domain above to preview your session</div>
                                )}
                            </div>

                            <button onClick={sumbit} disabled={!btnActive} style={{
                                width: '100%', padding: '15px', borderRadius: '14px', border: 'none',
                                fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px', letterSpacing: '0.05em',
                                cursor: btnActive ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                color: canStart ? '#fff' : '#475569',
                                background: canStart ? 'linear-gradient(135deg, #1d4ed8, #4f46e5)' : 'rgba(30,41,59,0.4)',
                                boxShadow: canStart ? '0 4px 22px rgba(37,99,235,0.32)' : 'none',
                                transition: 'box-shadow 0.2s ease',
                                opacity: loading ? 0.85 : 1,
                            }}
                                onMouseEnter={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 8px 30px rgba(37,99,235,0.52)'; }}
                                onMouseLeave={e => { if (btnActive) e.currentTarget.style.boxShadow = '0 4px 22px rgba(37,99,235,0.32)'; }}
                            >
                                {loading ? (
                                    <>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span className="dot-1" style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                                            <span className="dot-2" style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                                            <span className="dot-3" style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                                        </span>
                                        Starting session…
                                    </>
                                ) : canStart ? (
                                    <>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                        Launch Interview Session
                                    </>
                                ) : "Select a Domain to Continue"}
                            </button>

                            <p className="mono" style={{ textAlign: 'center', color: '#334155', fontSize: '9.5px', letterSpacing: '0.18em', marginTop: '-8px' }}>
                                Adaptive AI · Real-time Feedback · Detailed Analysis
                            </p>
                        </div>
                    </div>
                </div>

            </div>


        </div>
    );
}
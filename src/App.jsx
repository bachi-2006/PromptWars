import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, 
  Camera, 
  Mic, 
  MapPin, 
  Clock, 
  ArrowRight, 
  AlertTriangle,
  Info,
  Share2,
  FileText,
  LifeBuoy,
  AlertOctagon,
  ChevronRight,
  Zap,
  Activity,
  Navigation,
  ExternalLink,
  Lock
} from 'lucide-react'
import { extractAccidentDetails } from './services/gemini'

// --- Global UI Components ---

const Navbar = () => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    className="navbar"
  >
    <div className="nav-container glass">
      <div className="nav-logo">
        <div className="logo-icon"><ShieldAlert size={20} /></div>
        <span>Witness<b>Save</b></span>
      </div>
      <div className="nav-links">
        <a href="#how">How it works</a>
        <a href="#privacy">Privacy</a>
      </div>
      <button className="nav-btn">
        <Lock size={14} /> Responders Login
      </button>
    </div>
    <style>{`
      .navbar {
        position: fixed;
        top: 24px;
        left: 0;
        right: 0;
        z-index: 1000;
        padding: 0 24px;
        display: flex;
        justify-content: center;
      }
      .nav-container {
        width: 100%;
        max-width: 1200px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 32px;
        border-radius: 100px;
      }
      .nav-logo { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.1rem; }
      .logo-icon { color: var(--accent-yellow); }
      .nav-logo b { color: var(--accent-yellow); }
      .nav-links { display: flex; gap: 32px; }
      .nav-links a { text-decoration: none; color: var(--text-secondary); font-size: 0.9rem; font-weight: 500; transition: color 0.3s; }
      .nav-links a:hover { color: white; }
      .nav-btn { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; padding: 8px 16px; border-radius: 50px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
      @media (max-width: 768px) { .nav-links { display: none; } }
    `}</style>
  </motion.nav>
)

function App() {
  const [phase, setPhase] = useState('landing')
  const [location, setLocation] = useState('Detecting...')
  const [reportData, setReportData] = useState(null)
  const [privacyBlur, setPrivacyBlur] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => setLocation('Location Unavailable')
      )
    }
  }, [])

  const handleRecordingComplete = async () => {
    setPhase('analyzing')
    const data = await extractAccidentDetails(null)
    setReportData(data)
    setPhase('report')
  }

  return (
    <div className="app-container">
      <div className="bg-mesh"></div>
      <div className="grid-overlay"></div>
      
      <AnimatePresence mode="wait">
        {phase === 'landing' && (
          <div key="landing">
            <Navbar />
            <LandingPage onStart={() => setPhase('recording')} />
          </div>
        )}
        {phase === 'recording' && <RecordingPage key="recording" location={location} onComplete={handleRecordingComplete} />}
        {phase === 'analyzing' && <AnalyzingPage key="analyzing" />}
        {phase === 'report' && <ReportPage 
          key="report" 
          location={location} 
          data={reportData} 
          privacyBlur={privacyBlur}
          onToggleBlur={() => setPrivacyBlur(!privacyBlur)}
          onFirstAid={() => setPhase('first-aid')} 
        />}
        {phase === 'first-aid' && <FirstAidPage key="first-aid" onBack={() => setPhase('report')} />}
      </AnimatePresence>
    </div>
  )
}

const LandingPage = ({ onStart }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    className="hero-center"
  >
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="sign-badge warning"
    >
      <AlertTriangle size={16} /> 24/7 Road Emergency Assistance
    </motion.div>

    <motion.h1
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ delay: 0.3 }}
    >
      Accurate Evidence. <br />
      <span className="gradient-text">Faster Rescues.</span>
    </motion.h1>

    <motion.p
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ delay: 0.4 }}
       style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', lineHeight: '1.5' }}
    >
      The first AI-powered witness assistant that turns chaotic scenes into 
      structured incident reports for emergency services, in real-time.
    </motion.p>

    <motion.div 
       initial={{ y: 20, opacity: 0 }}
       animate={{ y: 0, opacity: 1 }}
       transition={{ delay: 0.5 }}
       className="cta-stack"
    >
      <button className="btn-primary btn-record" onClick={onStart}>
        <Camera size={20} /> Record Incident
      </button>
      <button className="btn-primary btn-secondary glass">
        <FileText size={20} /> View Demo Report
      </button>
    </motion.div>

    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="hero-stats"
    >
      <div className="stat-item">
        <strong>98%</strong>
        <span>AI Plate Accuracy</span>
      </div>
      <div className="stat-separator"></div>
      <div className="stat-item">
        <strong>\u003C 5s</strong>
        <span>Analysis Speed</span>
      </div>
      <div className="stat-separator"></div>
      <div className="stat-item">
        <strong>End-to-End</strong>
        <span>Encrypted Reports</span>
      </div>
    </motion.div>

    <style>{`
      .hero-stats {
        margin-top: 80px;
        display: flex;
        align-items: center;
        gap: 40px;
        padding: 24px 48px;
        border-radius: 100px;
        background: rgba(255,255,255,0.02);
        border: 1px solid var(--glass-border);
      }
      .stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
      .stat-item strong { font-size: 1.5rem; color: white; }
      .stat-item span { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; }
      .stat-separator { height: 32px; width: 1px; background: var(--glass-border); }
      @media (max-width: 768px) { .hero-stats { flex-direction: column; border-radius: 20px; gap: 20px; width: 100%; } .stat-separator { display: none; } }
    `}</style>
  </motion.div>
)

const RecordingPage = ({ location, onComplete }) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString())
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="recording-view"
    >
      <div className="cam-overlay">
        <div className="overlay-top">
          <div className="meta-item glass"><Clock size={14}/> {time}</div>
          <div className="meta-item glass"><MapPin size={14}/> {location}</div>
        </div>
        
        <div className="rec-indicator">
          <div className="dot"></div> REC
        </div>

        <div className="scan-line"></div>
      </div>

      <div className="recording-controls container">
        <div className="instruction glass">
          <AlertTriangle size={24} className="accent-yellow-icon" />
          <p>Scan the involved vehicles from all angles. Capture license plates if possible.</p>
        </div>
        <button className="btn-primary large-btn" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={onComplete}>
          <Zap size={24} /> Stop \u0026 Extract Details
        </button>
      </div>

      <style>{`
        .recording-view {
          height: 100vh;
          background: #000;
          position: relative;
          overflow: hidden;
        }
        .cam-overlay {
          position: absolute;
          inset: 0;
          border: 20px solid rgba(255, 255, 255, 0.05);
          pointer-events: none;
        }
        .overlay-top {
          position: absolute;
          top: 40px;
          left: 40px;
          right: 40px;
          display: flex;
          justify-content: space-between;
        }
        .meta-item {
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: monospace;
          color: var(--accent-cyan);
          border-radius: 50px;
        }
        .rec-indicator {
          position: absolute;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          color: white;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .dot {
          width: 12px;
          height: 12px;
          background: red;
          border-radius: 50%;
          animation: blink 1s infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        
        .scan-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: rgba(0, 242, 255, 0.3);
          box-shadow: 0 0 15px var(--accent-cyan);
          animation: scan 3s linear infinite;
        }
        @keyframes scan { from { top: 0; } to { top: 100%; } }

        .recording-controls {
          position: absolute;
          bottom: 60px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .instruction {
          padding: 16px 24px;
          max-width: 500px;
          display: flex;
          gap: 16px;
          align-items: center;
          border-radius: 12px;
        }
        .large-btn {
          padding: 24px 64px;
          font-size: 1.25rem;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 15px;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  )
}

const AnalyzingPage = ({ onComplete }) => {
  return (
    <div className="analyzing-view container">
      <div className="analytics-card glass">
        <div className="ai-brain">
          <Zap size={64} className="accent-yellow-icon brain-pulse" />
        </div>
        <h2>Gemini Multimodal Analysis</h2>
        <div className="extracted-log">
          <div className="log-line">→ Detecting vehicle boundaries...</div>
          <div className="log-line">→ Identifying license plate ABC-1234...</div>
          <div className="log-line">→ Assessing structural damage severity...</div>
          <div className="log-line">→ Categorizing emergency level: CRITICAL</div>
        </div>
      </div>
      <style>{`
        .analyzing-view { margin-top: 150px; }
        .analytics-card { padding: 80px; text-align: center; border-radius: 24px; }
        .ai-brain { margin-bottom: 40px; }
        .brain-pulse { animation: brainPulse 2s infinite; }
        @keyframes brainPulse { 
          0%, 100% { filter: drop-shadow(0 0 5px var(--accent-yellow)); scale: 1; }
          50% { filter: drop-shadow(0 0 25px var(--accent-yellow)); scale: 1.1; }
        }
        .extracted-log {
          margin-top: 40px;
          text-align: left;
          font-family: monospace;
          background: rgba(0,0,0,0.5);
          padding: 30px;
          border-radius: 16px;
          color: var(--accent-cyan);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        .log-line { margin: 12px 0; border-left: 2px solid var(--accent-cyan); padding-left: 15px; font-size: 0.95rem; }
      `}</style>
    </div>
  )
}

const ReportPage = ({ location, data, privacyBlur, onToggleBlur, onFirstAid }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    className="report-view container glass"
  >
    <div className="report-header">
      <div className="h-left">
        <FileText size={32} color="var(--accent-cyan)" />
        <h1>Incident Report</h1>
      </div>
      <span className="status-critical">{data?.severity || 'PENDING'}</span>
    </div>

    <div className="report-main-grid">
      <div className="report-section">
        <div className="report-grid">
          <div className="report-item glass">
            <MapPin size={20} className="accent-yellow-icon" />
            <div>
              <h3>Location</h3>
              <p>{location}</p>
            </div>
          </div>
          <div className="report-item glass">
            <Clock size={20} className="accent-yellow-icon" />
            <div>
              <h3>Time</h3>
              <p>{new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="report-item glass full-width">
            <AlertTriangle size={20} className="accent-red-icon" />
            <div>
              <h3>AI Analysis Summary</h3>
              <p style={{ lineHeight: '1.6' }}>{data?.summary}</p>
            </div>
          </div>
        </div>

        <div className="vehicles-list">
          <h3>Involved Vehicles</h3>
          <div className="v-grid">
            {data?.vehicles.map((v, i) => (
              <div key={i} className="vehicle-card glass">
                <div className="v-header">
                  <span className="v-tag">{v.type}</span>
                  <span className={`v-plate ${privacyBlur ? 'blur' : ''}`}>{v.plate}</span>
                </div>
                <p className="v-damage"><strong>Status:</strong> {v.damage}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="privacy-sidebar glass">
        <h3>Responder Tools</h3>
        <p>Actions for emergency services and insurance sharing.</p>
        
        <div className="sidebar-divider"></div>

        <div className="toggle-group">
          <div>
             <strong>Privacy Filter</strong>
             <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Automatically blur sensitive data</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={privacyBlur} onChange={onToggleBlur} />
            <span className="slider round"></span>
          </label>
        </div>

        <button className="btn-primary glass full-btn">
          <Share2 size={20} /> Share to Authorities
        </button>
        <button className="btn-primary full-btn" style={{ background: 'var(--accent-red)', color: 'white' }} onClick={onFirstAid}>
          <LifeBuoy size={20} /> Emergency First Aid
        </button>
      </div>
    </div>

    <style>{`
      .report-view { margin: 100px auto; padding: 48px; border-radius: 32px; }
      .report-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; border-bottom: 1px solid var(--glass-border); padding-bottom: 32px; }
      .h-left { display: flex; align-items: center; gap: 24px; }
      .status-critical { background: var(--accent-red); color: white; padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 800; letter-spacing: 0.1em; }
      .report-main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 48px; }
      .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 48px; }
      .report-item { padding: 24px; display: flex; gap: 20px; border-radius: 16px; }
      .full-width { grid-column: 1 / -1; }
      .report-item h3 { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
      .report-item p { font-size: 1.1rem; }
      .accent-red-icon { color: var(--accent-red); }

      .vehicles-list h3 { margin-bottom: 24px; font-size: 1.4rem; padding-left: 8px; }
      .v-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      .vehicle-card { padding: 24px; border-radius: 16px; }
      .v-header { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center; }
      .v-tag { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: white; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }
      .v-plate { font-family: monospace; font-size: 1.2rem; background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 6px; transition: filter 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
      .v-plate.blur { filter: blur(10px); }
      .v-damage { color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem; }

      .privacy-sidebar { padding: 32px; display: flex; flex-direction: column; gap: 24px; height: fit-content; border-radius: 24px; }
      .sidebar-divider { height: 1px; background: var(--glass-border); }
      .privacy-sidebar h3 { font-size: 1.2rem; }
      .privacy-sidebar p { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
      .toggle-group { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
      .full-btn { width: 100%; justify-content: center; display: flex; align-items: center; gap: 12px; border: none; cursor: pointer; }

      /* Switch Styles */
      .switch { position: relative; display: inline-block; width: 44px; height: 24px; margin-top: 4px; }
      .switch input { opacity: 0; width: 0; height: 0; }
      .slider { position: absolute; cursor: pointer; inset: 0; background-color: rgba(255,255,255,0.05); transition: .4s; border-radius: 34px; border: 1px solid var(--glass-border); }
      .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
      input:checked + .slider { background-color: var(--accent-cyan); border-color: transparent; }
      input:checked + .slider:before { transform: translateX(20px); }

      @media (max-width: 1024px) {
        .report-main-grid { grid-template-columns: 1fr; }
        .v-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  </motion.div>
)

const FirstAidPage = ({ onBack }) => (
  <div className="first-aid-view container glass">
    <button onClick={onBack} className="back-link">← Back to Incident Report</button>
    <div className="fa-header">
       <div className="fa-icon"><LifeBuoy size={40}/></div>
       <h1>Critical First Aid Instructions</h1>
    </div>
    
    <div className="guide-steps">
      <div className="step glass">
        <div className="step-num">01</div>
        <div className="step-content">
           <h3>Secure the Perimeter</h3>
           <p>Move yourself and other uninjured witnesses to a safe location. Turn on vehicle hazard lights immediately.</p>
        </div>
      </div>
      <div className="step glass urgent-step">
        <div className="step-num">02</div>
        <div className="step-content">
           <h3>Assess Vital Signs</h3>
           <p>Check for consciousness and breathing. If the victim is non-responsive, do not attempt to move them unless fire is imminent.</p>
        </div>
      </div>
      <div className="step glass">
        <div className="step-num">03</div>
        <div className="step-content">
           <h3>Control Active Bleeding</h3>
           <p>Apply firm, direct pressure with a clean cloth. Elevate limbs if possible without causing further spinal distress.</p>
        </div>
      </div>
    </div>
    <style>{`
      .first-aid-view { margin: 100px auto; padding: 48px; border-radius: 32px; }
      .fa-header { display: flex; align-items: center; gap: 24px; margin-bottom: 48px; border-bottom: 1px solid var(--glass-border); padding-bottom: 32px; }
      .fa-icon { color: var(--accent-red); animation: pulse 2s infinite; }
      @keyframes pulse { 0% { opacity: 0.8; } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.8; } }
      
      .back-link { background: none; border: none; color: var(--accent-cyan); cursor: pointer; margin-bottom: 24px; font-weight: 600; font-size: 1rem; }
      .guide-steps { display: flex; flex-direction: column; gap: 20px; }
      .step { padding: 32px; display: flex; gap: 32px; align-items: flex-start; border-radius: 20px; }
      .step-num { font-size: 2rem; font-weight: 900; color: var(--accent-yellow); opacity: 0.5; font-family: monospace; }
      .step-content h3 { font-size: 1.3rem; margin-bottom: 8px; }
      .step-content p { color: var(--text-secondary); line-height: 1.6; }
      .urgent-step { border-left: 6px solid var(--accent-red); background: linear-gradient(90deg, rgba(255, 69, 58, 0.05) 0%, transparent 100%); }
    `}</style>
  </div>
)

export default App

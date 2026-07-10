"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

// ── ORDIO LOGO SVG ────────────────────────────────────────────────
const OrdioLogo = ({ size = 120 }: { size?: number }) => (
  <svg width={size} height={size * 1.1} viewBox="0 0 120 132" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Tablet outline */}
    <rect x="18" y="4" width="84" height="104" rx="10" stroke="white" strokeWidth="6" fill="none"/>
    {/* Orange gradient ring */}
    <defs>
      <linearGradient id="ringGrad" x1="30" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6B00"/>
        <stop offset="1" stopColor="#FFB347"/>
      </linearGradient>
    </defs>
    <path d="M60 26 a34 34 0 1 1 -0.01 0" stroke="url(#ringGrad)" strokeWidth="7"
      fill="none" strokeLinecap="round" strokeDasharray="160 20"/>
    {/* Finger pointer */}
    <rect x="55" y="50" width="10" height="32" rx="5" fill="white"/>
    <ellipse cx="60" cy="50" rx="7" ry="7" fill="white"/>
    {/* Base */}
    <rect x="46" y="80" width="28" height="8" rx="4" fill="white" opacity="0.5"/>
    {/* "Ordio" text */}
    <text x="60" y="124" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif"
      fontSize="22" fontWeight="900" letterSpacing="-0.5">
      <tspan fill="#FF6B00">O</tspan><tspan fill="white">rdio</tspan>
    </text>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail]     = useState("")
  const [password, setPass]   = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]     = useState("")
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError("Correo o contraseña incorrectos"); setLoading(false) }
    else router.push("/admin")
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` }
    })
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"Inter, system-ui, sans-serif" }}>

      {/* ── PANEL IZQUIERDO (dark) ── */}
      <div className="hidden md:flex" style={{
        width:440, flexShrink:0, flexDirection:"column",
        background:"#0F1923", position:"relative", overflow:"hidden",
      }}>
        {/* Patrón de fondo */}
        <div style={{ position:"absolute", inset:0, opacity:0.04,
          backgroundImage:"radial-gradient(circle at 24px 24px, white 1.5px, transparent 0)",
          backgroundSize:"48px 48px" }}/>

        <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", height:"100%", padding:"44px 40px" }}>
          {/* Logo centrado grande */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:40 }}>
            <OrdioLogo size={100}/>
            <p style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:"3px", textTransform:"uppercase", margin:"8px 0 0", textAlign:"center" }}>
              KIOSCO DIGITAL PARA RESTAURANTES
            </p>
            {/* Decoración */}
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8 }}>
              <div style={{ width:28, height:2, background:"#FF6B00", borderRadius:2 }}/>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#FF6B00" }}/>
              <div style={{ width:28, height:2, background:"#FF6B00", borderRadius:2 }}/>
            </div>
          </div>

          {/* Texto bienvenida */}
          <div style={{ marginBottom:"auto" }}>
            <h1 style={{ fontSize:36, fontWeight:900, color:"white", margin:"0 0 14px", lineHeight:1.2 }}>
              Bienvenido<br/>de nuevo
            </h1>
            <p style={{ fontSize:15, color:"rgba(255,255,255,0.55)", margin:0, lineHeight:1.6 }}>
              Inicia sesión en tu panel de administración para gestionar tu restaurante.
            </p>
          </div>

          {/* Foto burger */}
          <div style={{ borderRadius:20, overflow:"hidden", height:240, marginTop:32, position:"relative" }}>
            <div style={{
              position:"absolute", inset:0,
              backgroundImage:`url("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&q=90")`,
              backgroundSize:"cover", backgroundPosition:"center",
              filter:"brightness(0.85)",
            }}/>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, #0F1923 0%, transparent 60%)" }}/>
          </div>
        </div>
      </div>

      {/* ── PANEL DERECHO (form) ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 20px", background:"#ffffff" }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          {/* Logo solo en móvil */}
          <div className="flex md:hidden" style={{ justifyContent:"center", marginBottom:32 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <svg width="60" height="66" viewBox="0 0 120 132" fill="none">
                <rect x="18" y="4" width="84" height="104" rx="10" stroke="#1E2D3D" strokeWidth="6" fill="none"/>
                <defs>
                  <linearGradient id="rg2" x1="30" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF6B00"/><stop offset="1" stopColor="#FFB347"/>
                  </linearGradient>
                </defs>
                <path d="M60 26 a34 34 0 1 1 -0.01 0" stroke="url(#rg2)" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="160 20"/>
                <rect x="55" y="50" width="10" height="32" rx="5" fill="#1E2D3D"/>
                <ellipse cx="60" cy="50" rx="7" ry="7" fill="#1E2D3D"/>
                <text x="60" y="124" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="22" fontWeight="900" letterSpacing="-0.5">
                  <tspan fill="#FF6B00">O</tspan><tspan fill="#1E2D3D">rdio</tspan>
                </text>
              </svg>
              <p style={{ fontSize:10, fontWeight:700, color:"#999", letterSpacing:"2px", textTransform:"uppercase", margin:"6px 0 0" }}>KIOSCO DIGITAL PARA RESTAURANTES</p>
            </div>
          </div>

          <h2 style={{ fontSize:28, fontWeight:900, color:"#111", margin:"0 0 6px" }}>Iniciar sesión</h2>
          <p style={{ fontSize:14, color:"#999", margin:"0 0 32px" }}>Accede a tu cuenta de administrador</p>

          <form onSubmit={handleLogin} style={{ display:"grid", gap:16 }}>
            {/* Email */}
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#555", marginBottom:6 }}>Correo electrónico</label>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="ejemplo@baggos.com" required
                  style={{ width:"100%", padding:"12px 12px 12px 42px", background:"#F8F8F8", border:"1.5px solid #EBEBEB", borderRadius:12, fontSize:14, color:"#111", fontFamily:"inherit", boxSizing:"border-box", outline:"none" }}/>
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:13, fontWeight:600, color:"#555" }}>Contraseña</label>
                <button type="button" style={{ background:"none", border:"none", fontSize:13, fontWeight:600, color:"#FF6B00", cursor:"pointer", padding:0 }}>¿Olvidaste tu contraseña?</button>
              </div>
              <div style={{ position:"relative" }}>
                <svg style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <input type="password" value={password} onChange={e=>setPass(e.target.value)}
                  placeholder="Ingresa tu contraseña" required
                  style={{ width:"100%", padding:"12px 12px 12px 42px", background:"#F8F8F8", border:"1.5px solid #EBEBEB", borderRadius:12, fontSize:14, color:"#111", fontFamily:"inherit", boxSizing:"border-box", outline:"none" }}/>
              </div>
            </div>

            {/* Recordarme */}
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
              <input type="checkbox" defaultChecked style={{ width:16, height:16, accentColor:"#FF6B00" }}/>
              <span style={{ fontSize:13, color:"#666" }}>Recordarme en este dispositivo</span>
            </label>

            {/* Error */}
            {error && (
              <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#DC2626", fontWeight:600, textAlign:"center" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ padding:"14px 0", borderRadius:12, border:"none",
                background: loading ? "#ccc" : "linear-gradient(135deg, #FF6B00, #FF9500)",
                color:"#fff", fontSize:15, fontWeight:800, cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 20px rgba(255,107,0,0.35)",
                transition:"all 0.2s" }}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1, height:1, background:"#F0F0F0" }}/>
              <span style={{ fontSize:12, color:"#ccc", fontWeight:500 }}>o</span>
              <div style={{ flex:1, height:1, background:"#F0F0F0" }}/>
            </div>

            {/* Google */}
            <button type="button" onClick={handleGoogle} disabled={googleLoading}
              style={{ padding:"13px 0", borderRadius:12, border:"1.5px solid #E8E8E8",
                background:"#fff", color:"#111", fontSize:14, fontWeight:600, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                transition:"background 0.15s" }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="#F8F8F8"}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="#fff"}>
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
            </button>
          </form>

          <p style={{ fontSize:13, color:"#aaa", textAlign:"center", marginTop:24 }}>
            ¿No tienes una cuenta?{" "}
            <span style={{ color:"#FF6B00", fontWeight:700, cursor:"pointer" }}>Contacta a tu administrador</span>
          </p>
        </div>
      </div>
    </div>
  )
}

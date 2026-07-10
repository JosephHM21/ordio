"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

const OrdioLogo = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect x="2" y="4" width="30" height="38" rx="5" stroke="#1E2D3D" strokeWidth="3.5"/>
    <path d="M17 13 a10 10 0 1 1 0 20 a10 10 0 1 1 0-20" fill="none" stroke="url(#og)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="40 10"/>
    <path d="M17 23 L17 32 Q17 34 19 34 Q21 34 21 32 L21 23" fill="#1E2D3D"/>
    <defs><linearGradient id="og" x1="7" y1="13" x2="27" y2="33" gradientUnits="userSpaceOnUse"><stop stopColor="#FF6B00"/><stop offset="1" stopColor="#FF9500"/></linearGradient></defs>
  </svg>
)

export default function LoginPage() {
  const [email, setEmail]     = useState("")
  const [password, setPass]   = useState("")
  const [loading, setLoading] = useState(false)
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

  const inp = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-[#FF6B00] transition-colors"

  return (
    <div className="min-h-screen flex" style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Panel izquierdo — solo desktop */}
      <div className="hidden md:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{background:"#1E2D3D"}}>
        {/* Patrón de fondo */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:"radial-gradient(circle at 20px 20px, white 1px, transparent 0)",backgroundSize:"40px 40px"}}/>
        {/* Logo Ordio */}
        <div className="relative z-10 flex items-center gap-3">
          <OrdioLogo/>
          <div>
            <p className="text-white font-black text-xl m-0 leading-none">Ordio</p>
            <p className="text-white/40 text-[10px] font-semibold tracking-widest m-0 uppercase">Kiosco Digital</p>
          </div>
        </div>
        {/* Texto central */}
        <div className="relative z-10">
          <h1 className="text-white font-black text-[32px] leading-tight m-0 mb-4">
            Bienvenido<br/>de nuevo 👋
          </h1>
          <p className="text-white/60 text-[15px] leading-relaxed m-0">
            Inicia sesión en tu panel de administración para gestionar tu restaurante.
          </p>
        </div>
        {/* Foto decorativa */}
        <div className="relative z-10 rounded-2xl overflow-hidden h-52" style={{background:"rgba(255,255,255,0.05)"}}>
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">🍔</div>
          <div className="absolute bottom-0 left-0 right-0 h-16" style={{background:"linear-gradient(to top, #1E2D3D, transparent)"}}/>
        </div>
      </div>

      {/* Panel derecho — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-[400px]">
          {/* Logo solo en móvil */}
          <div className="flex md:hidden items-center justify-center gap-3 mb-10">
            <OrdioLogo/>
            <div>
              <p className="font-black text-xl m-0 leading-none text-[#1E2D3D]">Ordio</p>
              <p className="text-gray-400 text-[10px] font-semibold tracking-widest m-0 uppercase">Kiosco Digital para Restaurantes</p>
            </div>
          </div>

          <h2 className="text-[26px] font-black text-[#111] m-0 mb-1">Iniciar sesión</h2>
          <p className="text-gray-400 text-[14px] m-0 mb-8">Accede a tu cuenta de administrador</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">✉️</span>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="ejemplo@baggos.com" required
                  className={inp} style={{paddingLeft:"2.5rem"}}/>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[12px] font-semibold text-gray-500">Contraseña</label>
                <button type="button" className="text-[12px] font-semibold text-[#FF6B00] bg-transparent border-none cursor-pointer p-0">¿Olvidaste tu contraseña?</button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔒</span>
                <input type="password" value={password} onChange={e=>setPass(e.target.value)}
                  placeholder="Ingresa tu contraseña" required
                  className={inp} style={{paddingLeft:"2.5rem"}}/>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded" style={{accentColor:"#FF6B00"}}/>
              <span className="text-[13px] text-gray-500">Recordarme en este dispositivo</span>
            </label>

            {error && <p className="text-[#EF4444] text-[13px] font-semibold bg-red-50 rounded-xl p-3 text-center m-0">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl border-none text-white font-black text-[15px] cursor-pointer transition-all"
              style={{background:loading?"#ccc":"linear-gradient(135deg,#FF6B00,#FF9500)",boxShadow:loading?"none":"0 4px 20px rgba(255,107,0,0.35)"}}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-100"/>
              <span className="text-[13px] text-gray-300">o</span>
              <div className="flex-1 h-px bg-gray-100"/>
            </div>

            <button type="button"
              className="w-full py-3 rounded-xl border border-gray-200 bg-white text-[#111] font-semibold text-[14px] cursor-pointer flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continuar con Google
            </button>
          </form>

          <p className="text-[13px] text-gray-400 text-center mt-6 m-0">
            ¿No tienes una cuenta?{" "}
            <span className="text-[#FF6B00] font-semibold cursor-pointer">Contacta a tu administrador</span>
          </p>
        </div>
      </div>
    </div>
  )
}

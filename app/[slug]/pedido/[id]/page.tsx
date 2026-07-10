"use client"
import React from "react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase"

// ── SVG ICONS ─────────────────────────────────────────────────────
const ArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
  </svg>
)
const HelpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const ReceiptIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const CartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
)
const WAIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)
const StepIcons: Record<string, () => React.ReactElement> = {
  pendiente: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
  ),
  en_preparacion: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3z"/>
    </svg>
  ),
  en_camino: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  entregado: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
}

// ── CONSTANTS ─────────────────────────────────────────────────────
const PASOS = [
  { key: "pendiente",      label: "Recibido",   desc: "Tu pedido fue recibido y registrado." },
  { key: "en_preparacion", label: "Preparando", desc: "Tu pedido se está preparando con cuidado." },
  { key: "en_camino",      label: "Listo",      desc: "Tu pedido está listo para entrega." },
  { key: "entregado",      label: "Entregado",  desc: "¡Tu pedido fue entregado! Buen provecho." },
]
const ESTADO_IDX: Record<string, number> = {
  pendiente: 0, en_preparacion: 1, en_camino: 2, entregado: 3,
}
const BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  pendiente:      { label: "Recibido",   bg: "#FEF3C7", color: "#D97706", border: "#FDE68A" },
  en_preparacion: { label: "Preparando", bg: "#FFF7ED", color: "#EA580C", border: "#FDBA74" },
  en_camino:      { label: "Listo",      bg: "#F0FDF4", color: "#16A34A", border: "#86EFAC" },
  entregado:      { label: "Entregado",  bg: "#F5F5F5", color: "#6B7280", border: "#E5E5E5" },
}

// ── COMPONENT ─────────────────────────────────────────────────────
export default function EstadoPedidoPage() {
  const params = useParams()
  const slug = params?.slug as string
  const id   = params?.id as string
  const [pedido, setPedido]         = useState<any>(null)
  const [restaurante, setRestaurante] = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [actualizado, setActualizado] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!id || !slug) return
    loadData()
    const ch = supabase.channel(`pedido-${id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "pedidos",
        filter: `id=eq.${id}`,
      }, payload => { setPedido(payload.new); pulseActualizado() })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [id, slug])

  async function loadData() {
    const [p, r] = await Promise.all([
      supabase.from("pedidos").select("*").eq("id", id).single(),
      supabase.from("restaurantes").select("nombre,logo_url,whatsapp,slug,config").eq("slug", slug).single(),
    ])
    if (p.data) setPedido(p.data)
    if (r.data) setRestaurante(r.data)
    setLoading(false)
  }

  function pulseActualizado() {
    setActualizado(true)
    setTimeout(() => setActualizado(false), 2000)
  }

  function compartirWA() {
    if (!pedido || !restaurante) return
    const est = BADGE[pedido.estado]?.label || pedido.estado
    const msg = `Hola, el estatus de mi pedido es: *${est}*\nPedido: ${pedido.id.slice(0,8).toUpperCase()}\nTotal: $${Number(pedido.total).toFixed(2)}`
    window.open(`https://wa.me/52${restaurante.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F5F5F5", fontFamily:"Inter,system-ui,sans-serif" }}>
      <p style={{ color:"#999", fontSize:14 }}>Cargando tu pedido...</p>
    </div>
  )

  if (!pedido) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#F5F5F5", fontFamily:"Inter,system-ui,sans-serif", gap:16 }}>
      <p style={{ fontSize:15, color:"#555" }}>No encontramos este pedido.</p>
      <Link href={`/${slug}`} style={{ color:"#111", fontWeight:700, fontSize:14 }}>Volver al menú</Link>
    </div>
  )

  const estadoIdx = ESTADO_IDX[pedido.estado] ?? 0
  const badge     = BADGE[pedido.estado] || BADGE.pendiente
  const hora      = new Date(pedido.created_at).toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" })
  const fecha     = new Date(pedido.created_at).toLocaleDateString("es-MX", { weekday:"long", day:"numeric", month:"long" })
  const pedidoNum = pedido.id.slice(0,8).toUpperCase()

  return (
    <div style={{ minHeight:"100vh", background:"#F5F5F5", fontFamily:"Inter,system-ui,sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{ background:"#fff", borderBottom:"1.5px solid #F0F0F0", position:"sticky", top:0, zIndex:30 }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <Link href={`/${slug}`} style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none", color:"#111", fontWeight:600, fontSize:13 }}>
            <ArrowLeft/>
            <span className="hidden md:inline">Volver al menú</span>
          </Link>
          <div style={{ display:"flex", justifyContent:"center" }}>
            {restaurante?.logo_url
              ? <Image src={restaurante.logo_url} alt={restaurante.nombre} width={130} height={48} style={{ objectFit:"contain", maxHeight:44, width:"auto" }}/>
              : <span style={{ fontSize:17, fontWeight:900, color:"#111" }}>{restaurante?.nombre}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ position:"relative" }}>
              <div style={{ width:36, height:36, borderRadius:10, background:"#F5F5F5", border:"1.5px solid #E5E5E5", display:"flex", alignItems:"center", justifyContent:"center", color:"#555" }}>
                <CartIcon/>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <div style={{ maxWidth:900, margin:"0 auto", padding:"24px 16px 60px" }}>

        {/* Page header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:900, color:"#111", margin:"0 0 4px" }}>Estatus de tu pedido</h1>
            <p style={{ fontSize:13, color:"#888", margin:0 }}>
              Estamos preparando tu pedido con mucho cuidado
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <a href={`https://wa.me/52${restaurante?.whatsapp}`} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:10, color:"#555", textDecoration:"none", fontSize:13, fontWeight:600 }}>
              <HelpIcon/> Ayuda
            </a>
            <button onClick={()=>{loadData();pulseActualizado()}}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background: actualizado ? "#22C55E" : "#111", border:"none", borderRadius:10, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", transition:"background 0.3s" }}>
              <RefreshIcon/> {actualizado ? "Actualizado" : "Actualizar"}
            </button>
          </div>
        </div>

        {/* ── MAIN CARD ── */}
        <div style={{ background:"#fff", borderRadius:20, border:"1.5px solid #F0F0F0", overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" }}>

          {/* Order ID + badge */}
          <div style={{ padding:"20px 24px 16px", display:"flex", alignItems:"flex-start", justifyContent:"space-between", borderBottom:"1.5px solid #F5F5F5" }}>
            <div>
              <h2 style={{ fontSize:18, fontWeight:900, color:"#111", margin:"0 0 4px" }}>Pedido #{pedidoNum}</h2>
              <p style={{ fontSize:13, color:"#888", margin:0, textTransform:"capitalize" }}>{fecha} a las {hora}</p>
            </div>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:99, fontSize:13, fontWeight:700, background:badge.bg, color:badge.color, border:`1.5px solid ${badge.border}` }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:badge.color, display:"inline-block" }}/>
              {badge.label}
            </span>
          </div>

          {/* ── PROGRESS DESKTOP (horizontal) ── */}
          <div className="hidden md:block" style={{ padding:"28px 32px 20px" }}>
            <div style={{ position:"relative", display:"flex", alignItems:"flex-start" }}>
              {/* Connecting lines */}
              {PASOS.map((_, i) => i < PASOS.length - 1 && (
                <div key={`line-${i}`} style={{
                  position:"absolute", top:20, left:`${(i * (100 / (PASOS.length - 1))) + (100 / (PASOS.length - 1)) * 0.1}%`,
                  width:`${100 / (PASOS.length - 1) * 0.8}%`, height:2,
                  background: i < estadoIdx ? "#FF8C00" : "#E5E5E5",
                  transition:"background 0.5s",
                }}/>
              ))}
              {PASOS.map((paso, i) => {
                const done    = i < estadoIdx
                const current = i === estadoIdx
                const Icon    = StepIcons[paso.key]
                return (
                  <div key={paso.key} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:10, position:"relative", zIndex:1 }}>
                    <div style={{
                      width:40, height:40, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                      background: done ? "#FF8C00" : current ? "#FF8C00" : "#F5F5F5",
                      color: (done || current) ? "#fff" : "#ccc",
                      border: `2px solid ${done || current ? "#FF8C00" : "#E5E5E5"}`,
                      transition:"all 0.4s",
                      boxShadow: current ? "0 0 0 4px rgba(255,140,0,0.15)" : "none",
                    }}>
                      {done ? <CheckIcon size={18}/> : <Icon/>}
                    </div>
                    <div style={{ textAlign:"center" }}>
                      <p style={{ fontSize:13, fontWeight:700, color: (done || current) ? "#111" : "#aaa", margin:"0 0 2px" }}>{paso.label}</p>
                      <p style={{ fontSize:11, color: (done || current) ? "#888" : "#ccc", margin:0 }}>
                        {i === 0 ? hora : current ? hora : "Próximamente"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── PROGRESS MÓVIL (vertical timeline) ── */}
          <div className="md:hidden" style={{ padding:"20px 20px 8px" }}>
            {PASOS.map((paso, i) => {
              const done    = i < estadoIdx
              const current = i === estadoIdx
              const isLast  = i === PASOS.length - 1
              const Icon    = StepIcons[paso.key]
              return (
                <div key={paso.key} style={{ display:"flex", gap:14, paddingBottom: isLast ? 0 : 20, position:"relative" }}>
                  {/* Vertical line */}
                  {!isLast && (
                    <div style={{ position:"absolute", left:17, top:36, width:2, height:"calc(100% - 8px)", background: done ? "#FF8C00" : "#E5E5E5" }}/>
                  )}
                  {/* Circle */}
                  <div style={{ flex:"none", width:36, height:36, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                    background: done ? "#FF8C00" : current ? "#FF8C00" : "#F5F5F5",
                    color: (done || current) ? "#fff" : "#ccc",
                    border:`2px solid ${done || current ? "#FF8C00" : "#E5E5E5"}`,
                    boxShadow: current ? "0 0 0 3px rgba(255,140,0,0.15)" : "none",
                    zIndex:1, position:"relative",
                  }}>
                    {done ? <CheckIcon size={16}/> : <Icon/>}
                  </div>
                  {/* Text */}
                  <div style={{ paddingTop:6 }}>
                    <p style={{ fontSize:14, fontWeight:700, color: (done || current) ? "#111" : "#aaa", margin:"0 0 2px" }}>{paso.label}</p>
                    <p style={{ fontSize:12, color:"#999", margin:"0 0 2px" }}>
                      {i === 0 ? hora : current ? hora : "Próximamente"}
                    </p>
                    {current && <p style={{ fontSize:12, color:"#666", margin:0 }}>{paso.desc}</p>}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ padding:"0 24px 24px" }}>
            {/* Tiempo estimado */}
            <div style={{ background:"#FFF8F0", border:"1px solid rgba(255,140,0,0.2)", borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, margin:"16px 0 24px" }}>
              <div style={{ color:"#FF8C00", flexShrink:0 }}><ClockIcon/></div>
              <div>
                <p style={{ fontSize:11, color:"#888", fontWeight:600, margin:"0 0 2px", textTransform:"uppercase", letterSpacing:"0.4px" }}>Tiempo estimado</p>
                <p style={{ fontSize:20, fontWeight:900, color:"#111", margin:"0 0 2px" }}>{pedido.tiempo_estimado || "25 - 35 min"}</p>
                <p style={{ fontSize:12, color:"#888", margin:0 }}>En preparación</p>
              </div>
            </div>

            {/* Detalles */}
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <p style={{ fontSize:15, fontWeight:800, color:"#111", margin:0 }}>Detalles del pedido</p>
                <button style={{ display:"flex", alignItems:"center", gap:5, background:"transparent", border:"1.5px solid #E5E5E5", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>
                  <ReceiptIcon/> Ver recibo
                </button>
              </div>
              <div style={{ display:"grid", gap:12 }}>
                {(pedido.items || []).map((item: any, i: number) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:52, height:52, borderRadius:10, background:"#1A1A1A", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
                      <CartIcon/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:14, fontWeight:700, color:"#111", margin:"0 0 2px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.nombre}</p>
                      {item.sabor && <p style={{ fontSize:12, color:"#888", margin:0 }}>Sabor: {item.sabor}</p>}
                      {(item.ingredientesEliminados||[]).length > 0 && (
                        <p style={{ fontSize:12, color:"#888", margin:0 }}>Sin: {item.ingredientesEliminados.join(", ")}</p>
                      )}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <p style={{ fontSize:13, color:"#888", margin:"0 0 2px" }}>x{item.cantidad}</p>
                      <p style={{ fontSize:14, fontWeight:800, color:"#111", margin:0 }}>${(item.precio * item.cantidad).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:"1.5px solid #F0F0F0", marginTop:16, paddingTop:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:16, fontWeight:900, color:"#111" }}>Total</span>
                <span style={{ fontSize:22, fontWeight:900, color:"#EA580C" }}>${Number(pedido.total || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* WhatsApp row */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", background:"#F8FFF8", border:"1.5px solid #D1FAE5", borderRadius:12, marginBottom:20, gap:12, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ color:"#25D366" }}><WAIcon/></span>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:"#111", margin:"0 0 1px" }}>Enviaremos actualizaciones a tu WhatsApp</p>
                  <p style={{ fontSize:12, color:"#888", margin:0 }}>Te notificaremos cuando tu pedido esté listo o en camino.</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:5, background:"#F0FDF4", border:"1px solid #86EFAC", borderRadius:99, padding:"4px 12px", flexShrink:0 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:"#22C55E" }}/>
                <span style={{ fontSize:12, fontWeight:700, color:"#16A34A" }}>Conectado</span>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <Link href={`/${slug}`}
                style={{ flex:1, minWidth:140, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 0", background:"#fff", border:"1.5px solid #E5E5E5", borderRadius:12, color:"#111", textDecoration:"none", fontSize:14, fontWeight:700 }}>
                <ClockIcon/> Volver al menú
              </Link>
              <button onClick={compartirWA}
                style={{ flex:1, minWidth:140, display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"13px 0", background:"#25D366", border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer" }}>
                <WAIcon/> Compartir estatus
              </button>
            </div>
          </div>
        </div>

        {/* Nota */}
        <p style={{ fontSize:12, color:"#bbb", textAlign:"center", marginTop:20 }}>
          Impulsado por <span style={{ color:"#FF8C00", fontWeight:700 }}>Ordio</span>
        </p>
      </div>
    </div>
  )
}

"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"

// ── SVG NAV ICONS ─────────────────────────────────────────────────
const NavIcons: Record<string, () => React.ReactElement> = {
  dashboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  pedidos: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/>
    </svg>
  ),
  menu: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/>
      <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3z"/>
    </svg>
  ),
  promociones: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  clientes: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  metricas: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  resenas: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  config: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  usuarios: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
}

const NAV = [
  { href:"/admin",              label:"Dashboard",    iconKey:"dashboard", badge:false },
  { href:"/admin/pedidos",      label:"Pedidos",      iconKey:"pedidos",   badge:true  },
  { href:"/admin/productos",    label:"Menú",         iconKey:"menu",      badge:false },
  { href:"/admin/promociones",  label:"Promociones",  iconKey:"promociones",badge:false},
  { href:"/admin/clientes",     label:"Clientes",     iconKey:"clientes",  badge:false },
  { href:"/admin/estadisticas", label:"Métricas",     iconKey:"metricas",  badge:false },
  { href:"/admin/resenas",      label:"Reseñas",      iconKey:"resenas",   badge:false },
  { href:"/admin/config",       label:"Configuración",iconKey:"config",    badge:false },
  { href:"/admin/usuarios",     label:"Usuarios",     iconKey:"usuarios",  badge:false },
]
const BOT_NAV = [
  { href:"/admin",              label:"Inicio",    iconKey:"dashboard", badge:false },
  { href:"/admin/pedidos",      label:"Pedidos",   iconKey:"pedidos",   badge:true  },
  { href:"/admin/productos",    label:"Menú",      iconKey:"menu",      badge:false },
  { href:"/admin/estadisticas", label:"Métricas",  iconKey:"metricas",  badge:false },
  { href:"/admin/config",       label:"Config",    iconKey:"config",    badge:false },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [restaurante, setRestaurante] = useState<any>(null)
  const [pedidosActivos, setPedidosActivos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sideOpen, setSideOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/login"); return }
      const { data: u } = await supabase.from("usuarios").select("restaurante_id").eq("id", data.user.id).single()
      if (!u?.restaurante_id) { setLoading(false); return }
      const rid = u.restaurante_id
      const { data: r } = await supabase.from("restaurantes").select("nombre,logo_url,slug").eq("id", rid).single()
      if (r) setRestaurante(r)
      async function fetchA() {
        const { count } = await supabase.from("pedidos").select("id", { count: "exact" })
          .eq("restaurante_id", rid).in("estado", ["pendiente", "en_preparacion"])
        setPedidosActivos(count || 0)
      }
      supabase.channel("badge").on("postgres_changes", { event: "*", schema: "public", table: "pedidos", filter: `restaurante_id=eq.${rid}` }, fetchA).subscribe()
      fetchA()
      setLoading(false)
    })
  }, [])

  async function salir() { await supabase.auth.signOut(); router.push("/login") }

  const SideContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100">
        {restaurante?.logo_url
          ? <img src={restaurante.logo_url} alt={restaurante.nombre||""} style={{maxHeight:52,maxWidth:160,width:"auto",height:"auto",display:"block"}}/>
          : <div className="text-lg font-black text-gray-900">{restaurante?.nombre||"Panel"}</div>}
      </div>
      <nav className="flex-1 p-2.5 overflow-y-auto">
        {NAV.map(item => {
          const a = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
          const Icon = NavIcons[item.iconKey]
          return (
            <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 no-underline transition-all"
              style={{ background: a ? "#111" : "transparent", color: a ? "#fff" : "#666", fontWeight: a ? 700 : 500, fontSize: 13 }}>
              <span className="flex-shrink-0"><Icon/></span>
              <span className="flex-1">{item.label}</span>
              {item.badge && pedidosActivos > 0 && (
                <span className="bg-red-500 text-white rounded-full px-1.5 text-[10px] font-black">{pedidosActivos}</span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="p-3">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-xs font-bold text-gray-900 mb-1">Vista pública</p>
          <p className="text-xs text-gray-400 mb-2 leading-relaxed">Ver el menú como lo ven tus clientes.</p>
          <Link href={`/${restaurante?.slug||"baggos"}`} target="_blank"
            className="flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 no-underline">
            Abrir menú ↗
          </Link>
        </div>
      </div>
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
            {(restaurante?.nombre||"B").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900 m-0 truncate">{restaurante?.nombre||"Restaurante"}</p>
            <p className="text-xs text-gray-400 m-0">Admin</p>
          </div>
        </div>
        <button onClick={salir} className="w-full py-1.5 bg-transparent border border-red-100 rounded-lg text-xs font-bold text-red-500 cursor-pointer">
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <p className="text-gray-400 text-sm">Cargando panel...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50" style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-56 bg-white border-r border-gray-100 z-50">
        <SideContent/>
      </aside>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4">
        <button onClick={() => setSideOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border-none cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="flex justify-center">
          {restaurante?.logo_url
            ? <img src={restaurante.logo_url} alt={restaurante.nombre||""} style={{maxHeight:40,maxWidth:120,width:"auto",height:"auto"}}/>
            : <span className="text-base font-black text-gray-900">{restaurante?.nombre}</span>}
        </div>
        <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          {pedidosActivos > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{pedidosActivos}</span>}
        </div>
      </div>
      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={e => e.target === e.currentTarget && setSideOpen(false)} style={{background:"rgba(0,0,0,0.4)",backdropFilter:"blur(2px)"}}>
          <div className="w-64 bg-white h-full overflow-y-auto"><SideContent/></div>
        </div>
      )}
      <main className="md:ml-56 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <div className="p-4 md:p-7">{children}</div>
      </main>
      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 z-40 flex">
        {BOT_NAV.map(item => {
          const a = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
          const Icon = NavIcons[item.iconKey]
          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-0.5 no-underline border-none bg-transparent cursor-pointer">
              <div className="relative" style={{color: a ? "#111" : "#aaa"}}>
                <Icon/>
                {item.badge && pedidosActivos > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">{pedidosActivos}</span>
                )}
              </div>
              <span style={{fontSize:9,fontWeight:a?700:500,color:a?"#111":"#aaa"}}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

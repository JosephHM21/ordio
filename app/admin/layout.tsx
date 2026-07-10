"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase"

const NAV = [
  { href:"/admin",              label:"Dashboard",    icon:"⊞" },
  { href:"/admin/pedidos",      label:"Pedidos",      icon:"📋", badge:true },
  { href:"/admin/productos",    label:"Menú",         icon:"🍽️" },
  { href:"/admin/promociones",  label:"Promociones",  icon:"🏷️" },
  { href:"/admin/clientes",     label:"Clientes",     icon:"👥" },
  { href:"/admin/estadisticas", label:"Métricas",     icon:"📊" },
  { href:"/admin/resenas",      label:"Reseñas",      icon:"⭐" },
  { href:"/admin/config",       label:"Configuración",icon:"⚙️" },
  { href:"/admin/usuarios",     label:"Usuarios",     icon:"👤" },
]
const BOT_NAV = [
  { href:"/admin",              label:"Dashboard", icon:"⊞" },
  { href:"/admin/pedidos",      label:"Pedidos",   icon:"📋", badge:true },
  { href:"/admin/productos",    label:"Menú",      icon:"🍽️" },
  { href:"/admin/estadisticas", label:"Métricas",  icon:"📊" },
  { href:"/admin/config",       label:"Más",       icon:"⚙️" },
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
      {/* Logo */}
      <div className="p-4 border-b border-gray-100">
        {restaurante?.logo_url
          ? <Image src={restaurante.logo_url} alt={restaurante.nombre||""} width={140} height={56} style={{objectFit:"contain",maxHeight:56,width:"auto"}}/>
          : <div className="text-[18px] font-black text-[#111]">{restaurante?.nombre||"Panel"}</div>}
      </div>
      {/* Nav */}
      <nav className="flex-1 p-2.5 overflow-y-auto">
        {NAV.map(item => {
          const a = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} onClick={() => setSideOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 no-underline transition-all"
              style={{ background: a ? "#111" : "transparent", color: a ? "#fff" : "#666", fontWeight: a ? 700 : 500, fontSize: 13 }}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && pedidosActivos > 0 && (
                <span className="bg-[#EF4444] text-white rounded-full px-1.5 text-[10px] font-black">{pedidosActivos}</span>
              )}
            </Link>
          )
        })}
      </nav>
      {/* Vista pública */}
      <div className="p-3">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[12px] font-bold text-[#111] m-0 mb-1">Vista pública</p>
          <p className="text-[11px] text-gray-400 m-0 mb-2 leading-relaxed">Ver cómo ven los clientes tu menú.</p>
          <Link href={`/${restaurante?.slug||"baggos"}`} target="_blank"
            className="flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-[#111] no-underline">
            Abrir menú ↗
          </Link>
        </div>
      </div>
      {/* User */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#111] text-white flex items-center justify-center text-[12px] font-black flex-shrink-0">
            {(restaurante?.nombre||"B").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#111] m-0 truncate">{restaurante?.nombre||"Restaurante"}</p>
            <p className="text-[11px] text-gray-400 m-0">Admin</p>
          </div>
        </div>
        <button onClick={salir} className="w-full py-1.5 bg-transparent border border-red-100 rounded-lg text-[11px] font-bold text-red-500 cursor-pointer">
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <p className="text-gray-400 text-[14px]">Cargando panel...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F8F8]" style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[220px] bg-white border-r border-gray-100 z-50">
        <SideContent/>
      </aside>

      {/* TOPBAR MÓVIL */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-40 flex items-center justify-between px-4">
        <button onClick={() => setSideOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 border-none cursor-pointer text-lg">☰</button>
        <div className="flex justify-center">
          {restaurante?.logo_url
            ? <Image src={restaurante.logo_url} alt={restaurante.nombre||""} width={100} height={40} style={{objectFit:"contain",maxHeight:40,width:"auto"}}/>
            : <span className="text-[16px] font-black text-[#111]">{restaurante?.nombre}</span>}
        </div>
        <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-lg">
          🔔
          {pedidosActivos > 0 && <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{pedidosActivos}</span>}
        </div>
      </div>

      {/* SIDEBAR MÓVIL — overlay */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" onClick={e => e.target === e.currentTarget && setSideOpen(false)}
          style={{background:"rgba(0,0,0,0.4)",backdropFilter:"blur(2px)"}}>
          <div className="w-64 bg-white h-full overflow-y-auto">
            <SideContent/>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="md:ml-[220px] pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <div className="p-4 md:p-7">
          {children}
        </div>
      </main>

      {/* BOTTOM NAV MÓVIL */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 z-40 flex">
        {BOT_NAV.map(item => {
          const a = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 no-underline border-none bg-transparent cursor-pointer">
              <div className="relative">
                <span className={`text-lg leading-none ${a ? "opacity-100" : "opacity-40"}`}>{item.icon}</span>
                {item.badge && pedidosActivos > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">{pedidosActivos}</span>
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

"use client"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

const ESTADO_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pendiente:      { label: "Recibido",   bg: "#FEF3C7", color: "#D97706" },
  en_preparacion: { label: "Preparando", bg: "#FEF3C7", color: "#EA580C" },
  en_camino:      { label: "Listo",      bg: "#F0FDF4", color: "#16A34A" },
  entregado:      { label: "Entregado",  bg: "#F5F5F5", color: "#888"    },
  cancelado:      { label: "Cancelado",  bg: "#FEF2F2", color: "#EF4444" },
}

const ACCESOS = [
  { label: "Agregar producto", icon: "🍔", href: "/admin/productos" },
  { label: "Nueva promoción",  icon: "🏷️", href: "/admin/promociones" },
  { label: "Ver pedidos",      icon: "📋", href: "/admin/pedidos" },
  { label: "Ver métricas",     icon: "📊", href: "/admin/estadisticas" },
  { label: "Compartir QR",     icon: "📱", href: "#qr" },
  { label: "Editar menú",      icon: "🍴", href: "/admin/productos" },
]

export default function DashboardPage() {
  const [restaurante, setRestaurante] = useState<any>(null)
  const [pedidosHoy, setPedidosHoy] = useState<any[]>([])
  const [pedidosAyer, setPedidosAyer] = useState<any[]>([])
  const [pedidosSemana, setPedidosSemana] = useState<any[]>([])
  const [pedidosRecientes, setPedidosRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState("baggos")
  const chartVRef = useRef<HTMLCanvasElement>(null)
  const chartDRef = useRef<HTMLCanvasElement>(null)
  const chartVInstance = useRef<Chart | null>(null)
  const chartDInstance = useRef<Chart | null>(null)
  const supabase = createClient()

  const hoy = new Date()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: u } = await supabase.from("usuarios")
        .select("restaurante_id").eq("id", data.user.id).single()
      if (!u?.restaurante_id) return
      const { data: r } = await supabase.from("restaurantes")
        .select("nombre, slug, logo_url").eq("id", u.restaurante_id).single()
      if (r) { setRestaurante(r); setSlug(r.slug) }
      await fetchData(u.restaurante_id)
      setLoading(false)
    })
  }, [])

  async function fetchData(rid: string) {
    const ahora = new Date()
    const inicioHoy = new Date(ahora); inicioHoy.setHours(0,0,0,0)
    const inicioAyer = new Date(inicioHoy); inicioAyer.setDate(inicioAyer.getDate() - 1)
    const finAyer = new Date(inicioHoy)
    const inicioSemana = new Date(inicioHoy); inicioSemana.setDate(inicioSemana.getDate() - 6)
    const [r1, r2, r3, r4] = await Promise.all([
      supabase.from("pedidos").select("*").eq("restaurante_id", rid)
        .neq("estado","cancelado").gte("created_at", inicioHoy.toISOString()),
      supabase.from("pedidos").select("total").eq("restaurante_id", rid)
        .neq("estado","cancelado")
        .gte("created_at", inicioAyer.toISOString())
        .lt("created_at", finAyer.toISOString()),
      supabase.from("pedidos").select("*").eq("restaurante_id", rid)
        .neq("estado","cancelado").gte("created_at", inicioSemana.toISOString()).order("created_at"),
      supabase.from("pedidos").select("*").eq("restaurante_id", rid)
        .order("created_at", { ascending: false }).limit(5),
    ])
    if (r1.data) setPedidosHoy(r1.data)
    if (r2.data) setPedidosAyer(r2.data)
    if (r3.data) setPedidosSemana(r3.data)
    if (r4.data) setPedidosRecientes(r4.data)
  }

  // KPIs
  const totalHoy   = pedidosHoy.reduce((s, p) => s + Number(p.total || 0), 0)
  const totalAyer  = pedidosAyer.reduce((s, p) => s + Number(p.total || 0), 0)
  const pctPedidos = pedidosAyer.length > 0 ? Math.round(((pedidosHoy.length - pedidosAyer.length) / pedidosAyer.length) * 100) : 0
  const pctVentas  = totalAyer > 0 ? Math.round(((totalHoy - totalAyer) / totalAyer) * 100) : 0
  const tiemposProm = pedidosHoy.flatMap(p => (p.items || []).map((i: any) => i.tiempoPrep || 0)).filter(Boolean)
  const tiempoAvg  = tiemposProm.length > 0 ? Math.round(tiemposProm.reduce((s: number, t: number) => s + t, 0) / tiemposProm.length) : 0
  const clientesUnicos = new Set(pedidosHoy.map(p => p.cliente_nombre)).size

  // Top productos
  const prodMap: Record<string, number> = {}
  pedidosSemana.forEach(p => {
    ;(p.items || []).forEach((i: any) => { prodMap[i.nombre] = (prodMap[i.nombre] || 0) + i.cantidad })
  })
  const topProds = Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxProd = topProds[0]?.[1] || 1

  // Chart ventas
  useEffect(() => {
    if (!chartVRef.current) return
    const dias: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
      const k = d.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
      dias[k] = 0
    }
    pedidosSemana.forEach(p => {
      const f = new Date(p.created_at)
      const k = f.toLocaleDateString("es-MX", { day: "numeric", month: "short" })
      if (k in dias) dias[k] += Number(p.total || 0)
    })
    const labels = Object.keys(dias)
    const values = Object.values(dias)
    if (chartVInstance.current) chartVInstance.current.destroy()
    chartVInstance.current = new Chart(chartVRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data: values, fill: true, tension: 0.4,
          borderColor: "#FF8C00", borderWidth: 2.5,
          backgroundColor: "rgba(255,140,0,0.07)",
          pointBackgroundColor: "#FF8C00", pointRadius: 4, pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#888", font: { size: 11 } } },
          y: {
            grid: { color: "#F0F0F0" },
            ticks: { color: "#888", font: { size: 11 }, callback: (v) => Number(v) >= 1000 ? `$${(Number(v)/1000).toFixed(0)}K` : `$${v}` }
          },
        },
      },
    })
  }, [pedidosSemana])

  // Chart donut
  useEffect(() => {
    if (!chartDRef.current || loading) return
    if (chartDInstance.current) chartDInstance.current.destroy()
    chartDInstance.current = new Chart(chartDRef.current, {
      type: "doughnut",
      data: {
        labels: ["WhatsApp", "QR / Menú digital", "Teléfono"],
        datasets: [{
          data: [75, 20, 5],
          backgroundColor: ["#22C55E", "#FF8C00", "#EF4444"],
          borderWidth: 0,
          // @ts-ignore
          cutout: "70%",
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    })
  }, [loading])

  const card = { background: "#fff", borderRadius: 14, border: "1.5px solid #F0F0F0", padding: "18px 20px" }
  const lbl  = { fontSize: 11, color: "#888", fontWeight: 600 as const, margin: "0 0 4px", textTransform: "uppercase" as const, letterSpacing: "0.4px" }
  const val  = { fontSize: 28, fontWeight: 900 as const, color: "#111", margin: "0 0 4px", letterSpacing: "-0.5px" }

  function pct(n: number) {
    const color = n >= 0 ? "#16A34A" : "#EF4444"
    return <span style={{ fontSize: 12, color, fontWeight: 700 }}>{n >= 0 ? "↑" : "↓"} {Math.abs(n)}% vs ayer</span>
  }

  if (loading) return <div style={{ color: "#999", padding: 40 }}>Cargando...</div>

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>
            ¡Bienvenido, {restaurante?.nombre?.split(" ")[0] || "Admin"}! 👋
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Aquí tienes un resumen de tu restaurante hoy.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ background: "#fff", border: "1.5px solid #F0F0F0", borderRadius: 10, padding: "8px 14px", fontSize: 13, color: "#555" }}>
            📅 {hoy.toLocaleDateString("es-MX", { day: "numeric", month: "long" })}
          </div>
          <Link href="/admin/productos" style={{ background: "#111", color: "#fff", padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
            + Nuevo
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { icon: "🛍️", bg: "#FEF3C7", label: "Pedidos hoy",   valor: pedidosHoy.length.toString(), extra: pct(pctPedidos) },
          { icon: "💰", bg: "#FEE2E2", label: "Ventas hoy",    valor: `$${totalHoy.toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2})}`, extra: pct(pctVentas) },
          { icon: "👥", bg: "#FEF3C7", label: "Clientes hoy",  valor: clientesUnicos.toString(), extra: <span style={{ fontSize: 12, color: "#888" }}>pedidos únicos</span> },
          { icon: "⏱️", bg: "#F5F5F5", label: "Tiempo prom.",  valor: tiempoAvg ? `${tiempoAvg} min` : "— min", extra: <span style={{ fontSize: 12, color: "#888" }}>de preparación</span> },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{k.icon}</div>
              <p style={lbl}>{k.label}</p>
            </div>
            <p style={val}>{k.valor}</p>
            {k.extra}
          </div>
        ))}
      </div>

      {/* Ventas + Recientes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>Resumen de ventas</p>
            <span style={{ fontSize: 12, color: "#888", background: "#F5F5F5", padding: "4px 10px", borderRadius: 99 }}>Últimos 7 días</span>
          </div>
          <div style={{ height: 220 }}><canvas ref={chartVRef} /></div>
        </div>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>Pedidos recientes</p>
            <Link href="/admin/pedidos" style={{ fontSize: 12, color: "#FF8C00", fontWeight: 700, textDecoration: "none" }}>Ver todos</Link>
          </div>
          {pedidosRecientes.length === 0
            ? <p style={{ color: "#bbb", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Sin pedidos aún</p>
            : pedidosRecientes.map(p => {
                const est = ESTADO_BADGE[p.estado] || ESTADO_BADGE.pendiente
                const hora = new Date(p.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #F5F5F5" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#F8F8F8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>📋</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#111", margin: "0 0 1px" }}>
                        #{p.id.slice(0,6).toUpperCase()} · {p.cliente_nombre?.split(" ")[0]}
                      </p>
                      <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>Hoy, {hora} · {(p.items||[]).length} prod.</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#111", margin: "0 0 3px" }}>${Number(p.total||0).toFixed(2)}</p>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: est.bg, color: est.color }}>{est.label}</span>
                    </div>
                  </div>
                )
              })}
        </div>
      </div>

      {/* Top prods + Canales + Accesos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 1fr", gap: 16 }}>
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: 0 }}>Productos más vendidos</p>
            <Link href="/admin/estadisticas" style={{ fontSize: 12, color: "#FF8C00", fontWeight: 700, textDecoration: "none" }}>Ver todos</Link>
          </div>
          {topProds.length === 0
            ? <p style={{ color: "#bbb", fontSize: 13 }}>Sin datos esta semana</p>
            : topProds.map(([nombre, qty], i) => (
              <div key={nombre} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#888", width: 16 }}>{i+1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111", margin: "0 0 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</p>
                  <div style={{ height: 6, background: "#F0F0F0", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#FF8C00", borderRadius: 99, width: `${(qty/maxProd)*100}%` }} />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#888", flexShrink: 0 }}>{qty} vend.</span>
              </div>
            ))}
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column" }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 14px" }}>Canales de pedidos</p>
          <div style={{ position: "relative", height: 130, marginBottom: 12 }}>
            <canvas ref={chartDRef} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", pointerEvents: "none" }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#111" }}>{pedidosHoy.length}</span>
              <span style={{ fontSize: 10, color: "#888" }}>Total</span>
            </div>
          </div>
          {[
            { label: "WhatsApp",       color: "#22C55E", pct: 75 },
            { label: "QR / Menú dig.", color: "#FF8C00", pct: 20 },
            { label: "Teléfono",       color: "#EF4444", pct: 5  },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#555", flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#111" }}>{c.pct}%</span>
            </div>
          ))}
        </div>
        <div style={card}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#111", margin: "0 0 14px" }}>Accesos rápidos</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {ACCESOS.map(a => (
              <Link key={a.label} href={a.href}
                onClick={a.href === "#qr" ? (e) => { e.preventDefault(); navigator.clipboard?.writeText(`https://ordio-mx.vercel.app/${slug}`); alert(`¡Link copiado!
ordio-mx.vercel.app/${slug}`) } : undefined}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 7, padding: "14px 10px", background: "#F8F8F8", borderRadius: 12, border: "1.5px solid #F0F0F0", textDecoration: "none" }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#555", textAlign: "center", lineHeight: 1.3 }}>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

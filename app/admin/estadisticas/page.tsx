"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import type { Pedido } from "@/types"

export default function EstadisticasPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: u } = await supabase.from("usuarios").select("restaurante_id").eq("id", data.user.id).single()
      if (u?.restaurante_id) {
        setRestauranteId(u.restaurante_id)
        const { data: p } = await supabase.from("pedidos").select("*")
          .eq("restaurante_id", u.restaurante_id).neq("estado", "cancelado").order("created_at", { ascending: false }).limit(500)
        if (p) setPedidos(p as Pedido[])
      }
    })
  }, [])

  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const semana = new Date(hoy); semana.setDate(hoy.getDate() - 7)

  const pedidosHoy = pedidos.filter(p => new Date(p.created_at) >= hoy)
  const pedidosSemana = pedidos.filter(p => new Date(p.created_at) >= semana)
  const ventasHoy = pedidosHoy.reduce((s,p) => s + Number(p.total), 0)
  const ventasSemana = pedidosSemana.reduce((s,p) => s + Number(p.total), 0)
  const ticketProm = pedidosHoy.length ? ventasHoy / pedidosHoy.length : 0

  // Top productos hoy
  const prodMap: Record<string, number> = {}
  pedidosHoy.forEach(p => {
    (p.items as any[]).forEach((item: any) => {
      prodMap[item.nombre] = (prodMap[item.nombre] || 0) + item.cantidad
    })
  })
  const topProds = Object.entries(prodMap).sort((a,b) => b[1]-a[1]).slice(0,8)

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Estadísticas</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label:"Pedidos hoy", val:pedidosHoy.length, c:"text-gold" },
          { label:"Ventas hoy", val:`$${ventasHoy.toFixed(2)}`, c:"text-green-400" },
          { label:"Ticket promedio", val:`$${ticketProm.toFixed(2)}`, c:"text-gold" },
          { label:"Ventas esta semana", val:`$${ventasSemana.toFixed(2)}`, c:"text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-brand-card border border-brand-border rounded-xl p-4">
            <p className="text-xs text-brand-muted uppercase tracking-wide font-semibold mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.c}`}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="bg-brand-card border border-brand-border rounded-xl p-5">
        <h2 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-4">Productos más pedidos hoy</h2>
        {topProds.length === 0
          ? <p className="text-center text-brand-muted2 py-8">Sin pedidos hoy</p>
          : topProds.map(([nombre, qty], i) => (
            <div key={nombre} className="flex items-center gap-3 py-3 border-b border-brand-border/50">
              <span className="text-brand-muted text-sm font-bold w-6">{i+1}</span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm">{nombre}</span>
                  <span className="text-gold font-bold text-sm">{qty} uds.</span>
                </div>
                <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: `${(qty / topProds[0][1]) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

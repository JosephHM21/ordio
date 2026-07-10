"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { ESTADO_LABELS } from "@/lib/utils"
import type { Pedido } from "@/types"

const PASOS = ["pendiente", "en_preparacion", "en_camino", "entregado"] as const

export default function EstadoPedido({ pedido: inicial, restaurante }: { pedido: Pedido; restaurante: { nombre: string } }) {
  const [pedido, setPedido] = useState(inicial)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel("pedido-status")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "pedidos", filter: `id=eq.${inicial.id}` },
        payload => setPedido(payload.new as Pedido))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [inicial.id])

  const estado = ESTADO_LABELS[pedido.estado] || ESTADO_LABELS.pendiente
  const pasoActual = PASOS.indexOf(pedido.estado as any)

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gold">{restaurante.nombre}</h1>
          <p className="text-brand-muted2 text-sm mt-1">Seguimiento de tu pedido</p>
        </div>
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6">
          <div className="text-center mb-6">
            <p className="text-xs text-brand-muted mb-1">Pedido #{pedido.id.slice(0,8).toUpperCase()}</p>
            <span className={`inline-block px-4 py-2 rounded-full border text-sm font-bold ${estado.color}`}>
              {estado.label}
            </span>
            {pedido.tiempo_estimado && pedido.estado !== "entregado" && (
              <p className="text-gold font-bold text-lg mt-3">{pedido.tiempo_estimado}</p>
            )}
          </div>

          {/* Steps */}
          <div className="flex justify-between relative mb-8">
            <div className="absolute top-3 left-[12%] right-[12%] h-0.5 bg-brand-border" />
            {PASOS.map((paso, i) => {
              const labels = { pendiente: "Recibido", en_preparacion: "Preparando", en_camino: "En camino", entregado: "Entregado" }
              const done = i <= pasoActual
              const active = i === pasoActual
              return (
                <div key={paso} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                    ${done ? "bg-green-500 text-white" : "bg-brand-border text-brand-muted"}
                    ${active ? "ring-4 ring-green-500/20" : ""}`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <span className={`text-xs font-semibold text-center ${done ? "text-green-400" : "text-brand-muted"}`}>
                    {labels[paso]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Resumen */}
          <div className="border-t border-brand-border pt-4 space-y-2">
            {(pedido.items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-brand-muted2">{item.cantidad}x {item.nombre}{item.sabor ? ` (${item.sabor})` : ""}</span>
                <span className="font-semibold">${(item.precio * item.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-black pt-2 border-t border-brand-border">
              <span>Total</span>
              <span className="text-green-400">${Number(pedido.total).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

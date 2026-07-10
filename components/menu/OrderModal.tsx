"use client"
import { useState } from "react"
import type { CartItem } from "@/types"

interface Props {
  carrito: CartItem[]
  total: number
  tiempo: string
  onClose: () => void
  onEnviar: (nombre: string, direccion: string, notas: string) => Promise<void>
}

export default function OrderModal({ carrito, total, tiempo, onClose, onEnviar }: Props) {
  const [nombre, setNombre] = useState("")
  const [direccion, setDireccion] = useState("")
  const [notas, setNotas] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!nombre.trim() || !direccion.trim()) return
    setLoading(true)
    await onEnviar(nombre, direccion, notas)
    setLoading(false)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 520, borderRadius: "20px 20px 0 0", padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: "#111", margin: 0 }}>¿A dónde enviamos tu pedido?</h2>
          <button onClick={onClose} style={{ background: "#F5F5F5", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>

        {/* Resumen rápido */}
        <div style={{ background: "#F8F8F8", borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "#666" }}>{carrito.reduce((s,i) => s+i.cantidad, 0)} productos</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#111" }}>${total.toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 12 }}>⏱️</span>
            <span style={{ fontSize: 12, color: "#666" }}>Tiempo estimado: <strong style={{ color: "#111" }}>{tiempo}</strong></span>
          </div>
        </div>

        {/* Formulario */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Tu nombre *</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Ej: María González"
            style={{ width: "100%", padding: "11px 13px", background: "#F8F8F8", border: "1.5px solid #E8E8E8", borderRadius: 10, fontSize: 14, color: "#111", fontFamily: "inherit" }} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Dirección de entrega *</label>
          <textarea value={direccion} onChange={e => setDireccion(e.target.value)} rows={2}
            placeholder="Calle, número, colonia, referencias..."
            style={{ width: "100%", padding: "11px 13px", background: "#F8F8F8", border: "1.5px solid #E8E8E8", borderRadius: 10, fontSize: 14, color: "#111", resize: "none", fontFamily: "inherit" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Notas adicionales</label>
          <input value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Instrucciones especiales, timbre, etc."
            style={{ width: "100%", padding: "11px 13px", background: "#F8F8F8", border: "1.5px solid #E8E8E8", borderRadius: 10, fontSize: 14, color: "#111", fontFamily: "inherit" }} />
        </div>

        <button onClick={handleSubmit}
          disabled={!nombre.trim() || !direccion.trim() || loading}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
            background: (!nombre.trim() || !direccion.trim()) ? "#ccc" : "#25D366",
            color: "#fff", fontSize: 15, fontWeight: 800, cursor: (!nombre.trim() || !direccion.trim()) ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontFamily: "inherit",
          }}>
          {loading ? "Procesando..." : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </>
          )}
        </button>
      </div>
    </div>
  )
}

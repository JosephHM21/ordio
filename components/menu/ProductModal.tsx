"use client"
import { useState } from "react"
import Image from "next/image"
import { SABORES } from "@/lib/utils"
import type { Producto, CartItem } from "@/types"

interface Props {
  producto: Producto
  onClose: () => void
  onAgregar: (item: CartItem) => void
}

export default function ProductModal({ producto, onClose, onAgregar }: Props) {
  const [cantidad, setCantidad] = useState(1)
  const [sabor, setSabor] = useState<string | null>(null)
  const [eliminados, setEliminados] = useState<string[]>([])
  const [notas, setNotas] = useState("")

  function toggleIng(ing: string) {
    setEliminados(prev => prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing])
  }

  function handleAgregar() {
    if (producto.tiene_sabores && !sabor) return
    onAgregar({
      id: crypto.randomUUID(),
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      sabor,
      ingredientesEliminados: eliminados,
      notas,
      tiempoPrep: producto.tiempo_prep,
    })
  }

  const puedeAgregar = !producto.tiene_sabores || !!sabor
  const subtotal = (producto.precio * cantidad).toFixed(2)

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}>
      <div style={{
        background: "#fff", width: "100%", maxWidth: 520,
        borderRadius: "20px 20px 0 0", maxHeight: "92vh", overflowY: "auto",
        position: "relative",
      }}>
        {/* Imagen */}
        <div style={{ aspectRatio: "16/7", background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 72, position: "relative", overflow: "hidden" }}>
          {producto.imagen_url
            ? <Image src={producto.imagen_url} alt={producto.nombre} fill style={{ objectFit: "cover" }} />
            : "🍽️"
          }
          <button onClick={onClose} style={{
            position: "absolute", top: 12, right: 12, width: 32, height: 32,
            background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%",
            color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Tiempo */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#F5F5F5", borderRadius: 99, padding: "4px 12px", marginBottom: 10 }}>
            <span style={{ fontSize: 12 }}>⏱️</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>{producto.tiempo_prep} min de preparación</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: "0 0 4px" }}>{producto.nombre}</h2>
          <p style={{ fontSize: 20, fontWeight: 900, color: "#111", margin: "0 0 12px" }}>${producto.precio.toFixed(2)}</p>

          {producto.descripcion && (
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.6, margin: "0 0 18px", paddingBottom: 18, borderBottom: "1.5px solid #F0F0F0" }}>
              {producto.descripcion}
            </p>
          )}

          {/* Sabores */}
          {producto.tiene_sabores && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
                Elige tu sabor <span style={{ color: "#EF4444" }}>*</span>
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                {SABORES.map(s => (
                  <button key={s} onClick={() => setSabor(s)}
                    style={{
                      padding: "9px 6px", border: "1.5px solid", borderRadius: 9,
                      borderColor: sabor === s ? "#111" : "#E5E5E5",
                      background: sabor === s ? "#111" : "#fff",
                      color: sabor === s ? "#fff" : "#666",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Ingredientes */}
          {producto.ingredientes && producto.ingredientes.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px" }}>
                Personaliza ingredientes
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {producto.ingredientes.map(ing => {
                  const eliminado = eliminados.includes(ing)
                  return (
                    <div key={ing} onClick={() => toggleIng(ing)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 11px", borderRadius: 8, cursor: "pointer",
                        border: "1.5px solid", transition: "all 0.15s",
                        borderColor: eliminado ? "#FCA5A5" : "#E8E8E8",
                        background: eliminado ? "#FEF2F2" : "#FAFAFA",
                      }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        background: eliminado ? "#fff" : "#22C55E",
                        border: `1.5px solid ${eliminado ? "#FCA5A5" : "#22C55E"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, color: "#fff",
                      }}>
                        {!eliminado && "✓"}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, color: eliminado ? "#EF4444" : "#333", textDecoration: eliminado ? "line-through" : "none" }}>
                        {ing}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notas */}
          <div style={{ marginBottom: 18 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#111", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px" }}>
              Notas adicionales
            </p>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Extra salsa, bien cocida, sin sal..."
              style={{ width: "100%", padding: "10px 12px", background: "#F8F8F8", border: "1.5px solid #E8E8E8", borderRadius: 9, fontSize: 13, color: "#333", resize: "none", fontFamily: "inherit" }} />
          </div>

          {/* Cantidad + Agregar */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setCantidad(c => Math.max(1, c - 1))}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #E5E5E5", background: "#fff", fontSize: 18, cursor: "pointer" }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 900, minWidth: 24, textAlign: "center" }}>{cantidad}</span>
              <button onClick={() => setCantidad(c => Math.min(10, c + 1))}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "#111", color: "#fff", fontSize: 18, cursor: "pointer" }}>+</button>
            </div>
            <button onClick={handleAgregar} disabled={!puedeAgregar}
              style={{
                flex: 1, padding: "13px 0", background: puedeAgregar ? "#111" : "#ccc",
                color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800,
                cursor: puedeAgregar ? "pointer" : "not-allowed",
              }}>
              {puedeAgregar ? `Agregar · $${subtotal}` : "Elige un sabor primero"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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

const WAIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)
const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)
const NoteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

export default function OrderModal({ carrito, total, tiempo, onClose, onEnviar }: Props) {
  const [nombre, setNombre]     = useState("")
  const [direccion, setDireccion] = useState("")
  const [notas, setNotas]       = useState("")
  const [loading, setLoading]   = useState(false)

  async function handleSubmit() {
    if (!nombre.trim() || !direccion.trim()) return
    setLoading(true)
    await onEnviar(nombre.trim(), direccion.trim(), notas.trim())
    setLoading(false)
  }

  const canSubmit = nombre.trim() && direccion.trim() && !loading
  const total_items = carrito.reduce((s,i)=>s+i.cantidad,0)

  const inp: React.CSSProperties = {
    width:"100%", padding:"11px 11px 11px 38px", background:"#F8F8F8",
    border:"1.5px solid #EBEBEB", borderRadius:10, fontSize:14, color:"#111",
    fontFamily:"inherit", boxSizing:"border-box", outline:"none",
  }
  const inputWrap: React.CSSProperties = { position:"relative" }
  const iconPos: React.CSSProperties = { position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"center", backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#fff", width:"100%", maxWidth:520, borderRadius:"20px 20px 0 0", maxHeight:"90vh", overflowY:"auto" }}>
        {/* Header */}
        <div style={{ padding:"18px 20px 14px", borderBottom:"1.5px solid #F5F5F5", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <h2 style={{ fontSize:17, fontWeight:900, color:"#111", margin:0 }}>Confirmar pedido</h2>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", background:"#F5F5F5", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#666" }}>
            <CloseIcon/>
          </button>
        </div>

        <div style={{ padding:"18px 20px 28px" }}>
          {/* Resumen */}
          <div style={{ background:"#F8F8F8", borderRadius:12, padding:"12px 14px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <p style={{ fontSize:13, color:"#888", margin:"0 0 2px" }}>{total_items} producto{total_items!==1?"s":""}</p>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <ClockIcon/> <span style={{ fontSize:12, color:"#888" }}>Tiempo estimado: <strong style={{ color:"#111" }}>{tiempo}</strong></span>
              </div>
            </div>
            <span style={{ fontSize:20, fontWeight:900, color:"#111" }}>${total.toFixed(2)}</span>
          </div>

          {/* Campos */}
          <div style={{ display:"grid", gap:12, marginBottom:20 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Tu nombre *</label>
              <div style={inputWrap}>
                <div style={iconPos}><UserIcon/></div>
                <input value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej: María González" style={inp}/>
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Dirección de entrega *</label>
              <div style={{ position:"relative" }}>
                <div style={{ position:"absolute", left:12, top:14, pointerEvents:"none" }}><MapPinIcon/></div>
                <textarea value={direccion} onChange={e=>setDireccion(e.target.value)} rows={2}
                  placeholder="Calle, número, colonia, referencias..."
                  style={{ ...inp, padding:"11px 11px 11px 38px", resize:"none" as const }}/>
              </div>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Notas adicionales</label>
              <div style={inputWrap}>
                <div style={iconPos}><NoteIcon/></div>
                <input value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Instrucciones especiales, timbre, etc." style={inp}/>
              </div>
            </div>
          </div>

          {/* Botón */}
          <button onClick={handleSubmit} disabled={!canSubmit}
            style={{ width:"100%", padding:"14px 0", borderRadius:12, border:"none",
              background: canSubmit ? "#25D366" : "#D1D5DB",
              color:"#fff", fontSize:15, fontWeight:800, cursor: canSubmit ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10, fontFamily:"inherit",
              transition:"background 0.2s",
            }}>
            {loading ? "Enviando pedido..." : <><WAIcon/> Enviar pedido por WhatsApp</>}
          </button>
          <p style={{ fontSize:11, color:"#bbb", textAlign:"center", marginTop:10, marginBottom:0 }}>
            Tu pedido será registrado y podrás ver su estatus en tiempo real.
          </p>
        </div>
      </div>
    </div>
  )
}

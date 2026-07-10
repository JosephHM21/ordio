"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
export default function ConfigPage() {
  const [form, setForm] = useState({ nombre:"", whatsapp:"", horario:"", instagram:"", direccion:"", tiempo_entrega:"15", promo_texto:"", promo_subtexto:"" })
  const [rid, setRid] = useState<string|null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user) return
      const {data:u} = await supabase.from("usuarios").select("restaurante_id").eq("id",data.user.id).single()
      if(!u?.restaurante_id) return
      setRid(u.restaurante_id)
      const {data:r} = await supabase.from("restaurantes").select("*").eq("id",u.restaurante_id).single()
      if(r) setForm({ nombre:r.nombre||"", whatsapp:r.whatsapp||"", horario:r.config?.contenido?.horario||"1:00 PM – 11:00 PM", instagram:r.config?.contenido?.instagram||"", direccion:r.config?.contenido?.direccion||"", tiempo_entrega:String(r.config?.contenido?.tiempo_entrega||15), promo_texto:r.config?.contenido?.promo_texto||"¿Antojo de algo especial?", promo_subtexto:r.config?.contenido?.promo_subtexto||"Agrega extras y hazlo único." })
      setLoading(false)
    })
  },[])
  async function guardar(){
    if(!rid) return
    await supabase.from("restaurantes").update({ nombre:form.nombre, whatsapp:form.whatsapp, config:{ contenido:{ horario:form.horario, instagram:form.instagram, direccion:form.direccion, tiempo_entrega:parseInt(form.tiempo_entrega), promo_texto:form.promo_texto, promo_subtexto:form.promo_subtexto } } }).eq("id",rid)
    setSaved(true); setTimeout(()=>setSaved(false),2500)
  }
  const inp = { width:"100%", padding:"10px 12px", background:"#F8F8F8", border:"1.5px solid #E8E8E8", borderRadius:10, fontSize:13, color:"#111", fontFamily:"inherit", boxSizing:"border-box" as const }
  const lbl = { display:"block" as const, fontSize:11, fontWeight:700 as const, color:"#888", textTransform:"uppercase" as const, letterSpacing:"0.5px", marginBottom:5 }
  if(loading) return <p style={{color:"#999",padding:20}}>Cargando...</p>
  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif",maxWidth:600}}>
      <h1 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 6px"}}>⚙️ Configuración</h1>
      <p style={{fontSize:14,color:"#888",margin:"0 0 24px"}}>Personaliza la información de tu restaurante.</p>
      <div style={{background:"#fff",borderRadius:16,border:"1.5px solid #F0F0F0",padding:24,display:"grid",gap:16}}>
        <div><label style={lbl}>Nombre del restaurante</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>WhatsApp (solo números)</label><input value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>Horario</label><input value={form.horario} onChange={e=>setForm(f=>({...f,horario:e.target.value}))} placeholder="1:00 PM – 11:00 PM" style={inp}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={lbl}>Instagram</label><input value={form.instagram} onChange={e=>setForm(f=>({...f,instagram:e.target.value}))} placeholder="@usuario" style={inp}/></div>
          <div><label style={lbl}>Tiempo entrega (min)</label><input type="number" value={form.tiempo_entrega} onChange={e=>setForm(f=>({...f,tiempo_entrega:e.target.value}))} style={inp}/></div>
        </div>
        <div><label style={lbl}>Dirección</label><input value={form.direccion} onChange={e=>setForm(f=>({...f,direccion:e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>Texto tarjeta promo</label><input value={form.promo_texto} onChange={e=>setForm(f=>({...f,promo_texto:e.target.value}))} style={inp}/></div>
        <div><label style={lbl}>Subtexto tarjeta promo</label><input value={form.promo_subtexto} onChange={e=>setForm(f=>({...f,promo_subtexto:e.target.value}))} style={inp}/></div>
        <button onClick={guardar} style={{padding:"12px 0",background:saved?"#22C55E":"#111",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>
          {saved ? "✓ Guardado" : "Guardar cambios"}
        </button>
      </div>
    </div>
  )
}

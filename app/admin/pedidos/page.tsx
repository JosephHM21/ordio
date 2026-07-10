"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
const LABELS: Record<string,{label:string,bg:string,color:string}> = {
  pendiente:{label:"Recibido",bg:"#FEF3C7",color:"#D97706"},
  en_preparacion:{label:"Preparando",bg:"#FFF7ED",color:"#EA580C"},
  en_camino:{label:"Listo",bg:"#F0FDF4",color:"#16A34A"},
  entregado:{label:"Entregado",bg:"#F5F5F5",color:"#888"},
  cancelado:{label:"Cancelado",bg:"#FEF2F2",color:"#EF4444"},
}
const FILTROS=[{key:"todos",label:"Todos"},{key:"pendiente",label:"Pendientes"},{key:"en_preparacion",label:"Preparando"},{key:"en_camino",label:"Listo"},{key:"entregado",label:"Entregados"}]
export default function PedidosPage() {
  const [pedidos,setPedidos]=useState<any[]>([])
  const [filtro,setFiltro]=useState("todos")
  const [rid,setRid]=useState<string|null>(null)
  const supabase=createClient()
  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user) return
      const {data:u}=await supabase.from("usuarios").select("restaurante_id").eq("id",data.user.id).single()
      if(!u?.restaurante_id) return
      setRid(u.restaurante_id)
      loadP(u.restaurante_id)
      supabase.channel("ped").on("postgres_changes",{event:"*",schema:"public",table:"pedidos",filter:`restaurante_id=eq.${u.restaurante_id}`},()=>loadP(u.restaurante_id)).subscribe()
    })
  },[])
  async function loadP(r:string){
    const {data}=await supabase.from("pedidos").select("*").eq("restaurante_id",r).order("created_at",{ascending:false}).limit(50)
    if(data) setPedidos(data)
  }
  async function cambiar(id:string,estado:string){ await supabase.from("pedidos").update({estado}).eq("id",id); if(rid) loadP(rid) }
  const lista=filtro==="todos"?pedidos:pedidos.filter(p=>p.estado===filtro)
  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <h1 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 20px"}}>📋 Pedidos en tiempo real</h1>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {FILTROS.map(f=>(
          <button key={f.key} onClick={()=>setFiltro(f.key)}
            style={{padding:"7px 14px",borderRadius:99,border:"1.5px solid",fontWeight:600,fontSize:12,cursor:"pointer",background:filtro===f.key?"#111":"#fff",color:filtro===f.key?"#fff":"#666",borderColor:filtro===f.key?"#111":"#E5E5E5"}}>
            {f.label} ({f.key==="todos"?pedidos.length:pedidos.filter(p=>p.estado===f.key).length})
          </button>
        ))}
      </div>
      {lista.length===0?(
        <div style={{background:"#fff",borderRadius:16,border:"1.5px solid #F0F0F0",padding:"48px",textAlign:"center",color:"#bbb"}}>
          <p style={{fontSize:32,margin:"0 0 8px"}}>📭</p><p style={{fontSize:14,margin:0}}>Sin pedidos aún</p>
        </div>
      ):(
        <div style={{display:"grid",gap:10}}>
          {lista.map(p=>{
            const est=LABELS[p.estado]||LABELS.pendiente
            const hora=new Date(p.created_at).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})
            const fecha=new Date(p.created_at).toLocaleDateString("es-MX",{day:"numeric",month:"short"})
            return(
              <div key={p.id} style={{background:"#fff",borderRadius:14,border:"1.5px solid #F0F0F0",padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,fontWeight:900,color:"#111"}}>#{p.id.slice(0,8).toUpperCase()}</span>
                      <span style={{padding:"2px 8px",borderRadius:99,fontSize:10,fontWeight:700,background:est.bg,color:est.color}}>{est.label}</span>
                      <span style={{fontSize:11,color:"#aaa"}}>{fecha}, {hora}</span>
                    </div>
                    <p style={{fontSize:14,fontWeight:700,color:"#111",margin:"0 0 2px"}}>{p.cliente_nombre}</p>
                    <p style={{fontSize:12,color:"#888",margin:"0 0 6px"}}>{p.cliente_direccion}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {(p.items||[]).map((it:any,i:number)=>(
                        <span key={i} style={{background:"#F5F5F5",borderRadius:6,padding:"2px 7px",fontSize:11,color:"#555"}}>{it.cantidad}× {it.nombre}</span>
                      ))}
                    </div>
                    {p.notas&&<p style={{fontSize:12,color:"#888",margin:"6px 0 0",fontStyle:"italic"}}>📝 {p.notas}</p>}
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <p style={{fontSize:18,fontWeight:900,color:"#111",margin:"0 0 8px"}}>${Number(p.total||0).toFixed(2)}</p>
                    <select value={p.estado} onChange={e=>cambiar(p.id,e.target.value)}
                      style={{padding:"6px 10px",borderRadius:8,border:"1.5px solid #E5E5E5",fontSize:12,fontWeight:600,cursor:"pointer",background:"#fff"}}>
                      {Object.entries(LABELS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

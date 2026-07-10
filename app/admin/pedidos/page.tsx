"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"

const LABELS: Record<string,{label:string,bg:string,color:string,border:string}> = {
  pendiente:      {label:"Recibido",   bg:"#FEF3C7",color:"#D97706",border:"#FDE68A"},
  en_preparacion: {label:"Preparando", bg:"#FFF7ED",color:"#EA580C",border:"#FDBA74"},
  en_camino:      {label:"Listo",      bg:"#F0FDF4",color:"#16A34A",border:"#86EFAC"},
  entregado:      {label:"Entregado",  bg:"#F5F5F5",color:"#6B7280",border:"#E5E5E5"},
  cancelado:      {label:"Cancelado",  bg:"#FEF2F2",color:"#EF4444",border:"#FECACA"},
}
const FLUJO = ["pendiente","en_preparacion","en_camino","entregado"]
const FILTROS = [
  {key:"todos",     label:"Todos"},
  {key:"pendiente", label:"Pendientes"},
  {key:"en_preparacion",label:"Preparando"},
  {key:"en_camino", label:"Listos"},
  {key:"entregado", label:"Entregados"},
  {key:"cancelado", label:"Cancelados"},
]

const ChevronIcon = ({dir="right"}:{dir?:string}) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    {dir==="right" ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
  </svg>
)
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [filtro,  setFiltro]  = useState("todos")
  const [rid,     setRid]     = useState<string|null>(null)
  const [confirm, setConfirm] = useState<string|null>(null)
  const supabase = createClient()

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user) return
      const {data:u} = await supabase.from("usuarios").select("restaurante_id").eq("id",data.user.id).single()
      if(!u?.restaurante_id) return
      setRid(u.restaurante_id)
      load(u.restaurante_id)
      supabase.channel("ped-admin")
        .on("postgres_changes",{event:"*",schema:"public",table:"pedidos",filter:`restaurante_id=eq.${u.restaurante_id}`},()=>load(u.restaurante_id))
        .subscribe()
    })
  },[])

  async function load(r:string){
    const {data} = await supabase.from("pedidos").select("*").eq("restaurante_id",r).order("created_at",{ascending:false}).limit(50)
    if(data) setPedidos(data)
  }

  async function cambiar(id:string, estado:string){
    await supabase.from("pedidos").update({estado}).eq("id",id)
    if(rid) load(rid)
  }

  async function cancelar(id:string){
    await cambiar(id,"cancelado")
    setConfirm(null)
  }

  function nextEstado(estado:string):string|null {
    const idx = FLUJO.indexOf(estado)
    return idx >= 0 && idx < FLUJO.length-1 ? FLUJO[idx+1] : null
  }
  function prevEstado(estado:string):string|null {
    const idx = FLUJO.indexOf(estado)
    return idx > 0 ? FLUJO[idx-1] : null
  }

  const lista = filtro==="todos" ? pedidos.filter(p=>p.estado!=="cancelado") : pedidos.filter(p=>p.estado===filtro)
  const counts: Record<string,number> = {}
  FILTROS.forEach(f=>{ counts[f.key] = f.key==="todos" ? pedidos.filter(p=>p.estado!=="cancelado").length : pedidos.filter(p=>p.estado===f.key).length })

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 4px"}}>Pedidos en tiempo real</h1>
          <p style={{fontSize:13,color:"#888",margin:0}}>Se actualizan automáticamente</p>
        </div>
        {/* KPI rápida */}
        <div style={{display:"flex",gap:8}}>
          {["pendiente","en_preparacion"].map(k=>(
            <div key={k} style={{background:"#fff",border:"1.5px solid #F0F0F0",borderRadius:12,padding:"8px 16px",textAlign:"center"}}>
              <p style={{fontSize:20,fontWeight:900,color:k==="pendiente"?"#D97706":"#EA580C",margin:"0 0 2px"}}>{counts[k]||0}</p>
              <p style={{fontSize:11,color:"#888",margin:0}}>{LABELS[k].label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:6,marginBottom:20,flexWrap:"wrap"}}>
        {FILTROS.map(f=>(
          <button key={f.key} onClick={()=>setFiltro(f.key)}
            style={{padding:"6px 14px",borderRadius:99,border:"1.5px solid",fontWeight:600,fontSize:12,cursor:"pointer",
              background:filtro===f.key?"#111":"#fff",color:filtro===f.key?"#fff":"#666",
              borderColor:filtro===f.key?"#111":"#E5E5E5"}}>
            {f.label} ({counts[f.key]||0})
          </button>
        ))}
      </div>

      {/* Lista */}
      {lista.length===0 ? (
        <div style={{background:"#fff",borderRadius:16,border:"1.5px solid #F0F0F0",padding:"48px",textAlign:"center",color:"#bbb"}}>
          <p style={{fontSize:28,margin:"0 0 8px"}}>📭</p>
          <p style={{fontSize:14,margin:0}}>Sin pedidos en esta categoría</p>
        </div>
      ) : (
        <div style={{display:"grid",gap:10}}>
          {lista.map(p=>{
            const est   = LABELS[p.estado] || LABELS.pendiente
            const hora  = new Date(p.created_at).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})
            const fecha = new Date(p.created_at).toLocaleDateString("es-MX",{day:"numeric",month:"short"})
            const next  = nextEstado(p.estado)
            const prev  = prevEstado(p.estado)
            const isCancelled = p.estado === "cancelado"

            return (
              <div key={p.id} style={{background:"#fff",borderRadius:14,border:`1.5px solid ${isCancelled?"#FECACA":"#F0F0F0"}`,padding:"16px 18px",opacity:isCancelled?0.7:1}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:900,color:"#111"}}>#{p.id.slice(0,8).toUpperCase()}</span>
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:est.bg,color:est.color,border:`1px solid ${est.border}`}}>
                        <span style={{width:5,height:5,borderRadius:"50%",background:est.color,display:"inline-block"}}/>
                        {est.label}
                      </span>
                      <span style={{fontSize:11,color:"#aaa"}}>{fecha}, {hora}</span>
                    </div>
                    <p style={{fontSize:14,fontWeight:700,color:"#111",margin:"0 0 2px"}}>{p.cliente_nombre}</p>
                    <p style={{fontSize:12,color:"#888",margin:"0 0 8px"}}>{p.cliente_direccion}</p>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {(p.items||[]).map((it:any,i:number)=>(
                        <span key={i} style={{background:"#F5F5F5",borderRadius:6,padding:"2px 8px",fontSize:11,color:"#555"}}>{it.cantidad}× {it.nombre}</span>
                      ))}
                    </div>
                    {p.notas&&<p style={{fontSize:12,color:"#888",margin:"6px 0 0",fontStyle:"italic"}}>Nota: {p.notas}</p>}
                  </div>

                  {/* Controles */}
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:10,flexShrink:0}}>
                    <p style={{fontSize:20,fontWeight:900,color:"#111",margin:0}}>${Number(p.total||0).toFixed(2)}</p>

                    {!isCancelled && (
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {/* Retroceder */}
                        {prev && (
                          <button onClick={()=>cambiar(p.id,prev)}
                            title={`Regresar a ${LABELS[prev]?.label}`}
                            style={{width:32,height:32,borderRadius:8,border:"1.5px solid #E5E5E5",background:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#888"}}>
                            <ChevronIcon dir="left"/>
                          </button>
                        )}
                        {/* Estado actual */}
                        <span style={{padding:"6px 12px",borderRadius:8,background:est.bg,color:est.color,fontSize:12,fontWeight:700,border:`1px solid ${est.border}`,whiteSpace:"nowrap"}}>
                          {est.label}
                        </span>
                        {/* Avanzar */}
                        {next && (
                          <button onClick={()=>cambiar(p.id,next)}
                            title={`Pasar a ${LABELS[next]?.label}`}
                            style={{padding:"6px 14px",borderRadius:8,border:"none",background:"#111",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
                            {LABELS[next]?.label} <ChevronIcon/>
                          </button>
                        )}
                        {/* Cancelar */}
                        <button onClick={()=>setConfirm(p.id)}
                          title="Cancelar pedido"
                          style={{width:32,height:32,borderRadius:8,border:"1.5px solid #FECACA",background:"#FEF2F2",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#EF4444"}}>
                          <XIcon/>
                        </button>
                      </div>
                    )}

                    {isCancelled && (
                      <span style={{fontSize:12,color:"#EF4444",fontWeight:600}}>Pedido cancelado</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmación cancelar */}
      {confirm && (
        <div onClick={()=>setConfirm(null)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:28,maxWidth:380,width:"100%",textAlign:"center"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:"#FEF2F2",border:"2px solid #FECACA",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",color:"#EF4444"}}>
              <XIcon/>
            </div>
            <h2 style={{fontSize:18,fontWeight:900,color:"#111",margin:"0 0 8px"}}>¿Cancelar este pedido?</h2>
            <p style={{fontSize:14,color:"#888",margin:"0 0 24px",lineHeight:1.5}}>
              Esta acción no se puede deshacer. El cliente será notificado de la cancelación.
            </p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirm(null)}
                style={{flex:1,padding:"11px 0",background:"#F5F5F5",border:"none",borderRadius:10,fontSize:14,fontWeight:700,color:"#555",cursor:"pointer"}}>
                No cancelar
              </button>
              <button onClick={()=>cancelar(confirm)}
                style={{flex:1,padding:"11px 0",background:"#EF4444",border:"none",borderRadius:10,fontSize:14,fontWeight:800,color:"#fff",cursor:"pointer"}}>
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

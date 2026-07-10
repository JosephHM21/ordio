"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase"

interface Promo { id:string; titulo:string; descripcion:string|null; imagen_url:string|null; activo:boolean; orden:number }

const PlusIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
const ImgIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>

export default function PromocionesPage() {
  const [promos,    setPromos]    = useState<Promo[]>([])
  const [rid,       setRid]       = useState<string|null>(null)
  const [modal,     setModal]     = useState(false)
  const [editando,  setEditando]  = useState<Promo|null>(null)
  const [guardando, setGuardando] = useState(false)
  const [subiendo,  setSubiendo]  = useState(false)
  const [confirmDel,setConfirmDel]= useState<string|null>(null)
  const [form, setForm] = useState({ titulo:"", descripcion:"", imagen_url:"", activo:true })
  const supabase = createClient()

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user) return
      const {data:u} = await supabase.from("usuarios").select("restaurante_id").eq("id",data.user.id).single()
      if(u?.restaurante_id){ setRid(u.restaurante_id); load(u.restaurante_id) }
    })
  },[])

  async function load(r:string){
    const {data} = await supabase.from("promociones").select("*").eq("restaurante_id",r).order("orden")
    if(data) setPromos(data as Promo[])
  }

  async function subirImg(file:File):Promise<string|null>{
    setSubiendo(true)
    const ext = file.name.split(".").pop()
    const path = `promociones/${Date.now()}.${ext}`
    const {data,error} = await supabase.storage.from("imagenes").upload(path,file,{cacheControl:"3600",upsert:false})
    setSubiendo(false)
    if(error||!data) return null
    const {data:u} = supabase.storage.from("imagenes").getPublicUrl(data.path)
    return u.publicUrl
  }

  async function handleImg(e:React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]; if(!file) return
    if(file.size>5*1024*1024){alert("Máximo 5MB");return}
    const url = await subirImg(file)
    if(url) setForm(f=>({...f,imagen_url:url}))
    else alert("Error al subir imagen. Verifica el bucket 'imagenes' en Supabase.")
  }

  function abrirModal(p?:Promo){
    if(p){ setEditando(p); setForm({titulo:p.titulo,descripcion:p.descripcion||"",imagen_url:p.imagen_url||"",activo:p.activo}) }
    else { setEditando(null); setForm({titulo:"",descripcion:"",imagen_url:"",activo:true}) }
    setModal(true)
  }

  async function guardar(){
    if(!rid||!form.titulo.trim()){return}
    setGuardando(true)
    const payload = { restaurante_id:rid, titulo:form.titulo.trim(), descripcion:form.descripcion.trim()||null, imagen_url:form.imagen_url||null, activo:form.activo, orden:editando?editando.orden:promos.length+1 }
    if(editando){ await supabase.from("promociones").update(payload).eq("id",editando.id) }
    else { await supabase.from("promociones").insert(payload) }
    setGuardando(false); setModal(false); if(rid) load(rid)
  }

  async function toggleActivo(p:Promo){
    await supabase.from("promociones").update({activo:!p.activo}).eq("id",p.id)
    if(rid) load(rid)
  }

  async function eliminar(id:string){
    await supabase.from("promociones").delete().eq("id",id)
    setConfirmDel(null); if(rid) load(rid)
  }

  async function mover(p:Promo, dir:"up"|"down"){
    const idx = promos.findIndex(x=>x.id===p.id)
    const swap = dir==="up" ? promos[idx-1] : promos[idx+1]
    if(!swap) return
    await Promise.all([
      supabase.from("promociones").update({orden:swap.orden}).eq("id",p.id),
      supabase.from("promociones").update({orden:p.orden}).eq("id",swap.id),
    ])
    if(rid) load(rid)
  }

  const activas   = promos.filter(p=>p.activo)
  const inactivas = promos.filter(p=>!p.activo)

  const inp = {width:"100%",padding:"10px 12px",background:"#F8F8F8",border:"1.5px solid #E8E8E8",borderRadius:10,fontSize:13,color:"#111",fontFamily:"inherit",boxSizing:"border-box" as const}
  const lbl = {display:"block" as const,fontSize:11,fontWeight:700 as const,color:"#888",textTransform:"uppercase" as const,letterSpacing:"0.5px",marginBottom:5}

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 4px"}}>Promociones</h1>
          <p style={{fontSize:13,color:"#888",margin:0}}>{activas.length} activa{activas.length!==1?"s":""} · se muestran en el menú del cliente</p>
        </div>
        <button onClick={()=>abrirModal()} style={{display:"flex",alignItems:"center",gap:7,background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          <PlusIcon/> Nueva promoción
        </button>
      </div>

      {promos.length===0 ? (
        <div style={{background:"#fff",borderRadius:16,border:"1.5px solid #F0F0F0",padding:"60px 32px",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:16}}>🏷️</div>
          <h2 style={{fontSize:18,fontWeight:800,color:"#111",margin:"0 0 8px"}}>Sin promociones aún</h2>
          <p style={{fontSize:14,color:"#888",margin:"0 0 24px"}}>Crea tu primera promoción para mostrarla en el menú del cliente.</p>
          <button onClick={()=>abrirModal()} style={{display:"inline-flex",alignItems:"center",gap:7,background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"11px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
            <PlusIcon/> Crear primera promoción
          </button>
        </div>
      ) : (
        <>
          {/* Activas */}
          {activas.length>0&&(
            <div style={{marginBottom:24}}>
              <p style={{fontSize:12,fontWeight:700,color:"#22C55E",textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#22C55E",display:"inline-block"}}/>
                Activas ({activas.length}) — visibles en el menú
              </p>
              <div style={{display:"grid",gap:10}}>
                {activas.map((p,i)=><PromoCard key={p.id} promo={p} idx={i} total={activas.length} onEdit={()=>abrirModal(p)} onToggle={()=>toggleActivo(p)} onDelete={()=>setConfirmDel(p.id)} onMover={mover}/>)}
              </div>
            </div>
          )}
          {/* Inactivas */}
          {inactivas.length>0&&(
            <div>
              <p style={{fontSize:12,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",margin:"0 0 10px",display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:"#ccc",display:"inline-block"}}/>
                Inactivas ({inactivas.length}) — ocultas del menú
              </p>
              <div style={{display:"grid",gap:10,opacity:0.7}}>
                {inactivas.map((p,i)=><PromoCard key={p.id} promo={p} idx={i} total={inactivas.length} onEdit={()=>abrirModal(p)} onToggle={()=>toggleActivo(p)} onDelete={()=>setConfirmDel(p.id)} onMover={mover}/>)}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODAL CREAR/EDITAR ── */}
      {modal&&(
        <div onClick={e=>e.target===e.currentTarget&&setModal(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto",padding:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:900,color:"#111",margin:0}}>{editando?"Editar promoción":"Nueva promoción"}</h2>
              <button onClick={()=>setModal(false)} style={{background:"#F5F5F5",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14}}>✕</button>
            </div>

            <div style={{display:"grid",gap:16}}>
              {/* Imagen */}
              <div>
                <label style={lbl}>Imagen de la promoción</label>
                <div style={{position:"relative",borderRadius:14,overflow:"hidden",background:"#F0F0F0",aspectRatio:"16/7",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:10}}>
                  {form.imagen_url
                    ? <img src={form.imagen_url} alt="preview" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{textAlign:"center",color:"#bbb"}}><ImgIcon/><p style={{fontSize:12,margin:"8px 0 0"}}>Sin imagen</p></div>
                  }
                </div>
                <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#F8F8F8",border:"1.5px dashed #D0D0D0",borderRadius:10,cursor:subiendo?"not-allowed":"pointer",fontSize:13,color:"#666",fontWeight:600}}>
                  {subiendo?"Subiendo imagen...":"📷 Seleccionar imagen (recomendado 1200×400 px)"}
                  <input type="file" accept="image/*" onChange={handleImg} disabled={subiendo} style={{display:"none"}}/>
                </label>
                {form.imagen_url&&<button onClick={()=>setForm(f=>({...f,imagen_url:""}))} style={{marginTop:6,fontSize:11,color:"#EF4444",background:"none",border:"none",cursor:"pointer",padding:0}}>Quitar imagen</button>}
              </div>

              <div><label style={lbl}>Título *</label><input value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Ej: 2x1 en Hamburguesas" style={inp}/></div>
              <div><label style={lbl}>Descripción</label><textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} rows={2} placeholder="Detalles de la promoción..." style={{...inp,resize:"none"}}/></div>

              {/* Toggle activo */}
              <label style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"#F8F8F8",borderRadius:10,cursor:"pointer"}}>
                <div>
                  <p style={{fontSize:13,fontWeight:700,color:"#111",margin:"0 0 2px"}}>Mostrar en el menú</p>
                  <p style={{fontSize:11,color:"#888",margin:0}}>Los clientes verán esta promoción al entrar al menú</p>
                </div>
                <div onClick={()=>setForm(f=>({...f,activo:!f.activo}))}
                  style={{width:44,height:24,borderRadius:12,background:form.activo?"#22C55E":"#E5E5E5",position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0,marginLeft:12}}>
                  <div style={{position:"absolute",top:2,left:form.activo?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 4px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
                </div>
              </label>
            </div>

            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={{flex:1,padding:"12px 0",background:"#F5F5F5",color:"#555",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
              <button onClick={guardar} disabled={!form.titulo.trim()||guardando||subiendo}
                style={{flex:1,padding:"12px 0",background:!form.titulo.trim()?"#E5E5E5":"#111",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",opacity:guardando?0.7:1}}>
                {guardando?"Guardando...":"Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINAR ── */}
      {confirmDel&&(
        <div onClick={()=>setConfirmDel(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,padding:28,maxWidth:360,width:"100%",textAlign:"center"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"#FEF2F2",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:"#EF4444"}}><TrashIcon/></div>
            <h2 style={{fontSize:17,fontWeight:900,color:"#111",margin:"0 0 8px"}}>¿Eliminar esta promoción?</h2>
            <p style={{fontSize:13,color:"#888",margin:"0 0 24px"}}>Esta acción no se puede deshacer.</p>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmDel(null)} style={{flex:1,padding:"11px 0",background:"#F5F5F5",border:"none",borderRadius:10,fontSize:13,fontWeight:700,color:"#555",cursor:"pointer"}}>Cancelar</button>
              <button onClick={()=>eliminar(confirmDel)} style={{flex:1,padding:"11px 0",background:"#EF4444",border:"none",borderRadius:10,fontSize:13,fontWeight:800,color:"#fff",cursor:"pointer"}}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PromoCard({ promo, idx, total, onEdit, onToggle, onDelete, onMover }:{
  promo:any,idx:number,total:number,
  onEdit:()=>void,onToggle:()=>void,onDelete:()=>void,
  onMover:(p:any,d:"up"|"down")=>void
}) {
  return (
    <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #F0F0F0",overflow:"hidden",display:"flex",gap:0}}>
      {/* Imagen */}
      <div style={{width:140,flexShrink:0,background:"#F0F0F0",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
        {promo.imagen_url
          ? <img src={promo.imagen_url} alt={promo.titulo} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <span style={{fontSize:28,opacity:0.3}}>🏷️</span>}
      </div>
      {/* Info */}
      <div style={{flex:1,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:0}}>
          <p style={{fontSize:14,fontWeight:800,color:"#111",margin:"0 0 3px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{promo.titulo}</p>
          {promo.descripcion&&<p style={{fontSize:12,color:"#888",margin:0,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{promo.descripcion}</p>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {/* Orden */}
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            <button onClick={()=>onMover(promo,"up")} disabled={idx===0} style={{padding:"2px 6px",background:"#F5F5F5",border:"none",borderRadius:5,cursor:idx===0?"not-allowed":"pointer",opacity:idx===0?0.3:1,fontSize:10}}>▲</button>
            <button onClick={()=>onMover(promo,"down")} disabled={idx===total-1} style={{padding:"2px 6px",background:"#F5F5F5",border:"none",borderRadius:5,cursor:idx===total-1?"not-allowed":"pointer",opacity:idx===total-1?0.3:1,fontSize:10}}>▼</button>
          </div>
          {/* Toggle */}
          <div onClick={onToggle} style={{width:40,height:22,borderRadius:11,background:promo.activo?"#22C55E":"#E5E5E5",position:"relative",cursor:"pointer",transition:"background 0.2s"}}>
            <div style={{position:"absolute",top:2,left:promo.activo?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"left 0.2s"}}/>
          </div>
          {/* Editar */}
          <button onClick={onEdit} style={{padding:"6px 10px",background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:"#555"}}>
            <EditIcon/> Editar
          </button>
          {/* Eliminar */}
          <button onClick={onDelete} style={{width:32,height:32,borderRadius:8,background:"#FEF2F2",border:"1px solid #FECACA",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#EF4444"}}>
            <TrashIcon/>
          </button>
        </div>
      </div>
    </div>
  )
}

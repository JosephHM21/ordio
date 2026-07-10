"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import type { Producto, Categoria } from "@/types"

export default function ProductosPage() {
  const [tab, setTab]             = useState<"productos"|"categorias">("productos")
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [rid, setRid]             = useState<string|null>(null)
  const [modal, setModal]         = useState(false)
  const [editando, setEditando]   = useState<Producto|null>(null)
  const [subiendoImg, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState("")
  const [form, setForm] = useState({
    nombre:"", descripcion:"", precio:"", tiempoPrep:"15",
    categoriaId:"", ingredientes:"", tieneSabores:false, imagen_url:"",
  })
  // Categorías
  const [catModal, setCatModal]   = useState(false)
  const [catNombre, setCatNombre] = useState("")
  const [catGuardando, setCatGuardando] = useState(false)
  const supabase = createClient()

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user) return
      const {data:u} = await supabase.from("usuarios").select("restaurante_id").eq("id",data.user.id).single()
      if(u?.restaurante_id){ setRid(u.restaurante_id); loadAll(u.restaurante_id) }
    })
  },[])

  async function loadAll(r:string){
    const [p,c] = await Promise.all([
      supabase.from("productos").select("*").eq("restaurante_id",r).order("orden"),
      supabase.from("categorias").select("*").eq("restaurante_id",r).order("orden"),
    ])
    if(p.data) setProductos(p.data as Producto[])
    if(c.data) setCategorias(c.data as Categoria[])
  }

  async function subirImagen(file:File):Promise<string|null>{
    setSubiendo(true)
    const ext = file.name.split(".").pop()
    const path = `productos/${Date.now()}.${ext}`
    const {data,error} = await supabase.storage.from("imagenes").upload(path,file,{cacheControl:"3600",upsert:false})
    setSubiendo(false)
    if(error||!data) return null
    const {data:u} = supabase.storage.from("imagenes").getPublicUrl(data.path)
    return u.publicUrl
  }

  async function handleImg(e:React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]
    if(!file) return
    if(file.size>5*1024*1024){alert("Máximo 5MB");return}
    const url = await subirImagen(file)
    if(url) setForm(f=>({...f,imagen_url:url}))
    else alert("Error al subir. Verifica que el bucket 'imagenes' esté creado en Supabase.")
  }

  function abrirModal(p?:Producto){
    setError("")
    if(p){
      setEditando(p)
      setForm({nombre:p.nombre,descripcion:p.descripcion||"",precio:String(p.precio),
        tiempoPrep:String(p.tiempo_prep),categoriaId:p.categoria_id,
        ingredientes:p.ingredientes?.join(", ")||"",tieneSabores:p.tiene_sabores,imagen_url:p.imagen_url||""})
    } else {
      setEditando(null)
      setForm({nombre:"",descripcion:"",precio:"",tiempoPrep:"15",
        categoriaId:categorias[0]?.id||"",ingredientes:"",tieneSabores:false,imagen_url:""})
    }
    setModal(true)
  }

  async function guardar(){
    if(!rid||!form.nombre.trim()||!form.precio||!form.categoriaId){
      setError("Completa nombre, precio y categoría"); return
    }
    setGuardando(true); setError("")
    const data = {
      restaurante_id: rid,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim()||null,
      precio: parseFloat(form.precio),
      tiempo_prep: parseInt(form.tiempoPrep)||15,
      categoria_id: form.categoriaId,
      ingredientes: form.ingredientes ? form.ingredientes.split(",").map(s=>s.trim()).filter(Boolean) : [],
      tiene_sabores: form.tieneSabores,
      imagen_url: form.imagen_url||null,
      activo: true,
      orden: editando ? editando.orden : productos.length+1,
    }
    let err
    if(editando){ const r = await supabase.from("productos").update(data).eq("id",editando.id); err=r.error }
    else { const r = await supabase.from("productos").insert(data); err=r.error }
    setGuardando(false)
    if(err){ setError(`Error: ${err.message}`); return }
    setModal(false); if(rid) loadAll(rid)
  }

  async function toggleActivo(p:Producto){
    await supabase.from("productos").update({activo:!p.activo}).eq("id",p.id)
    if(rid) loadAll(rid)
  }

  async function guardarCategoria(){
    if(!rid||!catNombre.trim()) return
    setCatGuardando(true)
    await supabase.from("categorias").insert({
      restaurante_id:rid, nombre:catNombre.trim(), orden:categorias.length+1, activo:true
    })
    setCatGuardando(false); setCatNombre(""); setCatModal(false)
    if(rid) loadAll(rid)
  }

  async function eliminarCategoria(id:string){
    const tieneProds = productos.some(p=>p.categoria_id===id)
    if(tieneProds){alert("Esta categoría tiene productos. Mueve o elimina los productos primero.");return}
    if(!confirm("¿Eliminar esta categoría?")) return
    await supabase.from("categorias").delete().eq("id",id)
    if(rid) loadAll(rid)
  }

  const getCat = (id:string) => categorias.find(c=>c.id===id)?.nombre||"—"
  const inp = {width:"100%",padding:"10px 12px",background:"#F8F8F8",border:"1.5px solid #E8E8E8",borderRadius:10,fontSize:13,color:"#111",fontFamily:"inherit",boxSizing:"border-box" as const}
  const lbl = {display:"block" as const,fontSize:11,fontWeight:700 as const,color:"#888",textTransform:"uppercase" as const,letterSpacing:"0.5px",marginBottom:5}

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h1 style={{fontSize:22,fontWeight:900,color:"#111",margin:0}}>🍽️ Menú</h1>
        <div style={{display:"flex",gap:8}}>
          {tab==="categorias"&&(
            <button onClick={()=>setCatModal(true)}
              style={{background:"#fff",color:"#111",border:"1.5px solid #E5E5E5",borderRadius:10,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              + Nueva categoría
            </button>
          )}
          {tab==="productos"&&(
            <button onClick={()=>abrirModal()}
              style={{background:"#111",color:"#fff",border:"none",borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>
              + Nuevo producto
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"#F5F5F5",borderRadius:12,padding:4,width:"fit-content"}}>
        {(["productos","categorias"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{padding:"8px 18px",borderRadius:9,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,
              background:tab===t?"#fff":"transparent",color:tab===t?"#111":"#888",
              boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
            {t==="productos"?"Productos":"Categorías"}
          </button>
        ))}
      </div>

      {/* ── PRODUCTOS ── */}
      {tab==="productos"&&(
        <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #F0F0F0",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#FAFAFA",borderBottom:"1.5px solid #F0F0F0"}}>
                {["Imagen","Nombre","Categoría","Precio","Tiempo","Estado","Acciones"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"11px 14px",fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productos.map(p=>(
                <tr key={p.id} style={{borderBottom:"1px solid #F5F5F5"}}>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{width:46,height:46,borderRadius:8,background:"#1A1A1A",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>
                      {p.imagen_url?<Image src={p.imagen_url} alt={p.nombre} width={46} height={46} style={{objectFit:"cover",width:"100%",height:"100%"}}/>:"🍽️"}
                    </div>
                  </td>
                  <td style={{padding:"10px 14px",fontWeight:700,color:"#111"}}>{p.nombre}</td>
                  <td style={{padding:"10px 14px",color:"#888"}}>{getCat(p.categoria_id)}</td>
                  <td style={{padding:"10px 14px",fontWeight:800,color:"#111"}}>${Number(p.precio).toFixed(2)}</td>
                  <td style={{padding:"10px 14px",color:"#888"}}>{p.tiempo_prep} min</td>
                  <td style={{padding:"10px 14px"}}>
                    <span style={{display:"inline-block",padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700,
                      background:p.activo!==false?"#F0FDF4":"#FEF2F2",color:p.activo!==false?"#16A34A":"#DC2626",
                      border:`1px solid ${p.activo!==false?"#BBF7D0":"#FECACA"}`}}>
                      {p.activo!==false?"Activo":"Inactivo"}
                    </span>
                  </td>
                  <td style={{padding:"10px 14px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>abrirModal(p)} style={{padding:"5px 12px",background:"#F5F5F5",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",color:"#111"}}>✏️ Editar</button>
                      <button onClick={()=>toggleActivo(p)} style={{padding:"5px 12px",border:"1px solid",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",background:"transparent",borderColor:p.activo!==false?"#FECACA":"#BBF7D0",color:p.activo!==false?"#DC2626":"#16A34A"}}>
                        {p.activo!==false?"Desactivar":"Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {productos.length===0&&<div style={{padding:40,textAlign:"center",color:"#bbb",fontSize:14}}>Sin productos aún. Agrega el primero.</div>}
        </div>
      )}

      {/* ── CATEGORÍAS ── */}
      {tab==="categorias"&&(
        <div style={{background:"#fff",borderRadius:14,border:"1.5px solid #F0F0F0",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead>
              <tr style={{background:"#FAFAFA",borderBottom:"1.5px solid #F0F0F0"}}>
                {["#","Nombre","Productos","Acciones"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"11px 14px",fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:"0.5px"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat,i)=>{
                const nProds = productos.filter(p=>p.categoria_id===cat.id).length
                return(
                  <tr key={cat.id} style={{borderBottom:"1px solid #F5F5F5"}}>
                    <td style={{padding:"12px 14px",color:"#888",fontWeight:700}}>{i+1}</td>
                    <td style={{padding:"12px 14px",fontWeight:700,color:"#111"}}>{cat.nombre}</td>
                    <td style={{padding:"12px 14px"}}>
                      <span style={{background:"#F5F5F5",padding:"3px 10px",borderRadius:99,fontSize:12,fontWeight:600,color:"#555"}}>{nProds} productos</span>
                    </td>
                    <td style={{padding:"12px 14px"}}>
                      <button onClick={()=>eliminarCategoria(cat.id)}
                        style={{padding:"5px 12px",background:"transparent",border:"1px solid #FECACA",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer",color:"#DC2626"}}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {categorias.length===0&&<div style={{padding:40,textAlign:"center",color:"#bbb",fontSize:14}}>Sin categorías. Agrega la primera.</div>}
        </div>
      )}

      {/* ── MODAL PRODUCTO ── */}
      {modal&&(
        <div onClick={e=>e.target===e.currentTarget&&setModal(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,maxHeight:"90vh",overflowY:"auto",padding:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:900,color:"#111",margin:0}}>{editando?"Editar producto":"Nuevo producto"}</h2>
              <button onClick={()=>setModal(false)} style={{background:"#F5F5F5",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            <div style={{display:"grid",gap:14}}>
              {/* Imagen */}
              <div>
                <label style={lbl}>Imagen del producto</label>
                <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:80,height:80,borderRadius:10,background:"#1A1A1A",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30}}>
                    {form.imagen_url?<Image src={form.imagen_url} alt="preview" width={80} height={80} style={{objectFit:"cover",width:"100%",height:"100%"}}/>:"🍽️"}
                  </div>
                  <div style={{flex:1}}>
                    <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#F8F8F8",border:"1.5px dashed #D0D0D0",borderRadius:10,cursor:subiendoImg?"not-allowed":"pointer",fontSize:13,color:"#666",fontWeight:600}}>
                      {subiendoImg?"⏳ Subiendo...":"📷 Seleccionar imagen"}
                      <input type="file" accept="image/*" onChange={handleImg} disabled={subiendoImg} style={{display:"none"}}/>
                    </label>
                    <p style={{fontSize:11,color:"#aaa",margin:"5px 0 0"}}>JPG, PNG o WebP · máx. 5MB</p>
                    {form.imagen_url&&<button onClick={()=>setForm(f=>({...f,imagen_url:""}))} style={{marginTop:5,fontSize:11,color:"#EF4444",background:"none",border:"none",cursor:"pointer",padding:0}}>Quitar imagen</button>}
                  </div>
                </div>
              </div>
              <div><label style={lbl}>Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Hamburguesa Clásica" style={inp}/></div>
              <div><label style={lbl}>Descripción</label><textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} rows={3} placeholder="Ingredientes y detalles..." style={{...inp,resize:"none"}}/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div><label style={lbl}>Precio ($) *</label><input type="number" value={form.precio} onChange={e=>setForm(f=>({...f,precio:e.target.value}))} step="0.50" placeholder="0.00" style={inp}/></div>
                <div><label style={lbl}>Tiempo prep. (min)</label><input type="number" value={form.tiempoPrep} onChange={e=>setForm(f=>({...f,tiempoPrep:e.target.value}))} placeholder="15" style={inp}/></div>
              </div>
              <div><label style={lbl}>Categoría *</label>
                <select value={form.categoriaId} onChange={e=>setForm(f=>({...f,categoriaId:e.target.value}))} style={inp}>
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Ingredientes (separados por coma)</label>
                <input value={form.ingredientes} onChange={e=>setForm(f=>({...f,ingredientes:e.target.value}))} placeholder="Pan brioche, Carne de res, Queso..." style={inp}/>
                <p style={{fontSize:11,color:"#aaa",margin:"5px 0 0"}}>El cliente puede elegir qué quitar.</p>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
                <input type="checkbox" checked={form.tieneSabores} onChange={e=>setForm(f=>({...f,tieneSabores:e.target.checked}))} style={{width:16,height:16,accentColor:"#111"}}/>
                <div><span style={{fontSize:13,fontWeight:600,color:"#111"}}>Tiene selección de sabores</span><p style={{fontSize:11,color:"#aaa",margin:0}}>Para alitas y boneless</p></div>
              </label>
              {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#DC2626",fontWeight:600}}>{error}</div>}
            </div>
            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={()=>setModal(false)} style={{flex:1,padding:"12px 0",background:"#F5F5F5",color:"#555",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
              <button onClick={guardar} disabled={guardando||subiendoImg}
                style={{flex:1,padding:"12px 0",background:guardando?"#ccc":"#111",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",opacity:guardando?0.7:1}}>
                {guardando?"Guardando...":"Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CATEGORÍA ── */}
      {catModal&&(
        <div onClick={e=>e.target===e.currentTarget&&setCatModal(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:400,padding:24}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <h2 style={{fontSize:17,fontWeight:900,color:"#111",margin:0}}>Nueva categoría</h2>
              <button onClick={()=>setCatModal(false)} style={{background:"#F5F5F5",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:14}}>✕</button>
            </div>
            <label style={lbl}>Nombre de la categoría *</label>
            <input value={catNombre} onChange={e=>setCatNombre(e.target.value)} placeholder="Ej: Postres, Combos, Sopas..." style={{...inp,marginBottom:16}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setCatModal(false)} style={{flex:1,padding:"11px 0",background:"#F5F5F5",color:"#555",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Cancelar</button>
              <button onClick={guardarCategoria} disabled={!catNombre.trim()||catGuardando}
                style={{flex:1,padding:"11px 0",background:"#111",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",opacity:!catNombre.trim()?0.4:1}}>
                {catGuardando?"Guardando...":"Crear categoría"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

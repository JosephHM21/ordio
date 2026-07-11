"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import type { Producto, Categoria } from "@/types"

const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const PlusIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const ImgIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [rid, setRid]     = useState<string|null>(null)
  const [tab, setTab]     = useState<"productos"|"categorias">("productos")
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Producto|null>(null)
  const [subiendoImg, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")
  const [catModal, setCatModal]   = useState(false)
  const [catNombre, setCatNombre] = useState("")
  const [form, setForm] = useState({
    nombre:"", descripcion:"", precio:"", tiempoPrep:"15",
    categoriaId:"", ingredientes:"", tieneSabores:false, imagen_url:"",
  })
  const supabase = createClient()

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user) return
      const {data:u} = await supabase.from("usuarios").select("restaurante_id").eq("id",data.user.id).single()
      if(u?.restaurante_id){setRid(u.restaurante_id);loadAll(u.restaurante_id)}
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
    const {data,error} = await supabase.storage.from("imagenes").upload(`productos/${Date.now()}.${ext}`,file,{cacheControl:"3600",upsert:false})
    setSubiendo(false)
    if(error||!data) return null
    const {data:u} = supabase.storage.from("imagenes").getPublicUrl(data.path)
    return u.publicUrl
  }

  async function handleImg(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return
    if(file.size>5*1024*1024){alert("Máximo 5MB");return}
    const url = await subirImagen(file)
    if(url) setForm(f=>({...f,imagen_url:url}))
    else alert("Error al subir. Verifica el bucket 'imagenes' en Supabase.")
  }

  function abrirModal(p?:Producto){
    setError("")
    if(p){setEditando(p);setForm({nombre:p.nombre,descripcion:p.descripcion||"",precio:String(p.precio),tiempoPrep:String(p.tiempo_prep),categoriaId:p.categoria_id,ingredientes:p.ingredientes?.join(", ")||"",tieneSabores:p.tiene_sabores,imagen_url:p.imagen_url||""})}
    else{setEditando(null);setForm({nombre:"",descripcion:"",precio:"",tiempoPrep:"15",categoriaId:categorias[0]?.id||"",ingredientes:"",tieneSabores:false,imagen_url:""})}
    setModal(true)
  }

  async function guardar(){
    if(!rid||!form.nombre.trim()||!form.precio||!form.categoriaId){setError("Completa nombre, precio y categoría");return}
    setGuardando(true);setError("")
    const data = {restaurante_id:rid,nombre:form.nombre.trim(),descripcion:form.descripcion.trim()||null,precio:parseFloat(form.precio),tiempo_prep:parseInt(form.tiempoPrep)||15,categoria_id:form.categoriaId,ingredientes:form.ingredientes?form.ingredientes.split(",").map(s=>s.trim()).filter(Boolean):[],tiene_sabores:form.tieneSabores,imagen_url:form.imagen_url||null,activo:true,orden:editando?editando.orden:productos.length+1}
    let err
    if(editando){const r=await supabase.from("productos").update(data).eq("id",editando.id);err=r.error}
    else{const r=await supabase.from("productos").insert(data);err=r.error}
    setGuardando(false)
    if(err){setError(`Error: ${err.message}`);return}
    setModal(false);if(rid)loadAll(rid)
  }

  async function toggleActivo(p:Producto){
    await supabase.from("productos").update({activo:!p.activo}).eq("id",p.id)
    if(rid)loadAll(rid)
  }

  async function guardarCat(){
    if(!rid||!catNombre.trim())return
    await supabase.from("categorias").insert({restaurante_id:rid,nombre:catNombre.trim(),orden:categorias.length+1,activo:true})
    setCatNombre("");setCatModal(false);if(rid)loadAll(rid)
  }

  async function eliminarCat(id:string){
    if(productos.some(p=>p.categoria_id===id)){alert("Esta categoría tiene productos.");return}
    if(!confirm("¿Eliminar esta categoría?"))return
    await supabase.from("categorias").delete().eq("id",id)
    if(rid)loadAll(rid)
  }

  const getCat=(id:string)=>categorias.find(c=>c.id===id)?.nombre||"—"
  const inp={width:"100%",padding:"10px 12px",background:"#F8F8F8",border:"1.5px solid #E8E8E8",borderRadius:10,fontSize:13,color:"#111",fontFamily:"inherit",boxSizing:"border-box" as const}
  const lbl={display:"block" as const,fontSize:11,fontWeight:700 as const,color:"#888",textTransform:"uppercase" as const,letterSpacing:"0.5px",marginBottom:5}

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <h1 className="text-xl font-black text-gray-900 m-0">Menú</h1>
        <div className="flex gap-2">
          {tab==="categorias"&&<button onClick={()=>setCatModal(true)} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-900 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"><PlusIcon/>Categoría</button>}
          {tab==="productos"&&<button onClick={()=>abrirModal()} className="flex items-center gap-1.5 bg-gray-900 text-white border-none rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"><PlusIcon/>Nuevo producto</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {(["productos","categorias"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="px-4 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all"
            style={{background:tab===t?"#fff":"transparent",color:tab===t?"#111":"#888",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
            {t==="productos"?"Productos":"Categorías"}
          </button>
        ))}
      </div>

      {/* ── PRODUCTOS ── */}
      {tab==="productos"&&(
        <>
          {/* Mobile: cards */}
          <div className="md:hidden grid grid-cols-2 gap-3">
            {productos.map(p=>(
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="relative aspect-square bg-gray-900 flex items-center justify-center">
                  {p.imagen_url
                    ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover"/>
                    : <ImgIcon/>}
                  <span className={`absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full ${p.activo!==false?"bg-green-100 text-green-700":"bg-red-100 text-red-500"}`}>
                    {p.activo!==false?"Activo":"Inactivo"}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-gray-900 m-0 mb-0.5 leading-tight line-clamp-2">{p.nombre}</p>
                  <p className="text-xs text-gray-400 m-0 mb-2">{getCat(p.categoria_id)}</p>
                  <p className="text-sm font-black text-gray-900 m-0 mb-2">${Number(p.precio).toFixed(2)}</p>
                  <div className="flex gap-1.5">
                    <button onClick={()=>abrirModal(p)} className="flex-1 flex items-center justify-center gap-1 bg-gray-900 text-white border-none rounded-lg py-1.5 text-xs font-bold cursor-pointer">
                      <EditIcon/> Editar
                    </button>
                    <button onClick={()=>toggleActivo(p)} className="px-2 py-1.5 rounded-lg border text-xs font-bold cursor-pointer bg-transparent"
                      style={{borderColor:p.activo!==false?"#FECACA":"#BBF7D0",color:p.activo!==false?"#DC2626":"#16A34A"}}>
                      {p.activo!==false?"Off":"On"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Imagen","Nombre","Categoría","Precio","Tiempo","Estado","Acciones"].map(h=>(
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {productos.map(p=>(
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-11 h-11 rounded-lg bg-gray-900 overflow-hidden flex items-center justify-center">
                          {p.imagen_url?<img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover"/>:<ImgIcon/>}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{p.nombre}</td>
                      <td className="px-4 py-3 text-gray-400">{getCat(p.categoria_id)}</td>
                      <td className="px-4 py-3 font-black text-gray-900">${Number(p.precio).toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-400">{p.tiempo_prep} min</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold" style={{background:p.activo!==false?"#F0FDF4":"#FEF2F2",color:p.activo!==false?"#16A34A":"#DC2626",border:`1px solid ${p.activo!==false?"#BBF7D0":"#FECACA"}`}}>
                          {p.activo!==false?"Activo":"Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={()=>abrirModal(p)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold cursor-pointer text-gray-700"><EditIcon/>Editar</button>
                          <button onClick={()=>toggleActivo(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer bg-transparent border" style={{borderColor:p.activo!==false?"#FECACA":"#BBF7D0",color:p.activo!==false?"#DC2626":"#16A34A"}}>
                            {p.activo!==false?"Desactivar":"Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {productos.length===0&&<div className="p-10 text-center text-gray-300 text-sm">Sin productos aún.</div>}
          </div>
        </>
      )}

      {/* ── CATEGORÍAS ── */}
      {tab==="categorias"&&(
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                {["#","Nombre","Productos","Eliminar"].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>)}
              </tr></thead>
              <tbody>
                {categorias.map((cat,i)=>{
                  const n=productos.filter(p=>p.categoria_id===cat.id).length
                  return(
                    <tr key={cat.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-400 font-bold">{i+1}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{cat.nombre}</td>
                      <td className="px-4 py-3"><span className="bg-gray-100 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-500">{n} productos</span></td>
                      <td className="px-4 py-3">
                        <button onClick={()=>eliminarCat(cat.id)} className="px-3 py-1.5 bg-transparent border border-red-100 rounded-lg text-xs font-bold text-red-500 cursor-pointer">Eliminar</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL PRODUCTO ── */}
      {modal&&(
        <div onClick={e=>e.target===e.currentTarget&&setModal(false)} className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-5" style={{background:"rgba(0,0,0,0.4)",backdropFilter:"blur(4px)"}}>
          <div className="bg-white w-full md:max-w-xl rounded-t-3xl md:rounded-2xl max-h-[92vh] overflow-y-auto p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-gray-900 m-0">{editando?"Editar producto":"Nuevo producto"}</h2>
              <button onClick={()=>setModal(false)} className="w-8 h-8 rounded-full bg-gray-100 border-none cursor-pointer text-sm">✕</button>
            </div>
            <div className="grid gap-4">
              {/* Imagen */}
              <div>
                <label style={lbl}>Imagen</label>
                <div className="flex gap-3 items-start">
                  <div className="w-20 h-20 rounded-xl bg-gray-900 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {form.imagen_url?<img src={form.imagen_url} alt="preview" className="w-full h-full object-cover"/>:<ImgIcon/>}
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-xl cursor-pointer text-xs text-gray-500 font-semibold">
                      {subiendoImg?"Subiendo...":"Seleccionar imagen"}
                      <input type="file" accept="image/*" onChange={handleImg} disabled={subiendoImg} className="hidden"/>
                    </label>
                    <p className="text-xs text-gray-300 mt-1 m-0">JPG, PNG · máx. 5MB</p>
                    {form.imagen_url&&<button onClick={()=>setForm(f=>({...f,imagen_url:""}))} className="text-xs text-red-400 bg-transparent border-none cursor-pointer p-0 mt-1">Quitar</button>}
                  </div>
                </div>
              </div>
              <div><label style={lbl}>Nombre *</label><input value={form.nombre} onChange={e=>setForm(f=>({...f,nombre:e.target.value}))} placeholder="Ej: Hamburguesa Clásica" style={inp}/></div>
              <div><label style={lbl}>Descripción</label><textarea value={form.descripcion} onChange={e=>setForm(f=>({...f,descripcion:e.target.value}))} rows={2} placeholder="Ingredientes y detalles..." style={{...inp,resize:"none"}}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label style={lbl}>Precio ($) *</label><input type="number" value={form.precio} onChange={e=>setForm(f=>({...f,precio:e.target.value}))} step="0.50" style={inp}/></div>
                <div><label style={lbl}>Tiempo prep. (min)</label><input type="number" value={form.tiempoPrep} onChange={e=>setForm(f=>({...f,tiempoPrep:e.target.value}))} style={inp}/></div>
              </div>
              <div><label style={lbl}>Categoría *</label>
                <select value={form.categoriaId} onChange={e=>setForm(f=>({...f,categoriaId:e.target.value}))} style={inp}>
                  <option value="">Selecciona...</option>
                  {categorias.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Ingredientes (separados por coma)</label><input value={form.ingredientes} onChange={e=>setForm(f=>({...f,ingredientes:e.target.value}))} placeholder="Pan, Carne, Queso..." style={inp}/></div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.tieneSabores} onChange={e=>setForm(f=>({...f,tieneSabores:e.target.checked}))} className="w-4 h-4" style={{accentColor:"#111"}}/>
                <div><span className="text-sm font-semibold text-gray-900">Tiene selección de sabores</span><p className="text-xs text-gray-400 m-0">Para alitas y boneless</p></div>
              </label>
              {error&&<div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-semibold">{error}</div>}
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={()=>setModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 border-none rounded-xl text-sm font-bold cursor-pointer">Cancelar</button>
              <button onClick={guardar} disabled={!form.nombre||!form.precio||guardando||subiendoImg} className="flex-1 py-3 text-white border-none rounded-xl text-sm font-bold cursor-pointer" style={{background:guardando||!form.nombre||!form.precio?"#ccc":"#111"}}>
                {guardando?"Guardando...":"Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CATEGORÍA ── */}
      {catModal&&(
        <div onClick={e=>e.target===e.currentTarget&&setCatModal(false)} className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-5" style={{background:"rgba(0,0,0,0.4)"}}>
          <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-gray-900 m-0">Nueva categoría</h2>
              <button onClick={()=>setCatModal(false)} className="w-8 h-8 rounded-full bg-gray-100 border-none cursor-pointer text-sm">✕</button>
            </div>
            <label style={lbl}>Nombre *</label>
            <input value={catNombre} onChange={e=>setCatNombre(e.target.value)} placeholder="Ej: Postres, Combos..." style={{...inp,marginBottom:16}}/>
            <div className="flex gap-2.5">
              <button onClick={()=>setCatModal(false)} className="flex-1 py-2.5 bg-gray-100 border-none rounded-xl text-sm font-bold text-gray-500 cursor-pointer">Cancelar</button>
              <button onClick={guardarCat} disabled={!catNombre.trim()} className="flex-1 py-2.5 text-white border-none rounded-xl text-sm font-bold cursor-pointer" style={{background:catNombre.trim()?"#111":"#ccc"}}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

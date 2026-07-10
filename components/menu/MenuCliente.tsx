"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import { SABORES, calcularTiempoEstimado, buildWhatsAppMessage } from "@/lib/utils"
import type { Restaurante, Categoria, Producto, CartItem } from "@/types"
import ProductModal from "./ProductModal"
import OrderModal from "./OrderModal"

interface Props { restaurante: Restaurante; categorias: Categoria[]; productos: Producto[] }

const ICONS: Record<string,string> = {
  hamburguesas:"🍔","hot dogs":"🌭",hot_dogs:"🌭",
  alitas:"🍗",boneless:"🍗",papas:"🍟",bebidas:"🥤",
  postres:"🍰",extras:"➕",promociones:"🎁",
}
const icon = (n:string) => { const k = n.toLowerCase().replace(/\s+/g,"_"); for(const[a,b] of Object.entries(ICONS)) if(k.includes(a.replace(/\s+/g,"_"))) return b; return "🍽️" }

const WA = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>

const TABS = [
  { id:"menu",  label:"Menú",      icon:"🏠" },
  { id:"promos",label:"Promos",    icon:"🏷️" },
  { id:"info",  label:"Info",      icon:"ℹ️" },
  { id:"pedido",label:"Mi pedido", icon:"👤" },
]


// ── HORARIO HELPER ────────────────────────────────────────────────
function toMinutes(t: string): number {
  const m = t.trim().match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return -1
  let h = parseInt(m[1])
  const min = parseInt(m[2])
  const p = m[3].toUpperCase()
  if (p === "PM" && h !== 12) h += 12
  if (p === "AM" && h === 12) h = 0
  return h * 60 + min
}
function checkOpen(horario: string): boolean {
  try {
    const sep = horario.includes("–") ? "–" : horario.includes("-") ? "-" : null
    if (!sep) return true
    const [openStr, closeStr] = horario.split(sep).map(s => s.trim())
    const openMin  = toMinutes(openStr)
    const closeMin = toMinutes(closeStr)
    if (openMin < 0 || closeMin < 0) return true
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    if (closeMin < openMin) return cur >= openMin || cur < closeMin
    return cur >= openMin && cur < closeMin
  } catch { return true }
}

export default function MenuCliente({ restaurante, categorias, productos }: Props) {
  const [carrito, setCarrito]   = useState<CartItem[]>([])
  const [modalProd, setModalProd] = useState<Producto | null>(null)
  const [orderOpen, setOrderOpen] = useState(false)
  const [cartOpen, setCartOpen]   = useState(false)
  const [catActiva, setCatActiva] = useState(categorias[0]?.id || "")
  const [pendientes, setPendientes] = useState(0)
  const [toast, setToast] = useState("")
  const [tab, setTab] = useState("menu")
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const ch = supabase.channel("live")
      .on("postgres_changes",{event:"*",schema:"public",table:"pedidos",filter:`restaurante_id=eq.${restaurante.id}`}, fetchP)
      .subscribe()
    fetchP()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchP() {
    const { count } = await supabase.from("pedidos").select("id",{count:"exact"})
      .eq("restaurante_id",restaurante.id).in("estado",["pendiente","en_preparacion"])
    setPendientes(count||0)
  }

  const total    = carrito.reduce((s,i)=>s+i.precio*i.cantidad,0)
  const cantidad = carrito.reduce((s,i)=>s+i.cantidad,0)
  const tiempo   = calcularTiempoEstimado(carrito,pendientes,restaurante.config?.contenido?.tiempo_entrega)
  const porCat   = (id:string) => productos.filter(p=>p.categoria_id===id && p.activo!==false)

  function msg(m:string){ setToast(m); setTimeout(()=>setToast(""),2500) }
  function add(item:CartItem){ setCarrito(p=>[...p,item]); setModalProd(null); msg("✓ Agregado") }
  function chQ(id:string,d:number){ setCarrito(p=>p.map(i=>i.id===id?{...i,cantidad:i.cantidad+d}:i).filter(i=>i.cantidad>0)) }
  function goTo(id:string){ setCatActiva(id); document.getElementById(`cat-${id}`)?.scrollIntoView({behavior:"smooth",block:"start"}) }

  async function enviar(nombre:string,direccion:string,notas:string){
    const {data,error} = await supabase.from("pedidos").insert({
      restaurante_id:restaurante.id,cliente_nombre:nombre,cliente_direccion:direccion,
      items:carrito,total,tiempo_estimado:tiempo,notas:notas||null,tipo:"domicilio",
    }).select("id").single()
    if(error||!data){msg("Error al registrar");return}
    const text = buildWhatsAppMessage(restaurante,carrito,{nombre,direccion,notas},total,tiempo,data.id)
    window.open(`https://wa.me/52${restaurante.whatsapp}?text=${encodeURIComponent(text)}`,"_blank")
    setCarrito([])
    setOrderOpen(false)
    setCartOpen(false)
    router.push(`/${restaurante.slug}/pedido/${data.id}`)
  }

  const horario = restaurante.config?.contenido?.horario || "1:00 PM – 11:00 PM"
  const abierto  = checkOpen(horario)
  const dir     = restaurante.config?.contenido?.direccion || "José Cardel, Veracruz"
  const insta   = restaurante.config?.contenido?.instagram

  return (
    <div className="min-h-screen bg-[#F5F5F5]" style={{fontFamily:"Inter, system-ui, sans-serif"}}>

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <header className="bg-white sticky top-0 z-30 shadow-sm">
        {/* MÓVIL */}
        <div className="flex md:hidden items-center justify-between px-4 py-3">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-lg">☰</button>
          <div className="flex-1 flex justify-center">
            {restaurante.logo_url
              ? <img src={restaurante.logo_url} alt={restaurante.nombre} style={{height:46,width:"auto",maxWidth:160,objectFit:"contain",display:"block"}}/>
              : <span className="text-lg font-black text-[#111]">{restaurante.nombre}</span>}
          </div>
          <button onClick={()=>setCartOpen(true)} className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 text-lg">
            🛒
            {cantidad>0 && <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cantidad}</span>}
          </button>
        </div>

        {/* DESKTOP */}
        <div className="hidden md:flex items-center justify-between px-6 py-4 gap-4" style={{maxWidth:1280,margin:"0 auto"}}>
          <div className="flex items-center gap-3 min-w-[160px]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div>
              <p className="text-[11px] text-gray-400 font-medium m-0">Horario</p>
              <p className="text-[13px] font-bold text-[#111] m-0">{horario}</p>
              <p className={`text-[11px] font-semibold m-0 ${abierto ? "text-green-500" : "text-red-500"}`}>{abierto ? "Abierto ahora" : "Cerrado"}</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center">
            {restaurante.logo_url
              ? <img src={restaurante.logo_url} alt={restaurante.nombre} style={{height:64,width:"auto",maxWidth:220,objectFit:"contain",display:"block"}}/>
              : <h1 className="text-2xl font-black text-[#111] m-0">{restaurante.nombre}</h1>}
          </div>
          <div className="flex items-center gap-4 min-w-[200px] justify-end">
            <div className="text-right">
              <p className="text-[11px] text-gray-400 m-0">Tiempo estimado</p>
              <p className="text-[18px] font-black text-[#111] m-0">{tiempo}</p>
              <p className="text-[11px] text-gray-400 m-0">En preparación</p>
            </div>
            <button onClick={()=>cantidad>0?setOrderOpen(true):msg("Agrega productos primero")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer">
              <span className="text-[#25D366]"><WA/></span>
              <div className="text-left"><p className="text-[12px] font-bold text-[#111] m-0">Enviar pedido</p><p className="text-[11px] text-gray-400 m-0">por WhatsApp</p></div>
            </button>
          </div>
        </div>
      </header>

      {/* BARRA INFO MÓVIL */}
      <div className="md:hidden mx-3 mt-3 bg-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-base">🕐</span>
          <div><p className="text-[11px] text-gray-400 m-0">Horario</p><p className="text-[13px] font-bold text-[#111] m-0">{horario}</p><p className={`text-[11px] font-semibold m-0 ${abierto ? "text-green-500" : "text-red-500"}`}>{abierto ? "Abierto ahora" : "Cerrado"}</p></div>
        </div>
        <div className="w-px h-10 bg-gray-100"/>
        <div className="flex items-center gap-2">
          <span className="text-base">⏱️</span>
          <div><p className="text-[11px] text-gray-400 m-0">Tiempo estimado</p><p className="text-[15px] font-black text-[#111] m-0">{tiempo}</p><p className="text-[11px] text-gray-400 m-0">En preparación</p></div>
        </div>
      </div>

      {/* CATEGORÍAS MÓVIL — círculos */}
      <div className="md:hidden mt-4 overflow-x-auto scrollbar-hide" style={{padding:"0 12px"}}>
        <div className="flex gap-5 pb-2">
          {categorias.map(cat=>(
            <button key={cat.id} onClick={()=>goTo(cat.id)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-all ${catActiva===cat.id?"bg-[#111] border-[#111]":"bg-white border-gray-200"}`}>
                {catActiva===cat.id ? <span className="grayscale brightness-200">{icon(cat.nombre)}</span> : icon(cat.nombre)}
              </div>
              <span className={`text-[11px] font-semibold text-center leading-tight ${catActiva===cat.id?"text-[#111]":"text-gray-500"}`}>{cat.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          BODY
      ══════════════════════════════════════ */}
      <div className="md:grid md:items-start px-3 md:px-5 py-4 pb-36 md:pb-10"
        style={{maxWidth:1280,margin:"0 auto",gridTemplateColumns:"196px 1fr 288px",gap:16}}>

        {/* SIDEBAR CATEGORÍAS — solo desktop */}
        <aside className="hidden md:block sticky top-24">
          <nav className="rounded-2xl overflow-hidden" style={{background:"#111"}}>
            {categorias.map(cat=>{
              const a=catActiva===cat.id
              return(
                <button key={cat.id} onClick={()=>goTo(cat.id)}
                  style={{width:a?"calc(100% - 12px)":"100%",display:"flex",alignItems:"center",gap:10,padding:"12px 16px",border:"none",cursor:"pointer",background:a?"#fff":"transparent",margin:a?"4px 6px":0,borderRadius:a?10:0}}>
                  <span style={{fontSize:17}}>{icon(cat.nombre)}</span>
                  <span style={{fontSize:13,fontWeight:600,color:a?"#111":"#aaa"}}>{cat.nombre}</span>
                </button>
              )
            })}
            <div style={{margin:12,background:"#222",borderRadius:12,padding:"14px 12px"}}>
              <p style={{fontSize:13,fontWeight:800,color:"#fff",margin:"0 0 3px"}}>{restaurante.config?.contenido?.promo_texto||"¿Antojo de algo especial?"}</p>
              <p style={{fontSize:11,color:"#888",margin:0,lineHeight:1.4}}>{restaurante.config?.contenido?.promo_subtexto||"Agrega extras y hazlo único."}</p>
            </div>
          </nav>
        </aside>

        {/* PRODUCTOS */}
        <main>
          {categorias.map((cat,catIdx)=>{
            const lista=porCat(cat.id)
            if(!lista.length) return null
            return(
              <div key={cat.id} id={`cat-${cat.id}`} style={{marginBottom:32,scrollMarginTop:80}}>
                <h2 className="text-lg font-black text-[#111] mb-1" style={{letterSpacing:"-0.3px"}}>{cat.nombre.toUpperCase()}</h2>
                {cat.descripcion && <p className="text-xs text-gray-400 mb-3">{cat.descripcion}</p>}

                {/* DESKTOP: grid */}
                <div className="hidden md:grid gap-3" style={{gridTemplateColumns:"repeat(3,1fr)"}}>
                  {lista.map(prod=>{
                    const enCar=carrito.filter(i=>i.productoId===prod.id).reduce((s,i)=>s+i.cantidad,0)
                    return(
                      <div key={prod.id} onClick={()=>setModalProd(prod)} className="cursor-pointer transition-transform hover:-translate-y-0.5"
                        style={{background:"#fff",borderRadius:12,overflow:"hidden",border:enCar>0?"2px solid #111":"1.5px solid #E8E8E8",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
                        <div style={{aspectRatio:"4/3",background:"#1A1A1A",position:"relative",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,overflow:"hidden"}}>
                          {prod.imagen_url?<Image src={prod.imagen_url} alt={prod.nombre} fill style={{objectFit:"cover"}}/>:<span style={{opacity:0.5}}>{icon(cat.nombre)}</span>}
                          {enCar>0&&<div style={{position:"absolute",top:8,right:8,background:"#111",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{enCar}</div>}
                        </div>
                        <div style={{padding:"10px 10px 12px"}}>
                          <h3 style={{fontSize:13,fontWeight:700,color:"#111",margin:"0 0 3px",lineHeight:1.3}}>{prod.nombre}</h3>
                          {prod.descripcion&&<p style={{fontSize:11,color:"#999",margin:"0 0 8px",lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{prod.descripcion}</p>}
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                            <span style={{fontSize:15,fontWeight:900,color:"#111"}}>${prod.precio.toFixed(2)}</span>
                            <button onClick={e=>{e.stopPropagation();setModalProd(prod)}} style={{padding:"6px 10px",background:"#111",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Agregar</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* MÓVIL: lista horizontal */}
                <div className="md:hidden space-y-3">
                  {lista.map((prod,i)=>{
                    const enCar=carrito.filter(x=>x.productoId===prod.id).reduce((s,x)=>s+x.cantidad,0)
                    const isPopular=i===0&&catIdx===0
                    return(
                      <div key={prod.id} onClick={()=>setModalProd(prod)}
                        className="flex bg-white rounded-2xl overflow-hidden cursor-pointer"
                        style={{boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:enCar>0?"2px solid #111":"none"}}>
                        {/* Imagen */}
                        <div className="relative flex-shrink-0 w-32 bg-[#1A1A1A] flex items-center justify-center text-3xl overflow-hidden">
                          {prod.imagen_url?<Image src={prod.imagen_url} alt={prod.nombre} fill style={{objectFit:"cover"}}/>:<span style={{opacity:0.5}}>{icon(cat.nombre)}</span>}
                          {isPopular&&<div className="absolute top-2 left-0 bg-[#EF4444] text-white text-[9px] font-black px-2 py-0.5 rounded-r-full">🔥 Más popular</div>}
                          {enCar>0&&<div className="absolute top-1.5 right-1.5 bg-[#111] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{enCar}</div>}
                        </div>
                        {/* Info */}
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <h3 className="text-[14px] font-bold text-[#111] leading-tight mb-1">{prod.nombre}</h3>
                            {prod.descripcion&&<p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 mb-2">{prod.descripcion}</p>}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[16px] font-black text-[#111]">${prod.precio.toFixed(2)}</span>
                            <button onClick={e=>{e.stopPropagation();setModalProd(prod)}}
                              className="flex-shrink-0 px-3 py-1.5 bg-[#111] text-white text-[12px] font-bold rounded-lg border-none cursor-pointer">
                              + Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Tarjeta promo (después de primera categoría en móvil) */}
                {catIdx===0&&(
                  <div className="md:hidden mt-4 bg-[#FFF8F0] rounded-2xl p-4 flex items-center justify-between overflow-hidden" style={{border:"1px solid rgba(255,140,0,0.15)"}}>
                    <div>
                      <p className="text-[14px] font-black text-[#111] m-0 mb-1">{restaurante.config?.contenido?.promo_texto||"¿Antojo de algo especial?"}</p>
                      <p className="text-[12px] text-gray-500 m-0 leading-relaxed">{restaurante.config?.contenido?.promo_subtexto||"Agrega extras a tu pedido y hazlo único."}</p>
                    </div>
                    <span className="text-4xl ml-3 flex-shrink-0">🍔</span>
                  </div>
                )}
              </div>
            )
          })}
        </main>

        {/* CARRITO DESKTOP */}
        <aside className="hidden md:block sticky top-24">
          <CartBox carrito={carrito} total={total} cantidad={cantidad} tiempo={tiempo} onQ={chQ} onPedido={()=>setOrderOpen(true)}/>
        </aside>
      </div>

      {/* FOOTER DESKTOP */}
      <footer className="hidden md:block bg-white border-t border-gray-100 py-5 px-5">
        <div style={{maxWidth:1280,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <div className="flex items-center gap-2"><span>📍</span><div><p className="text-[13px] font-bold text-[#111] m-0">{restaurante.nombre}</p><p className="text-[12px] text-gray-400 m-0">{dir}</p></div></div>
          <a href={`https://wa.me/52${restaurante.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 no-underline"><span className="text-[#25D366]"><WA/></span><span className="text-[13px] font-bold text-[#111]">{restaurante.whatsapp}</span></a>
          {insta&&<p className="text-[13px] text-gray-400 m-0">📸 {insta}</p>}
          <p className="text-[11px] text-gray-300 m-0">Impulsado por <span className="text-[#FF8C00] font-bold">Ordio</span></p>
        </div>
      </footer>

      {/* BARRA INFERIOR MÓVIL — total + WA */}
      {cantidad>0&&(
        <div className="md:hidden fixed left-0 right-0 z-40" style={{bottom:56}}>
          <div className="flex mx-3 rounded-2xl overflow-hidden shadow-xl">
            <button onClick={()=>setCartOpen(true)} className="flex items-center gap-3 px-4 py-3.5 flex-1 border-none cursor-pointer" style={{background:"#111",color:"#fff"}}>
              <div className="relative"><span className="text-xl">🛒</span><span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{cantidad}</span></div>
              <div className="text-left"><p className="text-[10px] text-gray-400 m-0">Ver pedido</p><p className="text-[15px] font-black m-0">${total.toFixed(2)}</p></div>
            </button>
            <button onClick={()=>setOrderOpen(true)} className="flex items-center justify-center gap-2 px-5 border-none cursor-pointer font-black text-white text-[13px]" style={{background:"#25D366"}}>
              <WA/> Enviar<br/>por WhatsApp
            </button>
          </div>
        </div>
      )}

      {/* TABS MÓVIL */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-100 z-50 flex items-stretch">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className="flex-1 flex flex-col items-center justify-center gap-0.5 border-none cursor-pointer bg-transparent">
            <span className={`text-lg leading-none ${tab===t.id?"opacity-100":"opacity-40"}`}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===t.id?700:500,color:tab===t.id?"#EF4444":"#888"}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* CARRITO MÓVIL — bottom sheet */}
      {cartOpen&&(
        <div className="md:hidden fixed inset-0 z-50 flex items-end" style={{background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}}
          onClick={e=>e.target===e.currentTarget&&setCartOpen(false)}>
          <div className="w-full bg-white rounded-t-3xl" style={{maxHeight:"85vh",display:"flex",flexDirection:"column"}}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <span className="text-[16px] font-black">Tu pedido ({cantidad})</span>
              <button onClick={()=>setCartOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 border-none cursor-pointer text-[14px]">✕</button>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              <CartBox carrito={carrito} total={total} cantidad={cantidad} tiempo={tiempo} onQ={chQ} onPedido={()=>{setCartOpen(false);setOrderOpen(true)}} compact/>
            </div>
          </div>
        </div>
      )}

      {modalProd&&<ProductModal producto={modalProd} onClose={()=>setModalProd(null)} onAgregar={add}/>}
      {orderOpen&&<OrderModal carrito={carrito} total={total} tiempo={tiempo} onClose={()=>setOrderOpen(false)} onEnviar={enviar}/>}

      {toast&&(
        <div className="fixed z-[999] left-1/2 -translate-x-1/2 bg-[#111] text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-xl whitespace-nowrap" style={{bottom:130}}>
          {toast}
        </div>
      )}
    </div>
  )
}

function CartBox({carrito,total,cantidad,tiempo,onQ,onPedido,compact}:{
  carrito:CartItem[],total:number,cantidad:number,tiempo:string,compact?:boolean,
  onQ:(id:string,d:number)=>void,onPedido:()=>void
}){
  return(
    <div style={{background:compact?"transparent":"#fff",borderRadius:compact?0:16,border:compact?"none":"1.5px solid #F0F0F0",overflow:"hidden"}}>
      {!compact&&(
        <div style={{padding:"14px 16px",borderBottom:"1.5px solid #F0F0F0",display:"flex",alignItems:"center",justifyContent:"space-between",background:"#FAFAFA"}}>
          <span style={{fontSize:14,fontWeight:800,color:"#111"}}>TU PEDIDO</span>
          {cantidad>0&&<span style={{background:"#111",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800}}>{cantidad}</span>}
        </div>
      )}
      <div style={{maxHeight:compact?280:260,overflowY:"auto",padding:carrito.length?"8px 0":0}}>
        {carrito.length===0?(
          <div style={{padding:"32px 16px",textAlign:"center",color:"#ccc"}}>
            <p style={{fontSize:28,margin:"0 0 6px"}}>🛒</p>
            <p style={{fontSize:13,margin:0}}>Tu carrito está vacío</p>
          </div>
        ):carrito.map(item=>{
          const mods=[item.sabor&&`🌶 ${item.sabor}`,...(item.ingredientesEliminados||[]).map(x=>`Sin ${x}`),item.notas].filter(Boolean)
          return(
            <div key={item.id} style={{display:"flex",gap:10,padding:"10px 14px",borderBottom:"1px solid #F5F5F5"}}>
              <div style={{width:44,height:44,borderRadius:8,background:"#1A1A1A",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🍽️</div>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:700,color:"#111",margin:"0 0 2px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.nombre}</p>
                {mods.map((m,i)=><p key={i} style={{fontSize:11,color:"#999",margin:0}}>{m}</p>)}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontSize:14,fontWeight:900,color:"#111"}}>${(item.precio*item.cantidad).toFixed(2)}</span>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <button onClick={()=>onQ(item.id,-1)} style={{width:24,height:24,borderRadius:"50%",border:"1.5px solid #E5E5E5",background:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>−</button>
                    <span style={{fontSize:13,fontWeight:700,minWidth:14,textAlign:"center"}}>{item.cantidad}</span>
                    <button onClick={()=>onQ(item.id,1)} style={{width:24,height:24,borderRadius:"50%",border:"none",background:"#111",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {carrito.length>0&&(
        <div style={{padding:"14px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13,color:"#888"}}>Subtotal</span><span style={{fontSize:13,fontWeight:600,color:"#111"}}>${total.toFixed(2)}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:13,color:"#888"}}>Envío</span><span style={{fontSize:13,fontWeight:600,color:"#22C55E"}}>Gratis</span></div>
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1.5px solid #F0F0F0",marginBottom:10}}>
            <span style={{fontSize:16,fontWeight:900,color:"#111"}}>TOTAL</span>
            <span style={{fontSize:22,fontWeight:900,color:"#111"}}>${total.toFixed(2)}</span>
          </div>
          <div style={{background:"#fff8f0",borderRadius:10,padding:"8px 12px",display:"flex",justifyContent:"space-between",marginBottom:12}}>
            <span style={{fontSize:12,color:"#888"}}>Tiempo estimado</span>
            <span style={{fontSize:13,fontWeight:800,color:"#FF8C00"}}>{tiempo}</span>
          </div>
          <button onClick={onPedido} style={{width:"100%",padding:"13px 0",borderRadius:12,border:"none",background:"#25D366",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            ENVIAR PEDIDO POR WHATSAPP
          </button>
        </div>
      )}
    </div>
  )
}

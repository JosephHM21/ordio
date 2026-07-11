"use client"
import React, { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Chart, registerables } from "chart.js"
Chart.register(...registerables)

const ESTADO_BADGE: Record<string,{label:string,bg:string,color:string}> = {
  pendiente:{label:"Recibido",bg:"#FEF3C7",color:"#D97706"},
  en_preparacion:{label:"Preparando",bg:"#FFF7ED",color:"#EA580C"},
  en_camino:{label:"Listo",bg:"#F0FDF4",color:"#16A34A"},
  entregado:{label:"Entregado",bg:"#F5F5F5",color:"#888"},
  cancelado:{label:"Cancelado",bg:"#FEF2F2",color:"#EF4444"},
}
const ACCESOS = [
  {label:"Agregar producto",href:"/admin/productos"},
  {label:"Nueva promoción",href:"/admin/promociones"},
  {label:"Ver pedidos",href:"/admin/pedidos"},
  {label:"Ver métricas",href:"/admin/estadisticas"},
  {label:"Configuración",href:"/admin/config"},
  {label:"Editar menú",href:"/admin/productos"},
]

// SVG Icons
const BagIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
const DollarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
const UsersIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const ClockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>

export default function DashboardPage() {
  const [restaurante, setRestaurante] = useState<any>(null)
  const [pedidosHoy, setPedidosHoy] = useState<any[]>([])
  const [pedidosAyer, setPedidosAyer] = useState<any[]>([])
  const [pedidosSemana, setPedidosSemana] = useState<any[]>([])
  const [pedidosRecientes, setPedidosRecientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [slug, setSlug] = useState("baggos")
  const chartVRef = useRef<HTMLCanvasElement>(null)
  const chartDRef = useRef<HTMLCanvasElement>(null)
  const chartVInst = useRef<Chart|null>(null)
  const chartDInst = useRef<Chart|null>(null)
  const supabase = createClient()
  const hoy = new Date()

  useEffect(()=>{
    supabase.auth.getUser().then(async({data})=>{
      if(!data.user) return
      const {data:u} = await supabase.from("usuarios").select("restaurante_id").eq("id",data.user.id).single()
      if(!u?.restaurante_id) return
      const {data:r} = await supabase.from("restaurantes").select("nombre,slug,logo_url").eq("id",u.restaurante_id).single()
      if(r){setRestaurante(r);setSlug(r.slug)}
      await fetchData(u.restaurante_id)
      setLoading(false)
    })
  },[])

  async function fetchData(rid:string){
    const ahora = new Date()
    const inicioHoy = new Date(ahora); inicioHoy.setHours(0,0,0,0)
    const inicioAyer = new Date(inicioHoy); inicioAyer.setDate(inicioAyer.getDate()-1)
    const finAyer = new Date(inicioHoy)
    const inicioSemana = new Date(inicioHoy); inicioSemana.setDate(inicioSemana.getDate()-6)
    const [r1,r2,r3,r4] = await Promise.all([
      supabase.from("pedidos").select("*").eq("restaurante_id",rid).neq("estado","cancelado").gte("created_at",inicioHoy.toISOString()),
      supabase.from("pedidos").select("total").eq("restaurante_id",rid).neq("estado","cancelado").gte("created_at",inicioAyer.toISOString()).lt("created_at",finAyer.toISOString()),
      supabase.from("pedidos").select("*").eq("restaurante_id",rid).neq("estado","cancelado").gte("created_at",inicioSemana.toISOString()).order("created_at"),
      supabase.from("pedidos").select("*").eq("restaurante_id",rid).order("created_at",{ascending:false}).limit(5),
    ])
    if(r1.data) setPedidosHoy(r1.data)
    if(r2.data) setPedidosAyer(r2.data)
    if(r3.data) setPedidosSemana(r3.data)
    if(r4.data) setPedidosRecientes(r4.data)
  }

  const totalHoy = pedidosHoy.reduce((s,p)=>s+Number(p.total||0),0)
  const totalAyer = pedidosAyer.reduce((s,p)=>s+Number(p.total||0),0)
  const pctP = pedidosAyer.length>0?Math.round(((pedidosHoy.length-pedidosAyer.length)/pedidosAyer.length)*100):0
  const pctV = totalAyer>0?Math.round(((totalHoy-totalAyer)/totalAyer)*100):0
  const tiempos = pedidosHoy.flatMap(p=>(p.items||[]).map((i:any)=>i.tiempoPrep||0)).filter(Boolean)
  const tiempoAvg = tiempos.length>0?Math.round(tiempos.reduce((s:number,t:number)=>s+t,0)/tiempos.length):0
  const clientes = new Set(pedidosHoy.map(p=>p.cliente_nombre)).size
  const prodMap: Record<string,number> = {}
  pedidosSemana.forEach(p=>{(p.items||[]).forEach((i:any)=>{prodMap[i.nombre]=(prodMap[i.nombre]||0)+i.cantidad})})
  const topProds = Object.entries(prodMap).sort((a,b)=>b[1]-a[1]).slice(0,4)
  const maxProd = topProds[0]?.[1]||1

  useEffect(()=>{
    if(!chartVRef.current) return
    const dias:Record<string,number> = {}
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);d.setHours(0,0,0,0);const k=d.toLocaleDateString("es-MX",{day:"numeric",month:"short"});dias[k]=0}
    pedidosSemana.forEach(p=>{const f=new Date(p.created_at);const k=f.toLocaleDateString("es-MX",{day:"numeric",month:"short"});if(k in dias)dias[k]+=Number(p.total||0)})
    if(chartVInst.current) chartVInst.current.destroy()
    chartVInst.current = new Chart(chartVRef.current,{type:"line",data:{labels:Object.keys(dias),datasets:[{data:Object.values(dias),fill:true,tension:0.4,borderColor:"#FF8C00",borderWidth:2.5,backgroundColor:"rgba(255,140,0,0.07)",pointBackgroundColor:"#FF8C00",pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#888",font:{size:10}}},y:{grid:{color:"#F0F0F0"},ticks:{color:"#888",font:{size:10},callback:(v)=>Number(v)>=1000?`$${(Number(v)/1000).toFixed(0)}K`:`$${v}`}}}}})
  },[pedidosSemana])

  useEffect(()=>{
    if(!chartDRef.current||loading) return
    if(chartDInst.current) chartDInst.current.destroy()
    chartDInst.current = new Chart(chartDRef.current,{type:"doughnut",data:{labels:["WhatsApp","QR","Teléfono"],datasets:[{data:[75,20,5],backgroundColor:["#22C55E","#FF8C00","#EF4444"],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},cutout:"70%"} as any})
  },[loading])

  const card = "bg-white rounded-2xl border border-gray-100 p-4 md:p-5"

  function pct(n:number){
    return <span style={{fontSize:12,color:n>=0?"#16A34A":"#EF4444",fontWeight:700}}>{n>=0?"↑":"↓"} {Math.abs(n)}% vs ayer</span>
  }

  if(loading) return <div className="text-gray-400 p-10 text-sm">Cargando...</div>

  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 m-0 mb-1">
            Bienvenido, {restaurante?.nombre?.split(" ")[0]||"Admin"}
          </h1>
          <p className="text-sm text-gray-400 m-0">Resumen de tu restaurante hoy</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 text-xs text-gray-500">
            {hoy.toLocaleDateString("es-MX",{day:"numeric",month:"long"})}
          </div>
          <Link href="/admin/productos" className="bg-gray-900 text-white px-3 py-2 rounded-xl text-xs font-bold no-underline">
            + Nuevo
          </Link>
        </div>
      </div>

      {/* KPIs — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          {Icon:BagIcon, bg:"#FEF3C7", label:"Pedidos hoy", val:pedidosHoy.length.toString(), extra:pct(pctP)},
          {Icon:DollarIcon, bg:"#FEE2E2", label:"Ventas hoy", val:`$${totalHoy.toLocaleString("es-MX",{minimumFractionDigits:0,maximumFractionDigits:0})}`, extra:pct(pctV)},
          {Icon:UsersIcon, bg:"#FEF3C7", label:"Clientes", val:clientes.toString(), extra:<span style={{fontSize:12,color:"#888"}}>hoy</span>},
          {Icon:ClockIcon, bg:"#F5F5F5", label:"Tiempo prom.", val:tiempoAvg?`${tiempoAvg} min`:"—", extra:<span style={{fontSize:12,color:"#888"}}>preparación</span>},
        ].map((k,i)=>(
          <div key={i} className={card}>
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{background:k.bg}}>
                <k.Icon/>
              </div>
              <p className="text-xs text-gray-400 font-semibold m-0 uppercase tracking-wide leading-tight">{k.label}</p>
            </div>
            <p className="text-2xl font-black text-gray-900 m-0 mb-1 leading-none">{k.val}</p>
            {k.extra}
          </div>
        ))}
      </div>

      {/* Ventas + Recientes — stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 mb-4">
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-gray-900 m-0">Resumen de ventas</p>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">Últimos 7 días</span>
          </div>
          <div style={{height:180}}><canvas ref={chartVRef}/></div>
        </div>
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-gray-900 m-0">Pedidos recientes</p>
            <Link href="/admin/pedidos" className="text-xs text-orange-500 font-bold no-underline">Ver todos</Link>
          </div>
          {pedidosRecientes.length===0
            ? <p className="text-gray-300 text-sm text-center py-5">Sin pedidos aún</p>
            : pedidosRecientes.map(p=>{
                const est=ESTADO_BADGE[p.estado]||ESTADO_BADGE.pendiente
                const hora=new Date(p.created_at).toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})
                return(
                  <div key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 m-0 truncate">{p.cliente_nombre?.split(" ")[0]} · {hora}</p>
                      <p className="text-xs text-gray-400 m-0">{(p.items||[]).length} prod.</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-black text-gray-900 m-0">${Number(p.total||0).toFixed(0)}</p>
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:99,background:est.bg,color:est.color,fontWeight:700}}>{est.label}</span>
                    </div>
                  </div>
                )
              })}
        </div>
      </div>

      {/* Bottom — stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_1fr] gap-4">
        {/* Top productos */}
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-gray-900 m-0">Más vendidos</p>
            <Link href="/admin/estadisticas" className="text-xs text-orange-500 font-bold no-underline">Ver todos</Link>
          </div>
          {topProds.length===0
            ? <p className="text-gray-300 text-sm">Sin datos esta semana</p>
            : topProds.map(([nombre,qty],i)=>(
              <div key={nombre} className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-gray-400 w-4">{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 m-0 mb-1 truncate">{nombre}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400 rounded-full" style={{width:`${(qty/maxProd)*100}%`}}/>
                  </div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{qty}</span>
              </div>
            ))}
        </div>
        {/* Donut */}
        <div className={`${card} flex flex-col`}>
          <p className="text-sm font-black text-gray-900 m-0 mb-3">Canales</p>
          <div style={{position:"relative",height:120,marginBottom:12}}>
            <canvas ref={chartDRef}/>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",pointerEvents:"none"}}>
              <span className="text-base font-black text-gray-900">{pedidosHoy.length}</span>
              <span className="text-xs text-gray-400">Total</span>
            </div>
          </div>
          {[{label:"WhatsApp",color:"#22C55E",pct:75},{label:"QR",color:"#FF8C00",pct:20},{label:"Teléfono",color:"#EF4444",pct:5}].map(c=>(
            <div key={c.label} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:c.color}}/>
              <span className="text-xs text-gray-500 flex-1">{c.label}</span>
              <span className="text-xs font-bold text-gray-900">{c.pct}%</span>
            </div>
          ))}
        </div>
        {/* Accesos */}
        <div className={card}>
          <p className="text-sm font-black text-gray-900 m-0 mb-3">Accesos rápidos</p>
          <div className="grid grid-cols-2 gap-2">
            {ACCESOS.map(a=>(
              <Link key={a.label} href={a.href}
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-50 rounded-xl border border-gray-100 no-underline hover:bg-gray-100 transition-colors">
                <span className="text-xs font-semibold text-gray-600 text-center leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

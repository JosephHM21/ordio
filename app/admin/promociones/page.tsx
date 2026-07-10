"use client"
import Link from "next/link"
export default function Page() {
  return (
    <div style={{fontFamily:"Inter,system-ui,sans-serif",maxWidth:600}}>
      <h1 style={{fontSize:22,fontWeight:900,color:"#111",margin:"0 0 6px"}}>🏷️ Promociones</h1>
      <p style={{fontSize:14,color:"#888",margin:"0 0 32px"}}>Crea descuentos y promociones para tu menú.</p>
      <div style={{background:"#fff",borderRadius:16,border:"1.5px solid #F0F0F0",padding:"48px 32px",textAlign:"center"}}>
        <p style={{fontSize:40,margin:"0 0 12px"}}>🏷️</p>
        <h2 style={{fontSize:18,fontWeight:800,color:"#111",margin:"0 0 8px"}}>Próximamente</h2>
        <p style={{fontSize:14,color:"#888",margin:"0 0 24px",lineHeight:1.6}}>Crea descuentos y promociones para tu menú.<br/>Esta sección estará disponible en la próxima actualización.</p>
        <Link href="/admin" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 20px",background:"#111",color:"#fff",borderRadius:10,textDecoration:"none",fontSize:13,fontWeight:700}}>
          ← Volver al Dashboard
        </Link>
      </div>
    </div>
  )
}

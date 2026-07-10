"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase"
import type { Producto, Categoria } from "@/types"

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [restauranteId, setRestauranteId] = useState<string | null>(null)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)
  const [subiendoImg, setSubiendoImg] = useState(false)
  const [form, setForm] = useState({
    nombre: "", descripcion: "", precio: "", tiempoPrep: "15",
    categoriaId: "", ingredientes: "", tieneSabores: false, imagen_url: "",
  })
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const { data: u } = await supabase.from("usuarios")
        .select("restaurante_id").eq("id", data.user.id).single()
      if (u?.restaurante_id) {
        setRestauranteId(u.restaurante_id)
        fetchData(u.restaurante_id)
      }
    })
  }, [])

  async function fetchData(rid: string) {
    const [p, c] = await Promise.all([
      supabase.from("productos").select("*").eq("restaurante_id", rid).order("orden"),
      supabase.from("categorias").select("*").eq("restaurante_id", rid).order("orden"),
    ])
    if (p.data) setProductos(p.data as Producto[])
    if (c.data) setCategorias(c.data as Categoria[])
  }

  async function subirImagen(file: File): Promise<string | null> {
    setSubiendoImg(true)
    const ext = file.name.split(".").pop()
    const path = `productos/${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from("imagenes").upload(path, file, { cacheControl: "3600", upsert: false })
    setSubiendoImg(false)
    if (error || !data) return null
    const { data: urlData } = supabase.storage.from("imagenes").getPublicUrl(data.path)
    return urlData.publicUrl
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("La imagen debe pesar menos de 5MB"); return }
    const url = await subirImagen(file)
    if (url) setForm(f => ({ ...f, imagen_url: url }))
    else alert("Error al subir la imagen. Verifica que el bucket 'imagenes' esté creado.")
  }

  function abrirModal(p?: Producto) {
    if (p) {
      setEditando(p)
      setForm({
        nombre: p.nombre, descripcion: p.descripcion || "",
        precio: String(p.precio), tiempoPrep: String(p.tiempo_prep),
        categoriaId: p.categoria_id,
        ingredientes: p.ingredientes?.join(", ") || "",
        tieneSabores: p.tiene_sabores,
        imagen_url: p.imagen_url || "",
      })
    } else {
      setEditando(null)
      setForm({ nombre: "", descripcion: "", precio: "", tiempoPrep: "15",
        categoriaId: categorias[0]?.id || "", ingredientes: "", tieneSabores: false, imagen_url: "" })
    }
    setModal(true)
  }

  async function guardar() {
    if (!restauranteId || !form.nombre || !form.precio) return
    const data = {
      restaurante_id: restauranteId,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: parseFloat(form.precio),
      tiempo_prep: parseInt(form.tiempoPrep) || 15,
      categoria_id: form.categoriaId,
      ingredientes: form.ingredientes
        ? form.ingredientes.split(",").map(s => s.trim()).filter(Boolean)
        : [],
      tiene_sabores: form.tieneSabores,
      imagen_url: form.imagen_url || null,
      activo: true,
      orden: editando?.orden || Date.now(),
    }
    if (editando) { await supabase.from("productos").update(data).eq("id", editando.id) }
    else { await supabase.from("productos").insert(data) }
    setModal(false)
    if (restauranteId) fetchData(restauranteId)
  }

  async function toggleActivo(p: Producto) {
    await supabase.from("productos").update({ activo: !p.activo }).eq("id", p.id)
    if (restauranteId) fetchData(restauranteId)
  }

  const getCatNombre = (id: string) => categorias.find(c => c.id === id)?.nombre || "—"

  const inputStyle = {
    width: "100%", padding: "10px 12px",
    background: "#F8F8F8", border: "1.5px solid #E8E8E8",
    borderRadius: 10, fontSize: 13, color: "#111",
    fontFamily: "inherit", boxSizing: "border-box" as const,
  }
  const labelStyle = {
    display: "block" as const, fontSize: 11, fontWeight: 700 as const,
    color: "#888", textTransform: "uppercase" as const,
    letterSpacing: "0.5px", marginBottom: 5,
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111", margin: 0 }}>Productos</h1>
        <button onClick={() => abrirModal()}
          style={{ background: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          + Nuevo producto
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #F0F0F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#FAFAFA", borderBottom: "1.5px solid #F0F0F0" }}>
              {["Imagen", "Nombre", "Categoría", "Precio", "Tiempo", "Estado", "Acciones"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "11px 14px", fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {productos.map(p => (
              <tr key={p.id} style={{ borderBottom: "1px solid #F5F5F5" }}>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: "#1A1A1A", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {p.imagen_url
                      ? <Image src={p.imagen_url} alt={p.nombre} width={48} height={48} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      : "🍽️"}
                  </div>
                </td>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#111" }}>{p.nombre}</td>
                <td style={{ padding: "10px 14px", color: "#888" }}>{getCatNombre(p.categoria_id)}</td>
                <td style={{ padding: "10px 14px", fontWeight: 800, color: "#111" }}>${Number(p.precio).toFixed(2)}</td>
                <td style={{ padding: "10px 14px", color: "#888" }}>{p.tiempo_prep} min</td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: p.activo !== false ? "#F0FDF4" : "#FEF2F2", color: p.activo !== false ? "#16A34A" : "#DC2626", border: `1px solid ${p.activo !== false ? "#BBF7D0" : "#FECACA"}` }}>
                    {p.activo !== false ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => abrirModal(p)}
                      style={{ padding: "5px 12px", background: "#F5F5F5", border: "1px solid #E5E5E5", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#111" }}>
                      ✏️ Editar
                    </button>
                    <button onClick={() => toggleActivo(p)}
                      style={{ padding: "5px 12px", border: "1px solid", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "transparent", borderColor: p.activo !== false ? "#FECACA" : "#BBF7D0", color: p.activo !== false ? "#DC2626" : "#16A34A" }}>
                      {p.activo !== false ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productos.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "#bbb", fontSize: 14 }}>
            Sin productos aún. Agrega el primero.
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div onClick={e => e.target === e.currentTarget && setModal(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: "#111", margin: 0 }}>
                {editando ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button onClick={() => setModal(false)}
                style={{ background: "#F5F5F5", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {/* Imagen */}
              <div>
                <label style={labelStyle}>Imagen del producto</label>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {/* Preview */}
                  <div style={{ width: 80, height: 80, borderRadius: 10, background: "#1A1A1A", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>
                    {form.imagen_url
                      ? <Image src={form.imagen_url} alt="preview" width={80} height={80} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                      : "🍽️"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                      background: "#F8F8F8", border: "1.5px dashed #D0D0D0", borderRadius: 10,
                      cursor: subiendoImg ? "not-allowed" : "pointer", fontSize: 13, color: "#666", fontWeight: 600,
                    }}>
                      {subiendoImg ? "⏳ Subiendo imagen..." : "📷 Seleccionar imagen"}
                      <input type="file" accept="image/*" onChange={handleImageChange}
                        disabled={subiendoImg} style={{ display: "none" }} />
                    </label>
                    <p style={{ fontSize: 11, color: "#aaa", margin: "6px 0 0" }}>JPG, PNG o WebP · máx. 5MB</p>
                    {form.imagen_url && (
                      <button onClick={() => setForm(f => ({ ...f, imagen_url: "" }))}
                        style={{ marginTop: 6, fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                        Quitar imagen
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nombre */}
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Hamburguesa Clásica" style={inputStyle} />
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={3} placeholder="Ingredientes y detalles del producto..."
                  style={{ ...inputStyle, resize: "none" as const }} />
              </div>

              {/* Precio y Tiempo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={labelStyle}>Precio ($) *</label>
                  <input type="number" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
                    step="0.50" placeholder="0.00" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tiempo de preparación (min) *</label>
                  <input type="number" value={form.tiempoPrep} onChange={e => setForm(f => ({ ...f, tiempoPrep: e.target.value }))}
                    placeholder="15" style={inputStyle} />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label style={labelStyle}>Categoría *</label>
                <select value={form.categoriaId} onChange={e => setForm(f => ({ ...f, categoriaId: e.target.value }))}
                  style={inputStyle}>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              {/* Ingredientes */}
              <div>
                <label style={labelStyle}>Ingredientes (separados por coma)</label>
                <input value={form.ingredientes} onChange={e => setForm(f => ({ ...f, ingredientes: e.target.value }))}
                  placeholder="Pan brioche, Carne de res, Queso americano..."
                  style={inputStyle} />
                <p style={{ fontSize: 11, color: "#aaa", margin: "5px 0 0" }}>
                  El cliente podrá elegir qué ingredientes quitar.
                </p>
              </div>

              {/* Sabores */}
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.tieneSabores}
                  onChange={e => setForm(f => ({ ...f, tieneSabores: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#111" }} />
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>Tiene selección de sabores</span>
                  <p style={{ fontSize: 11, color: "#aaa", margin: 0 }}>Para alitas y boneless (BBQ, Búfalo, Ranch...)</p>
                </div>
              </label>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(false)}
                style={{ flex: 1, padding: "12px 0", background: "#F5F5F5", color: "#555", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={guardar} disabled={!form.nombre || !form.precio || subiendoImg}
                style={{ flex: 1, padding: "12px 0", background: "#111", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: (!form.nombre || !form.precio) ? 0.4 : 1 }}>
                {subiendoImg ? "Subiendo imagen..." : "Guardar producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

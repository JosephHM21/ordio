export interface Restaurante {
  id: string
  slug: string
  nombre: string
  descripcion: string | null
  whatsapp: string
  logo_url: string | null
  plan: 'basico' | 'premium'
  config: {
    colores?: { primario?: string; fondo?: string; texto?: string; sidebar?: string }
    tipografia?: { display?: string; cuerpo?: string }
    contenido?: {
      horario?: string
      tiempo_entrega?: number
      instagram?: string
      direccion?: string
      banner_url?: string | null
      promo_texto?: string
      promo_subtexto?: string
    }
    opciones?: {
      mostrar_branding_ordio?: boolean
      horario_visible?: boolean
      mostrar_instagram?: boolean
    }
    tiempo_entrega?: number
  }
  activo: boolean
}

export interface Categoria {
  id: string
  restaurante_id: string
  nombre: string
  descripcion?: string | null
  orden: number
  activo: boolean
}

export interface Producto {
  id: string
  restaurante_id: string
  categoria_id: string
  nombre: string
  descripcion: string | null
  precio: number
  tiempo_prep: number
  ingredientes: string[]
  tiene_sabores: boolean
  imagen_url: string | null
  activo: boolean
  orden: number
  categorias?: Categoria
}

export interface CartItem {
  id: string
  productoId: string
  nombre: string
  precio: number
  cantidad: number
  sabor: string | null
  ingredientesEliminados: string[]
  notas: string
  tiempoPrep: number
}

export interface Pedido {
  id: string
  restaurante_id: string
  numero: number
  cliente_nombre: string
  cliente_telefono: string | null
  cliente_direccion: string | null
  items: CartItem[]
  total: number
  tiempo_estimado: string | null
  estado: 'pendiente' | 'en_preparacion' | 'en_camino' | 'entregado' | 'cancelado'
  notas: string | null
  tipo: 'domicilio' | 'local'
  created_at: string
  updated_at: string
}

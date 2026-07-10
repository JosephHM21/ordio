import type { CartItem } from '@/types'

export const SABORES = ['BBQ', 'Búfalo', 'Ranch', 'Mango Habanero', 'Picante'] as const

export const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  pendiente:       { label: 'Pendiente',       color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  en_preparacion:  { label: 'En preparación',  color: 'text-blue-400  bg-blue-400/10  border-blue-400/20'  },
  en_camino:       { label: 'En camino',        color: 'text-gold     bg-gold-dim      border-gold/20'      },
  entregado:       { label: 'Entregado',        color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  cancelado:       { label: 'Cancelado',        color: 'text-red-400  bg-red-400/10   border-red-400/20'   },
}

export function calcularTiempoEstimado(
  items: CartItem[],
  pedidosPendientes: number,
  tiempoEntrega = 15
): string {
  const tiempoMax = items.reduce((max, item) => Math.max(max, item.tiempoPrep), 0) || 15
  const trafico   = Math.min(pedidosPendientes * 5, 30)
  const total     = tiempoMax + trafico + tiempoEntrega
  return `${total}–${total + 10} min`
}

export function buildWhatsAppMessage(
  restaurante: { nombre: string; whatsapp: string },
  items: CartItem[],
  cliente: { nombre: string; direccion: string; notas?: string },
  total: number,
  tiempo: string,
  pedidoId: string
): string {
  let msg = `🍔 *NUEVO PEDIDO — ${restaurante.nombre}*\n\n`
  msg += `👤 *Cliente:* ${cliente.nombre}\n`
  msg += `📍 *Dirección:* ${cliente.direccion}\n`
  msg += `🔖 *Pedido #:* ${pedidoId.slice(0, 8).toUpperCase()}\n\n`
  msg += `*PRODUCTOS:*\n`
  items.forEach(item => {
    msg += `• ${item.cantidad}x ${item.nombre} — $${(item.precio * item.cantidad).toFixed(2)}\n`
    if (item.sabor)                            msg += `  🌶 Sabor: ${item.sabor}\n`
    if (item.ingredientesEliminados?.length)   msg += `  ✖ Sin: ${item.ingredientesEliminados.join(', ')}\n`
    if (item.notas)                            msg += `  📝 ${item.notas}\n`
  })
  msg += `\n💰 *TOTAL: $${total.toFixed(2)}*\n`
  msg += `⏱️ *Tiempo estimado: ${tiempo}*`
  if (cliente.notas) msg += `\n📝 *Notas:* ${cliente.notas}`
  return msg
}

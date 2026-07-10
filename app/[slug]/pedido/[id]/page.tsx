import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import EstadoPedido from '@/components/menu/EstadoPedido'

type Props = { params: Promise<{ slug: string; id: string }> }

export default async function PedidoPage({ params }: Props) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: restaurante } = await supabase
    .from('restaurantes').select('id,nombre,logo_url').eq('slug', slug).single()

  const { data: pedido } = await supabase
    .from('pedidos').select('*').eq('id', id).single()

  if (!restaurante || !pedido) notFound()

  return <EstadoPedido pedido={pedido} restaurante={restaurante} />
}

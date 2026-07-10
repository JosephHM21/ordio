import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import MenuCliente from '@/components/menu/MenuCliente'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('restaurantes').select('nombre,descripcion').eq('slug', slug).single()
  return { title: data ? `${data.nombre} — Ordio` : 'Ordio', description: data?.descripcion || '' }
}

export default async function RestaurantePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: restaurante } = await supabase
    .from('restaurantes').select('*').eq('slug', slug).eq('activo', true).single()

  if (!restaurante) notFound()

  const { data: categorias } = await supabase
    .from('categorias').select('*').eq('restaurante_id', restaurante.id)
    .eq('activo', true).order('orden')

  const { data: productos } = await supabase
    .from('productos').select('*, categorias(nombre)')
    .eq('restaurante_id', restaurante.id).eq('activo', true).order('orden')

  return (
    <MenuCliente
      restaurante={restaurante}
      categorias={categorias || []}
      productos={productos || []}
    />
  )
}

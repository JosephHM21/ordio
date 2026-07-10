import { redirect } from 'next/navigation'

// Redirige la raíz automáticamente a /baggos
// En el futuro esto será una landing page de Ordio
export default function HomePage() {
  redirect('/baggos')
}

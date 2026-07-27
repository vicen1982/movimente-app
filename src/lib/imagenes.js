import { supabase } from './supabase'

const MAX_MB = 5

// Sube una imagen al bucket 'ejercicios' y devuelve la URL pública
export async function subirImagenEjercicio(archivo) {
  if (archivo.size > MAX_MB * 1024 * 1024) {
    throw new Error(`La imagen es muy pesada (máximo ${MAX_MB} MB)`)
  }

  const extension = archivo.name.split('.').pop().toLowerCase()
  const ruta = `${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from('ejercicios')
    .upload(ruta, archivo, { cacheControl: '3600' })

  if (error) throw error

  const { data } = supabase.storage.from('ejercicios').getPublicUrl(ruta)
  return data.publicUrl
}

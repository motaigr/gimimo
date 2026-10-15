// Reduz fotos do cliente antes do envio: a Vercel aceita no máximo ~4,5 MB
// por requisição, e uma foto de celular sozinha pode passar disso.
// Redimensiona para no máximo `maxSide` px e salva em JPEG.
export async function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff' // PNG transparente vira fundo branco no JPEG
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob || blob.size >= file.size) return file

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg' })
  } catch {
    return file // formato que o navegador não abre (ex: HEIC): envia como está
  }
}

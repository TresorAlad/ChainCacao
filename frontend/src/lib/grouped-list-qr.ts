import api from '@/lib/api'
import { getApiBaseUrl } from '@/lib/api-base'

/** Charge le QR liste (base64) avec repli sur l’URL PNG publique. */
export async function fetchGroupedListQrDataUrl(listId: string): Promise<string> {
  const encoded = encodeURIComponent(listId)
  try {
    const res = await api.get<{ qrcode_png_base64?: string }>(`/qrcode/${encoded}`)
    if (res.data.qrcode_png_base64) {
      return `data:image/png;base64,${res.data.qrcode_png_base64}`
    }
  } catch {
    /* repli PNG */
  }
  return `${getApiBaseUrl()}/qrcode/${encoded}?format=png`
}

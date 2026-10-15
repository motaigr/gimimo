import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type Address = {
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

export const EMPTY_ADDRESS: Address = {
  cep: '',
  rua: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
}

// campos obrigatórios (complemento é opcional)
export const isAddressComplete = (a: Address) =>
  a.cep.replace(/\D/g, '').length === 8 && [a.rua, a.numero, a.bairro, a.cidade, a.uf].every((v) => v.trim())

export const formatAddress = (a: Address) =>
  `${a.rua.trim()}, ${a.numero.trim()}${a.complemento.trim() ? ` — ${a.complemento.trim()}` : ''}, ` +
  `${a.bairro.trim()}, ${a.cidade.trim()}/${a.uf.trim().toUpperCase()} — CEP ${a.cep}`

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

const labelClass = 'text-xs uppercase tracking-widest'
const inputClass = 'h-12 rounded-xl'

interface AddressFieldsProps {
  value: Address
  onChange: (a: Address) => void
}

// Endereço de entrega: ao completar o CEP, busca rua/bairro/cidade/UF no
// ViaCEP (serviço gratuito dos Correios); o cliente só completa número e
// complemento. Se a busca falhar, ele preenche tudo à mão.
export function AddressFields({ value, onChange }: AddressFieldsProps) {
  const [buscando, setBuscando] = useState(false)
  const [cepStatus, setCepStatus] = useState<'' | 'nao-encontrado' | 'erro'>('')

  const set = (field: keyof Address, v: string) => onChange({ ...value, [field]: v })

  const changeCep = async (raw: string) => {
    const cep = maskCep(raw)
    const next = { ...value, cep }
    onChange(next)
    setCepStatus('')

    const digits = cep.replace(/\D/g, '')
    if (digits.length !== 8) return

    setBuscando(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepStatus('nao-encontrado')
        return
      }
      onChange({
        ...next,
        rua: data.logradouro || next.rua,
        bairro: data.bairro || next.bairro,
        cidade: data.localidade || next.cidade,
        uf: data.uf || next.uf,
      })
      // leva o cursor para o número, que é o próximo a preencher
      requestAnimationFrame(() => document.getElementById('end-numero')?.focus())
    } catch {
      setCepStatus('erro')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <fieldset className="space-y-5">
      <legend className="sr-only">endereço de entrega</legend>

      <div className="space-y-2">
        <Label htmlFor="end-cep" className={labelClass}>cep *</Label>
        <div className="relative max-w-[200px]">
          <Input
            id="end-cep"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={value.cep}
            onChange={(e) => changeCep(e.target.value)}
            required
            className={inputClass}
          />
          {buscando && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        {cepStatus && (
          <p className="text-xs text-gray-500">
            {cepStatus === 'nao-encontrado'
              ? 'CEP não encontrado — confira o número ou preencha o endereço abaixo.'
              : 'Não foi possível buscar o CEP agora — preencha o endereço abaixo.'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="end-rua" className={labelClass}>rua *</Label>
        <Input
          id="end-rua"
          autoComplete="address-line1"
          value={value.rua}
          onChange={(e) => set('rua', e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-4">
        <div className="space-y-2">
          <Label htmlFor="end-numero" className={labelClass}>número *</Label>
          <Input
            id="end-numero"
            value={value.numero}
            onChange={(e) => set('numero', e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-complemento" className={labelClass}>
            complemento <span className="normal-case tracking-normal text-gray-400">(opcional)</span>
          </Label>
          <Input
            id="end-complemento"
            autoComplete="address-line2"
            placeholder="apto, bloco…"
            value={value.complemento}
            onChange={(e) => set('complemento', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="end-bairro" className={labelClass}>bairro *</Label>
        <Input
          id="end-bairro"
          value={value.bairro}
          onChange={(e) => set('bairro', e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-[1fr_88px] gap-4">
        <div className="space-y-2">
          <Label htmlFor="end-cidade" className={labelClass}>cidade *</Label>
          <Input
            id="end-cidade"
            autoComplete="address-level2"
            value={value.cidade}
            onChange={(e) => set('cidade', e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end-uf" className={labelClass}>uf *</Label>
          <Input
            id="end-uf"
            autoComplete="address-level1"
            maxLength={2}
            value={value.uf}
            onChange={(e) => set('uf', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
            required
            className={cn(inputClass, 'uppercase')}
          />
        </div>
      </div>
    </fieldset>
  )
}

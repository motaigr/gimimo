# Gimimo — catálogo de pins e personalizados

Catálogo online da Gimimo: o cliente escolhe os produtos, monta o pedido e
envia para **orçamento** (sem preços no site). O pedido cai direto numa
planilha do Google Sheets da loja, uma linha por item, e as artes do item
personalizado vão para o Google Drive. Sem banco de dados, sem mensalidade.

Feito com React + Vite + TypeScript + Tailwind (componentes shadcn/ui).

---

## Como rodar localmente

Precisa do [Node.js](https://nodejs.org) (versão LTS).

```bash
npm install
npm run dev
```

Abre em http://localhost:5173

> Mantenha o projeto **fora do OneDrive** (ex: `C:\Projetos\gimimo`) — o
> OneDrive deixa arquivos só na nuvem e isso quebra o git e o `npm`.

---

## Como adicionar bottons e outros produtos (sem mexer no código)

Os produtos vêm da pasta **"Catálogo Gimimo"** no Google Drive da loja:

```
Catálogo Gimimo/
  Bottons/
    São Paulo/
      São Paulo 01.jpg
      São Paulo 02.jpg
    AC-DC/
      Highway to Hell.png
  Canecas/
    Times/
      Caneca Corinthians.jpg
  Garrafas/
```

1. **Arraste as fotos** para a pasta do tema certo (pelo computador ou pelo
   app do Google Drive no celular). **O nome do arquivo vira o nome do
   modelo** no site. Uma pasta nova dentro de Bottons/Canecas/Garrafas vira
   um tema novo, com filtro no topo da página.
2. Na planilha de pedidos: menu **Gimimo → Publicar site**.
3. Em 1–2 minutos o site está atualizado (as fotos são convertidas e
   otimizadas automaticamente: quadradas, 400×400, WebP).

Dicas:
- Use **JPG ou PNG** (fotos HEIC do iPhone não são aceitas; no iPhone,
  Ajustes → Câmera → Formatos → "Mais Compatível").
- Para **tirar um modelo do site sem apagar**, coloque `_` no começo do nome
  do arquivo (ou da pasta do tema) e publique de novo.
- A ordem é alfabética, entendendo números ("São Paulo 2" vem antes de
  "São Paulo 10").
- O item personalizado ("+") de cada tipo é fixo no site.
- Se a publicação falhar (ex: Google fora do ar), o site anterior continua no
  ar; é só tentar de novo. O motivo aparece em Vercel → Deployments.

### Configurações no código

Em `src/lib/catalog.ts`:

- **Contato da loja:** `WHATSAPP_NUMBER`, `EMAIL_LOJA`.
- **Planilha/Drive:** a URL do Apps Script fica em `src/lib/config.json`
  (`planilhaEndpoint`). Plano B dos pedidos: `FORMSPREE_ENDPOINT`.
- **Tipos de produto** (`PRODUCT_TYPES`): são os botões da barra inferior
  (Pins, Canecas, Garrafas). Para um tipo novo, adicione um item com `id`,
  nome, título, subtítulo e um ícone do [lucide](https://lucide.dev/icons).
- **Temas** (`THEMES`): São Paulo, bandas etc. Quando um tipo de produto tem
  mais de um tema, aparecem filtros no topo da página.
- **Catálogo fixo** (São Paulo, em `public/images/`): usado só enquanto um
  tipo de produto ainda não tiver fotos na pasta do Drive.

---

## Pedidos no Google Sheets

O cliente só clica em "enviar pedido" — **não baixa nem envia nada**. O pedido
cai direto numa planilha do Google Sheets da loja:

- **uma linha por item**: data, nº do pedido, cliente, e-mail, telefone,
  entrega (endereço ou retirada), foto do produto, produto, tipo, tema,
  quantidade, link das imagens do cliente, **status** (lista para escolher:
  novo, orçamento enviado, aprovado, em produção…) e observações;
- as **imagens do item personalizado** vão para uma pasta no Google Drive
  ("Gimimo — imagens dos pedidos", uma subpasta por pedido);
- chega um **e-mail de aviso** para a dona da planilha a cada pedido novo.

Para baixar como Excel: *Arquivo → Fazer download → Microsoft Excel (.xlsx)*
(é uma cópia daquele momento; os pedidos novos continuam entrando no Sheets).

Se a planilha não responder, o site usa o **Formspree** como plano B (manda o
texto do pedido por e-mail). Se os dois falharem, o cliente vê um botão para
mandar o pedido pelo WhatsApp.

### Instalar (uma vez só, ~10 minutos)

Faça logado na conta Google da loja (gimimoandco@gmail.com):

1. Crie uma planilha nova em https://sheets.new e dê um nome (ex: "Pedidos Gimimo")
2. Menu **Extensões → Apps Script**
3. Apague o que estiver no editor, cole todo o conteúdo de
   [`apps-script/Code.gs`](apps-script/Code.gs) e salve (ícone de disquete)
4. No topo, escolha a função **`configurar`** e clique em **Executar**
   - O Google vai pedir permissão (planilha, Drive e e-mail): *Revisar
     permissões → escolher a conta → Avançado → Acessar (não seguro) →
     Permitir*. O aviso aparece porque o script é seu e não foi publicado na
     loja do Google — é normal.
   - Isso cria a aba "Pedidos" com o cabeçalho e a pasta no Drive.
5. **Implantar → Nova implantação** → engrenagem → **App da Web**:
   - *Executar como:* **Eu**
   - *Quem pode acessar:* **Qualquer pessoa**
   - Clique em **Implantar** e copie a **URL do app da Web**
     (termina em `/exec`)
6. Cole a URL em `src/lib/config.json`:
   ```json
   { "planilhaEndpoint": "https://script.google.com/macros/s/XXXX/exec" }
   ```
7. Faça commit/push — a Vercel republica sozinha — e faça um **pedido de teste**

8. **Publicação do catálogo** (botão "Publicar site"):
   - Na Vercel: **Settings → Git → Deploy Hooks** → nome `Planilha`, branch
     `main` → **Create Hook** → copie a URL
   - Na planilha: menu **Gimimo → Configurar publicação…** → cole a URL
   - Na primeira vez que usar "Publicar site", o Google pede uma permissão a
     mais (acessar serviço externo) — pode permitir.
9. Suba as fotos para a pasta **Catálogo Gimimo** no Drive (criada no passo 4;
   atalho: menu Gimimo → Abrir pasta do catálogo) e clique em
   **Gimimo → Publicar site**.

**Se alterar o `Code.gs` depois:** Implantar → Gerenciar implantações → lápis →
*Versão: Nova versão* → Implantar (assim a URL continua a mesma).

Limites do Google (conta grátis): 100 e-mails de aviso por dia; cada pedido
leva poucos segundos. Para desligar o e-mail, mude `AVISAR_POR_EMAIL` para
`false` no script.

### Formspree (plano B)

Crie um formulário em https://formspree.io com o e-mail da loja e cole a URL
em `FORMSPREE_ENDPOINT`. Se não quiser plano B, deixe `''`.

---

## Publicar (Vercel)

Importe o repositório na Vercel (ela detecta o Vite sozinha: build
`npm run build`, pasta `dist`). O `vercel.json` faz as páginas (ex: `/pedido`)
abrirem direto pelo link.

---

## Estrutura

```
src/
  lib/catalog.ts          ← produtos, temas, tipos e contato da loja
  pages/
    Index.tsx             ← catálogo (barra inferior + filtros de tema)
    Order.tsx             ← revisão e envio do pedido
  components/
    BottomNav.tsx         ← barra inferior com os tipos de produto
    ProductCard.tsx       ← produto no catálogo
    QuickViewModal.tsx    ← detalhe do produto + quantidade
    CartDrawer.tsx        ← sacola lateral
    Header.tsx, Layout.tsx
    ui/                   ← componentes shadcn/ui
  stores/useCartStore.ts  ← carrinho (salvo no navegador)
  components/AddressFields.tsx ← endereço com busca de CEP
  utils/
    sendOrder.ts          ← envia o pedido para a planilha
    compressImage.ts      ← reduz as fotos do cliente antes do envio
apps-script/
  Code.gs                 ← script da planilha (pedidos + catálogo do Drive)
scripts/
  sync-catalog.mjs        ← na publicação: baixa e otimiza as fotos do Drive
public/images/            ← fotos dos produtos e logo
```

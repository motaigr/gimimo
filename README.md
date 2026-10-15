# Gimimo — catálogo de pins e personalizados

Catálogo online da Gimimo: o cliente escolhe os produtos, monta o pedido e
envia para **orçamento** (sem preços no site). O pedido chega por e-mail com
uma planilha (com as imagens dos itens) e, se houver, as artes do item
personalizado. Sem banco de dados, sem mensalidade.

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

## Como adicionar produtos

Tudo fica em `src/lib/catalog.ts`:

- **Contato da loja:** `WHATSAPP_NUMBER`, `EMAIL_LOJA`, `FORMSPREE_ENDPOINT`.
- **Tipos de produto** (`PRODUCT_TYPES`): são os botões da barra inferior
  (Pins, Canecas, Garrafas). Para um tipo novo, adicione um item com `id`,
  nome, título, subtítulo e um ícone do [lucide](https://lucide.dev/icons).
- **Temas** (`THEMES`): São Paulo, bandas etc. Quando um tipo de produto tem
  mais de um tema, aparecem filtros no topo da página.
- **Produtos** (`PRODUCTS`): cada um tem `id` único, `name`, `type`, `theme` e
  `image`. Um item com `custom: true` é o "personalizado" — o cliente envia a
  arte no fim do pedido.

### Imagens

Ficam em `public/images/NOME-DO-TEMA/`. Use **WebP quadrado com ~400×400px**
(fica leve: ~15 KB por imagem). As originais em alta resolução podem ficar em
`private/`, que não vai para o git nem para o site.

---

## Envio do pedido

O botão "enviar pedido" tenta, nesta ordem:

1. **Função serverless (Vercel + Resend)** — e-mail com a planilha e as
   imagens do item personalizado **anexadas**. Único método com anexo.
2. **Formspree** — envia o texto do pedido por e-mail; a planilha é baixada
   no aparelho do cliente, e a tela final pede para ele enviá-la (e as
   imagens) por e-mail ou WhatsApp.
3. **Abrir o e-mail do cliente** com o pedido pronto — último recurso.

### Configurar o Resend (anexo automático)

Exige o site publicado na Vercel **e um domínio próprio verificado**.

1. Crie uma conta em https://resend.com e verifique seu domínio em *Domains*
2. Em *API Keys*, crie uma chave (começa com `re_`)
3. Na Vercel: **Project → Settings → Environment Variables**:
   - `RESEND_API_KEY` → a chave
   - `RESEND_FROM` → ex: `Gimimo <pedidos@seudominio.com>`
   - `LOJA_EMAIL` → e-mail que recebe os pedidos
4. Republique o site (Deployments → Redeploy)

> A Vercel aceita no máximo ~4,5 MB por envio. Se as imagens do cliente
> forem maiores que isso, o site cai automaticamente no Formspree e pede
> para ele mandar as imagens por e-mail/WhatsApp.

### Formspree

Crie um formulário em https://formspree.io com o e-mail da loja e cole a URL
em `FORMSPREE_ENDPOINT`. O plano grátis tem limite mensal de envios.

---

## Publicar (Vercel)

Importe o repositório na Vercel (ela detecta o Vite sozinha: build
`npm run build`, pasta `dist`). O `vercel.json` faz as páginas (ex: `/pedido`)
abrirem direto pelo link, e a função de envio fica em `api/send-order.js`.

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
  utils/
    orderExcel.ts         ← planilha do pedido com as imagens
    sendOrder.ts          ← chama a função de envio
api/
  send-order.js           ← envia o e-mail com anexos (Resend)
public/images/            ← fotos dos produtos e logo
```

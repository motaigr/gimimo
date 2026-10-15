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

O cliente só clica em "enviar pedido" — **não baixa nem envia nada**. O site:

1. **Função serverless (Vercel + Resend)** — a loja recebe um e-mail com o
   pedido, a **planilha anexada** (com as imagens dos itens) e as **imagens
   do item personalizado**. As fotos do cliente são reduzidas antes do envio
   (a Vercel aceita até ~4,5 MB por envio); se mesmo assim não couberem
   todas, o e-mail avisa quantas faltaram e o cliente é orientado a mandá-las.
2. **Formspree (plano B)** — se o Resend estiver fora do ar ou não
   configurado, a loja recebe o texto do pedido (itens e quantidades) por
   e-mail, sem anexos.
3. Se os dois falharem, o cliente vê um botão para mandar o pedido pronto
   pelo WhatsApp.

### Configurar o Resend (obrigatório para os anexos)

**Não precisa de domínio próprio**: sem domínio, o Resend só envia para o
e-mail com que a conta foi criada — então crie a conta com o **e-mail da
loja** (o mesmo que recebe os pedidos).

1. Crie uma conta em https://resend.com com o e-mail da loja
   (`gimimoandco@gmail.com`)
2. Em *API Keys*, crie uma chave (começa com `re_`) e copie
3. Na Vercel: **Project → Settings → Environment Variables**:
   - `RESEND_API_KEY` → a chave
   - `LOJA_EMAIL` → `gimimoandco@gmail.com`
4. Republique o site (Deployments → Redeploy)
5. Faça um pedido de teste e confira a caixa de entrada (e o spam, na
   primeira vez)

Os e-mails chegam do remetente `onboarding@resend.dev`. Se um dia tiverem
domínio próprio (ex: gimimo.com.br), verifique o domínio em *Domains* no
Resend e adicione `RESEND_FROM` → `Gimimo <pedidos@gimimo.com.br>`.

Plano grátis do Resend: 100 e-mails/dia, 3.000/mês.

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

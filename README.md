# Gimimo — Catálogo de Pins

Catálogo online simples para pedidos via WhatsApp + e-mail. Sem banco de dados, sem mensalidade.

---

## Como rodar localmente

```bash
npm install
npm run dev
```

Abre em http://localhost:5173

---

## Como configurar antes de publicar

Abra o arquivo `src/data/catalog.js` e:

1. **Troque o número do WhatsApp:**
   ```js
   export const WHATSAPP_NUMBER = '5511999999999' // DDI + DDD + número, sem espaços
   ```

2. **Troque o e-mail:**
   ```js
   export const EMAIL_LOJA = 'contato@sujaloja.com.br'
   ```

3. **Configure o envio automático do pedido por e-mail.**

   O botão "enviar pedido" tenta, nesta ordem, até um dos métodos funcionar:

   1. **Função serverless (Netlify + Resend)** — e-mail com a planilha e as
      imagens do item personalizado **anexadas de verdade**. É o único
      método com anexo real. Veja "Anexo automático (Resend)" abaixo.
   2. **Formspree** — se o método acima não estiver configurado. Envia o
      texto do pedido automaticamente por e-mail, mas o plano grátis do
      Formspree **não aceita anexos**: a planilha é baixada no aparelho do
      cliente para ele enviar separadamente.
   3. **Baixar + abrir e-mail manualmente** — último recurso, se nada acima
      estiver configurado.

   ### Anexo automático (Resend)

   Esse método exige um site publicado no Netlify (não funciona no GitHub
   Pages, que não roda funções) **e um domínio próprio verificado** — o
   Resend não permite enviar para qualquer destinatário sem isso.

   1. Publique o site no Netlify (veja "Como publicar no ar" abaixo)
   2. Crie uma conta grátis em https://resend.com
   3. Em *Domains*, adicione e verifique um domínio seu (configurando os
      registros DNS que o Resend pedir — leva de minutos a algumas horas
      para propagar). Sem isso, só é possível enviar para o próprio e-mail
      de cadastro, não para o e-mail real da loja.
   4. Em *API Keys*, crie uma chave e copie o valor (começa com `re_`)
   5. No painel do Netlify do site publicado, vá em **Site settings →
      Environment variables** e adicione:
      - `RESEND_API_KEY` → a chave criada no passo 4
      - `RESEND_FROM` → remetente usando o domínio verificado, ex:
        `Gimimo <pedidos@seudominio.com>`
      - `LOJA_EMAIL` → o e-mail da loja que vai receber os pedidos (o
        mesmo do `EMAIL_LOJA` acima)
   6. Republique o site (qualquer novo deploy já usa essas variáveis)

   ### Formspree (alternativa mais simples, sem anexo)

   1. Crie uma conta grátis em https://formspree.io
   2. Crie um novo formulário e configure o e-mail de destino como o
      mesmo `EMAIL_LOJA` acima
   3. Copie a URL do formulário (formato `https://formspree.io/f/xxxxxxxx`)
   4. Cole em `src/data/catalog.js`:
      ```js
      export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xxxxxxxx'
      ```

   O plano grátis do Formspree tem um limite mensal de envios — confira
   no site deles se atende ao volume esperado de pedidos.

4. **Adicione as bandas e os pins** — as instruções estão dentro do próprio arquivo.

---

## Como adicionar fotos dos pins

As imagens ficam na pasta `public/images/`, organizadas por banda:

```
public/
  images/
    twenty-one-pilots/
      01.jpg
      02.jpg
      ...
    nome-da-banda/
      01.jpg
      ...
```

- Formato recomendado: JPG ou PNG
- Tamanho ideal: 400×400px (quadrado)
- Nome do arquivo: igual ao que está no `catalog.js` (ex: `01.jpg`)

Se uma foto não for encontrada, aparece um placeholder cinza automático.

---

## Como publicar no ar (gratuito)

### Opção 1 — Netlify (mais fácil)
1. Crie conta em https://netlify.com
2. Arraste a pasta do projeto para o painel
3. Pronto — ganha um link .netlify.app gratuito

### Opção 2 — GitHub Pages
1. Suba o projeto no GitHub
2. No `vite.config.js`, adicione `base: '/nome-do-repositorio/'`
3. Rode `npm run build`
4. Ative o GitHub Pages apontando para a pasta `dist/`

> ⚠️ GitHub Pages não roda funções serverless — o anexo automático via
> Resend (veja acima) só funciona publicando no Netlify.

---

## Estrutura de arquivos

```
src/
  data/
    catalog.js        ← AQUI você edita bandas e pins
  pages/
    Home.jsx          ← página inicial com grid de bandas
    Catalog.jsx       ← página de cada banda com os pins
    Order.jsx         ← resumo e envio do pedido
  components/
    Header.jsx        ← cabeçalho com logo e carrinho
  hooks/
    useCart.js        ← lógica do carrinho (localStorage)
  utils/
    orderExcel.js     ← gera a planilha do pedido (com imagens)
    sendOrder.js       ← chama a função serverless de envio
  styles/
    main.css          ← todo o visual
netlify/
  functions/
    send-order.js     ← função que envia o e-mail com anexo (Resend)
public/
  images/             ← coloque as fotos aqui
```

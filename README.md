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

3. **Adicione as bandas e os pins** — as instruções estão dentro do próprio arquivo.

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
  styles/
    main.css          ← todo o visual
public/
  images/             ← coloque as fotos aqui
```

// =====================================================
// CATÁLOGO GIMIMO
// Para adicionar uma nova banda ou tema: copie um bloco abaixo
// Para adicionar pins: copie um objeto dentro de "pins"
// As imagens ficam na pasta /public/images/NOME-DA-BANDA/
// =====================================================

export const WHATSAPP_NUMBER = '5511982204504' // Troque pelo número da loja com DDI+DDD
export const EMAIL_LOJA = 'gimimoandco@gmail.com'  // Troque pelo e-mail da loja

// Endpoint do Formspree (formspree.io) que recebe o pedido e envia por e-mail
// com a planilha em anexo automaticamente. Crie uma conta grátis em
// https://formspree.io, crie um formulário com o e-mail da loja acima e
// cole aqui a URL no formato https://formspree.io/f/xxxxxxxx
export const FORMSPREE_ENDPOINT = 'https://formspree.io/f/myezyqgn'

// Números disponíveis na coleção São Paulo (faltando o 79, que não existe)
const SAO_PAULO_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
  61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 80, 81,
  82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101,
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
]

export const bands = [
  // Exemplo de outra banda — duplique este bloco para adicionar mais
  //{
    //id: 'exemplo-banda',
    //name: 'Nome da Banda',
    //emoji: '⭐',
    //color: '#818cf8',
    //pins: [
      //{ id: 'ex-01', name: 'BANDA 01', image: '/images/exemplo-banda/01.jpg' },
      //{ id: 'ex-02', name: 'BANDA 02', image: '/images/exemplo-banda/02.jpg' },
    //]
  //},

  {
    id: 'sao-paulo',
    name: 'São Paulo',
    color: '#818cf8',
    pins: [
      // Item sem imagem: cliente manda a arte dele depois, no pedido.
      { id: 'custom', name: 'Item personalizado', image: null, custom: true },
      ...SAO_PAULO_NUMBERS.map(n => {
        const padded = String(n).padStart(3, '0')
        return {
          id: `SP-${padded}`,
          name: `São Paulo ${String(n).padStart(2, '0')}`,
          image: `/images/sao-paulo/${padded}.webp`,
        }
      }),
    ],
  },
]

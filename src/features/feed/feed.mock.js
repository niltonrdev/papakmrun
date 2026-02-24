// src/features/feed/feed.mock.js

export const FEED_AUTHORS = [
  {
    id: "nilton",
    name: "Nilton",
    avatar: null, // depois pode virar imagem
  },
  {
    id: "ana",
    name: "Ana",
    avatar: null,
  },
  {
    id: "bruno",
    name: "Bruno",
    avatar: null,
  },
];

export const FEED_PHRASES = [
  "Treino pago 💪",
  "Hoje foi sofrido 🥵",
  "Constância acima de tudo 🔥",
  "Mais um dia feito ✅",
  "Não foi fácil, mas foi feito 🏃‍♂️",
];

// helper simples pra pegar algo aleatório
export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
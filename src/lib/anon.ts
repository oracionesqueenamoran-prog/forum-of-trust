const TOKEN_KEY = "chismes:author_token";
const NICK_KEY = "chismes:nickname";

const NICK_ADJ = [
  "Misteriosa", "Curioso", "Chismosa", "Silenciosa", "Discreto", "Ardiente",
  "Anónima", "Traicionado", "Descarada", "Sospechoso", "Secreta", "Vengativa",
  "Astuto", "Rebelde", "Melancólica", "Furiosa",
];
const NICK_NOUN = [
  "Colibrí", "Fénix", "Gato", "Serpiente", "Cisne", "Corazón", "Zorro",
  "Búho", "Mariposa", "Cuervo", "Loba", "Pantera", "Luna", "Tigre",
  "Escorpión", "Sirena",
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function generateNickname(): string {
  return `${randomFrom(NICK_ADJ)} ${randomFrom(NICK_NOUN)} ${Math.floor(Math.random() * 900 + 100)}`;
}

export function getAuthorToken(): string {
  if (typeof window === "undefined") return "";
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

export function getNickname(): string {
  if (typeof window === "undefined") return "Anónimo";
  let n = localStorage.getItem(NICK_KEY);
  if (!n) {
    n = generateNickname();
    localStorage.setItem(NICK_KEY, n);
  }
  return n;
}

export function setNickname(n: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICK_KEY, n);
}

/**
 * Article models per content type. Guidance appears only as placeholders —
 * the fields stay empty so no instruction is ever invented.
 */
export type Template = {
  label: string;
  summary: string;
  quick_answer: string;
  attention: string;
  materials: string[];
  steps: string[];
  faq: { q: string; a: string }[];
  body_extra: string;
};

const step = (n: number, hint: string) => `Etapa ${n}: ${hint}`;

export const TEMPLATES: Record<string, Template> = {
  procedure: {
    label: "Procedimento",
    summary: "Em uma frase: o que este procedimento resolve e para quem.",
    quick_answer: "Resposta curta para quem tem pressa (1–2 frases).",
    attention: "Riscos, proibições ou cuidados obrigatórios antes de começar.",
    materials: ["Item, acesso ou documento necessário", "Outro item necessário"],
    steps: [step(1, "descreva uma única ação, começando por um verbo."), step(2, "próxima ação, com o resultado esperado."), step(3, "como confirmar que terminou corretamente.")],
    faq: [{ q: "Exceção ou dúvida comum", a: "O que fazer nesse caso e a quem recorrer." }],
    body_extra: "Informações complementares (opcional).",
  },
  quick_guide: {
    label: "Guia rápido",
    summary: "Para que serve este guia, em uma frase.",
    quick_answer: "O caminho mais curto para resolver (1–2 frases).",
    attention: "Cuidado principal, se houver.",
    materials: [],
    steps: [step(1, "primeira ação."), step(2, "segunda ação."), step(3, "resultado esperado.")],
    faq: [],
    body_extra: "",
  },
  checklist: {
    label: "Checklist",
    summary: "Quando usar esta lista e quem é responsável.",
    quick_answer: "Momento de usar (ex.: antes da abertura) e prazo.",
    attention: "Itens críticos que não podem ser pulados.",
    materials: [],
    steps: ["Item a verificar (escreva como uma conferência objetiva)", "Item a verificar", "Item a verificar", "Item a verificar"],
    faq: [{ q: "E se um item não estiver conforme?", a: "Indique a ação e o contato responsável." }],
    body_extra: "",
  },
  faq: {
    label: "Perguntas frequentes",
    summary: "Sobre qual assunto são estas perguntas.",
    quick_answer: "A resposta mais procurada, em uma frase.",
    attention: "",
    materials: [],
    steps: [],
    faq: [
      { q: "Pergunta como a equipe faz no dia a dia", a: "Resposta objetiva, com link para o procedimento, se houver." },
      { q: "Outra pergunta frequente", a: "Resposta objetiva." },
      { q: "Outra pergunta frequente", a: "Resposta objetiva." },
    ],
    body_extra: "",
  },
  announcement: {
    label: "Comunicado",
    summary: "O que mudou, em uma frase.",
    quick_answer: "O que a equipe precisa fazer e a partir de quando.",
    attention: "Prazo ou impacto importante.",
    materials: [],
    steps: [],
    faq: [{ q: "A quem isso se aplica?", a: "Lojas, áreas ou perfis afetados." }],
    body_extra: "Contexto e detalhes do comunicado.",
  },
  video: {
    label: "Vídeo",
    summary: "O que o vídeo mostra e a duração aproximada.",
    quick_answer: "O principal aprendizado do vídeo.",
    attention: "",
    materials: ["Link ou arquivo do vídeo (adicione em Anexos)"],
    steps: [step(1, "momento do vídeo e o que observar (ex.: 00:30).")],
    faq: [],
    body_extra: "Transcrição ou resumo do vídeo (recomendado para acessibilidade).",
  },
};

export const templateFor = (type: string): Template | undefined => TEMPLATES[type];

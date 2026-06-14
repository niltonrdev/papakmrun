export const PARQ_QUESTIONS = [
  {
    id: "q1",
    text: "Algum médico já disse que você possui algum problema de coração e que só deveria realizar atividade física supervisionada por profissionais de saúde?",
  },
  {
    id: "q2",
    text: "Você sente dores no peito quando pratica atividade física?",
  },
  {
    id: "q3",
    text: "No último mês, você sentiu dores no peito quando praticou atividade física?",
  },
  {
    id: "q4",
    text: "Você apresenta desequilíbrio devido à tontura e/ou perda de consciência?",
  },
  {
    id: "q5",
    text: "Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade física?",
  },
  {
    id: "q6",
    text: "Você toma atualmente algum medicamento para pressão arterial e/ou problema de coração?",
  },
  {
    id: "q7",
    text: "Sabe de alguma outra razão pela qual você não deve praticar atividade física?",
  },
];

/** Aluno planilha = role plan ou aguardando aprovação de planilha. */
export function isPlanilhaStudent(profile) {
  if (!profile) return false;
  return profile.role === "plan" || profile.plan_status === "pending";
}

export function healthStatusFromProfile(profile) {
  if (!isPlanilhaStudent(profile)) {
    return { label: "—", code: "na", needsParq: false, pendingReview: false, apt: false };
  }
  if (profile.health_approved_at) {
    return { label: "Apto", code: "apt", needsParq: false, pendingReview: false, apt: true };
  }
  if (profile.parq_submitted_at) {
    return {
      label: "Não apto",
      code: "not_apt",
      needsParq: false,
      pendingReview: true,
      apt: false,
    };
  }
  return {
    label: "Não apto",
    code: "not_apt",
    needsParq: true,
    pendingReview: false,
    apt: false,
  };
}

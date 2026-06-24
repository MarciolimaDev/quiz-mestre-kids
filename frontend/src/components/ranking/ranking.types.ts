export type RankingEntry = {
  posicao: number;
  aluno_id: number;
  nome: string;
  apelido: string;
  avatar: string | null;
  turma: string;
  pontuacao: number;
  acertos: number;
  erros: number;
  tempo_gasto_segundos: number;
  rodadas: number;
};

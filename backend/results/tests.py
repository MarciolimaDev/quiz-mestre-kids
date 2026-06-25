from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from questions.models import Alternativa, Materia, Pergunta
from quizzes.models import Categoria, Quiz, Turma
from students.models import Aluno

from .models import ParticipanteSessao, RespostaAluno, Resultado, SessaoQuiz


class FluxoQuizTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        categoria = Categoria.objects.create(nome="Conhecimentos gerais")
        cls.turma = Turma.objects.create(serie="5º ano", nome="A", ano_letivo=2026)
        cls.quiz = Quiz.objects.create(
            titulo="Quiz da turma",
            categoria=categoria,
            turma=cls.turma,
            tempo_limite_segundos=300,
            quantidade_perguntas=1,
            pontos_por_acerto=10,
        )
        materia = Materia.objects.create(nome="Matemática")
        cls.pergunta = Pergunta.objects.create(
            quiz=cls.quiz,
            materia=materia,
            enunciado="Quanto é 2 + 2?",
        )
        cls.correta = Alternativa.objects.create(
            pergunta=cls.pergunta,
            texto="4",
            correta=True,
            ordem=1,
        )
        cls.errada = Alternativa.objects.create(
            pergunta=cls.pergunta,
            texto="5",
            ordem=2,
        )

    def criar_participante(self, nome="Ana", sessao=None):
        aluno = Aluno.objects.create(nome=nome, turma=self.turma)
        sessao = sessao or SessaoQuiz.objects.create(quiz=self.quiz, turma=self.turma)
        return ParticipanteSessao.objects.create(sessao=sessao, aluno=aluno)

    def test_participante_comeca_com_resultado_zerado(self):
        participante = self.criar_participante()

        resultado = Resultado.objects.get(participante=participante)

        self.assertEqual(resultado.pontuacao, 0)
        self.assertEqual(resultado.acertos, 0)
        self.assertEqual(resultado.erros, 0)

    def test_resposta_atualiza_resultado_e_ranking(self):
        participante = self.criar_participante()
        outro_participante = self.criar_participante(
            nome="Beto",
            sessao=participante.sessao,
        )

        resposta = RespostaAluno.objects.create(
            participante=participante,
            pergunta=self.pergunta,
            alternativa=self.correta,
            tempo_gasto_segundos=7,
        )
        RespostaAluno.objects.create(
            participante=outro_participante,
            pergunta=self.pergunta,
            alternativa=self.errada,
            tempo_gasto_segundos=5,
        )

        resposta.refresh_from_db()
        resultado = participante.resultado
        resultado.refresh_from_db()
        self.assertTrue(resposta.correta)
        self.assertEqual(resposta.pontos, 10)
        self.assertEqual(resultado.pontuacao, 10)
        self.assertEqual(resultado.acertos, 1)
        self.assertEqual(resultado.erros, 0)
        self.assertEqual(resultado.tempo_gasto_segundos, 7)
        self.assertEqual(
            list(participante.sessao.ranking()),
            [resultado, outro_participante.resultado],
        )

    def test_alternativa_de_outra_pergunta_e_rejeitada(self):
        participante = self.criar_participante()
        outra_pergunta = Pergunta.objects.create(
            quiz=self.quiz,
            materia=self.pergunta.materia,
            enunciado="Quanto é 3 + 3?",
            ordem=2,
        )
        outra_alternativa = Alternativa.objects.create(
            pergunta=outra_pergunta,
            texto="6",
            correta=True,
        )

        with self.assertRaises(ValidationError):
            RespostaAluno.objects.create(
                participante=participante,
                pergunta=self.pergunta,
                alternativa=outra_alternativa,
            )


class GameApiTests(APITestCase):
    def setUp(self):
        user = User.objects.create_user(
            email="jogo@escola.com",
            first_name="Professor",
            last_name="Jogo",
            password="SenhaForte#2026",
        )
        self.client.force_authenticate(user)
        categoria = Categoria.objects.create(nome="Matemática API")
        self.turma = Turma.objects.create(serie="4º ano", nome="B", ano_letivo=2026)
        self.quiz = Quiz.objects.create(
            titulo="Frações API",
            categoria=categoria,
            turma=self.turma,
            tempo_limite_segundos=300,
            quantidade_perguntas=2,
            pontos_por_acerto=10,
            embaralhar_perguntas=False,
        )
        materia = Materia.objects.create(nome="Matemática API")
        self.pergunta1 = Pergunta.objects.create(
            quiz=self.quiz,
            materia=materia,
            enunciado="Quanto é 2 + 2?",
            ordem=1,
        )
        self.correta = Alternativa.objects.create(
            pergunta=self.pergunta1,
            texto="4",
            correta=True,
            ordem=1,
        )
        Alternativa.objects.create(pergunta=self.pergunta1, texto="5", ordem=2)
        self.pergunta2 = Pergunta.objects.create(
            quiz=self.quiz,
            materia=materia,
            enunciado="Quanto é 3 + 3?",
            ordem=2,
        )
        Alternativa.objects.create(
            pergunta=self.pergunta2,
            texto="6",
            correta=True,
            ordem=1,
        )
        Alternativa.objects.create(pergunta=self.pergunta2, texto="7", ordem=2)
        self.ana = Aluno.objects.create(nome="Ana", turma=self.turma)
        self.beto = Aluno.objects.create(nome="Beto", turma=self.turma)

    def test_fluxo_completo_da_rodada(self):
        inicio = self.client.post("/api/jogo/iniciar/", {"quiz_id": self.quiz.id}, format="json")
        self.assertEqual(inicio.status_code, status.HTTP_201_CREATED, inicio.data)
        self.assertEqual(len(inicio.data["participantes"]), 2)
        self.assertEqual(inicio.data["pergunta"]["id"], self.pergunta1.id)
        self.assertEqual(inicio.data["aluno_atual_id"], self.ana.id)

        selecao = self.client.post(
            "/api/jogo/selecionar-aluno/",
            {"sessao_id": inicio.data["sessao_id"], "aluno_id": self.beto.id},
            format="json",
        )
        resposta = self.client.post(
            "/api/jogo/responder/",
            {
                "sessao_id": inicio.data["sessao_id"],
                "alternativa_id": self.correta.id,
                "tempo_gasto_segundos": 8,
            },
            format="json",
        )
        proxima = self.client.post(
            "/api/jogo/proxima/",
            {"sessao_id": inicio.data["sessao_id"]},
            format="json",
        )

        self.assertEqual(selecao.data["aluno_atual_id"], self.beto.id)
        self.assertTrue(resposta.data["resposta"]["correta"])
        self.assertEqual(resposta.data["ranking"][0]["pontuacao"], 10)
        self.assertEqual(resposta.data["ranking"][0]["aluno_id"], self.beto.id)
        self.assertEqual(proxima.data["pergunta"]["id"], self.pergunta2.id)
        self.assertEqual(proxima.data["aluno_atual_id"], self.ana.id)

        geral = self.client.get("/api/rankings/geral/")
        self.assertEqual(geral.status_code, status.HTTP_200_OK)
        self.assertEqual(geral.data[0]["aluno_id"], self.beto.id)
        self.assertEqual(geral.data[0]["pontuacao"], 10)

    def test_sorteio_persiste_ordem_sem_repeticao(self):
        self.quiz.embaralhar_perguntas = True
        self.quiz.save(update_fields=("embaralhar_perguntas",))

        response = self.client.post("/api/jogo/iniciar/", {"quiz_id": self.quiz.id}, format="json")
        sessao = SessaoQuiz.objects.get(pk=response.data["sessao_id"])

        self.assertEqual(len(sessao.ordem_perguntas), 2)
        self.assertEqual(len(set(sessao.ordem_perguntas)), 2)
        self.assertEqual(set(sessao.ordem_perguntas), {self.pergunta1.id, self.pergunta2.id})

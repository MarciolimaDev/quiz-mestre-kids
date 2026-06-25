import json

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from quizzes.models import Categoria, Quiz, Turma
from results.models import ParticipanteSessao, RespostaAluno, SessaoQuiz
from students.models import Aluno

from .models import Materia, Pergunta


GIF_1X1 = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
    b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00"
    b"\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


class PerguntaApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="teste@escola.com",
            first_name="Teste",
            last_name="Professor",
            password="SenhaForte#2026",
        )
        categoria = Categoria.objects.create(nome="Geral")
        cls.quiz = Quiz.objects.create(
            titulo="Quiz de teste",
            categoria=categoria,
            tempo_limite_segundos=60,
            quantidade_perguntas=10,
        )
        cls.materia = Materia.objects.create(nome="Matemática")

    def payload(self):
        return {
            "quiz": self.quiz.id,
            "materia": self.materia.id,
            "enunciado": "Quanto é 2 + 2?",
            "nivel": "facil",
            "ativa": True,
            "alternativas": [
                {"texto": "4", "correta": True, "ordem": 1},
                {"texto": "5", "correta": False, "ordem": 2},
            ],
        }

    def setUp(self):
        self.client.force_authenticate(self.user)

    def test_cria_pergunta_com_alternativas(self):
        response = self.client.post("/api/perguntas/", self.payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        pergunta = Pergunta.objects.get()
        self.assertEqual(pergunta.ordem, 1)
        self.assertEqual(pergunta.alternativas.count(), 2)
        self.assertEqual(pergunta.alternativas.get(correta=True).texto, "4")

    def test_cria_pergunta_com_imagem_multipart(self):
        payload = self.payload()
        payload["alternativas"] = json.dumps(payload["alternativas"])
        payload["imagem"] = SimpleUploadedFile("pergunta.gif", GIF_1X1, content_type="image/gif")

        response = self.client.post("/api/perguntas/", payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        pergunta = Pergunta.objects.get()
        self.assertEqual(pergunta.alternativas.count(), 2)
        self.assertTrue(pergunta.imagem.name.endswith(".webp"))

    def test_rejeita_pergunta_sem_uma_unica_resposta_correta(self):
        payload = self.payload()
        payload["alternativas"][1]["correta"] = True

        response = self.client.post("/api/perguntas/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Pergunta.objects.count(), 0)

    def test_edita_pergunta_com_alternativa_ja_usada_em_resposta(self):
        criada = self.client.post("/api/perguntas/", self.payload(), format="json")
        pergunta = Pergunta.objects.get()
        alternativas = list(pergunta.alternativas.order_by("ordem"))
        turma = Turma.objects.create(serie="4º ano", nome="A", ano_letivo=2026)
        aluno = Aluno.objects.create(nome="Luiz João", turma=turma)
        sessao = SessaoQuiz.objects.create(quiz=self.quiz, turma=turma)
        participante = ParticipanteSessao.objects.create(sessao=sessao, aluno=aluno)
        RespostaAluno.objects.create(
            participante=participante,
            pergunta=pergunta,
            alternativa=alternativas[0],
        )

        response = self.client.patch(
            f"/api/perguntas/{criada.data['id']}/",
            {
                "quiz": self.quiz.id,
                "materia": self.materia.id,
                "enunciado": "Quanto é 3 + 3?",
                "nivel": "medio",
                "ativa": True,
                "alternativas": [
                    {"id": alternativas[0].id, "texto": "6", "correta": False, "ordem": 1},
                    {"id": alternativas[1].id, "texto": "7", "correta": True, "ordem": 2},
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        pergunta.refresh_from_db()
        self.assertEqual(pergunta.nivel, "medio")
        self.assertEqual(pergunta.alternativas.count(), 2)
        self.assertEqual(pergunta.alternativas.get(correta=True).texto, "7")
        self.assertEqual(RespostaAluno.objects.count(), 1)

    def test_lista_e_exclui_pergunta(self):
        criada = self.client.post("/api/perguntas/", self.payload(), format="json")

        listagem = self.client.get("/api/perguntas/")
        exclusao = self.client.delete(f"/api/perguntas/{criada.data['id']}/")

        self.assertEqual(listagem.status_code, status.HTTP_200_OK)
        self.assertEqual(len(listagem.data), 1)
        self.assertEqual(exclusao.status_code, status.HTTP_204_NO_CONTENT)

    def test_rotas_aceitam_url_sem_barra_final(self):
        materia = self.client.get("/api/materias")
        perguntas = self.client.get("/api/perguntas")

        self.assertEqual(materia.status_code, status.HTTP_200_OK)
        self.assertEqual(perguntas.status_code, status.HTTP_200_OK)

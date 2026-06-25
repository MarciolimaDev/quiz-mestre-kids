from rest_framework import status
from rest_framework.test import APITestCase

from quizzes.models import Categoria, Quiz
from accounts.models import User

from .models import Materia, Pergunta


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

    def test_rejeita_pergunta_sem_uma_unica_resposta_correta(self):
        payload = self.payload()
        payload["alternativas"][1]["correta"] = True

        response = self.client.post("/api/perguntas/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Pergunta.objects.count(), 0)

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

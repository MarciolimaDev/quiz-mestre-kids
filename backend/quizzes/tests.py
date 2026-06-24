from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Categoria, Quiz, Turma


class QuizApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="quiz@escola.com",
            first_name="Professor",
            last_name="Quiz",
            password="SenhaForte#2026",
        )
        self.client.force_authenticate(self.user)

    def test_cria_quiz_e_categoria_pelo_modal(self):
        response = self.client.post(
            "/api/quizzes/",
            {
                "titulo": "Frações",
                "descricao": "Quiz do quarto ano",
                "categoria_nome": "Matemática",
                "turma_serie": "4º ano",
                "turma_nome": "A",
                "turma_ano_letivo": 2026,
                "tempo_limite_segundos": 300,
                "quantidade_perguntas": 10,
                "embaralhar_perguntas": True,
                "pontos_por_acerto": 10,
                "ativo": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Quiz.objects.get().titulo, "Frações")
        self.assertEqual(Categoria.objects.get().nome, "Matemática")
        self.assertEqual(Turma.objects.get().serie, "4º ano")
        self.assertEqual(Quiz.objects.get().turma, Turma.objects.get())
        self.assertEqual(response.data["categoria_nome"], "Matemática")
        self.assertEqual(response.data["turma_label"], "4º ano - A (2026)")

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from quizzes.models import Turma

from .models import Aluno, Avatar


GIF_1X1 = (
    b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
    b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00"
    b"\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
)


class AlunoApiTests(APITestCase):
    def setUp(self):
        user = User.objects.create_user(
            email="alunos@escola.com",
            first_name="Professor",
            last_name="Alunos",
            password="SenhaForte#2026",
        )
        self.client.force_authenticate(user)
        self.turma = Turma.objects.create(serie="4º ano", nome="A", ano_letivo=2026)

    def test_cria_lista_e_exclui_aluno(self):
        avatar = Avatar.objects.create(
            nome="Exploradora",
            imagem=SimpleUploadedFile("avatar.gif", GIF_1X1, content_type="image/gif"),
        )
        criada = self.client.post(
            "/api/alunos/",
            {
                "nome": "Ana Paula",
                "apelido": "Ana",
                "avatar_url": "https://example.com/ana.png",
                "avatar": avatar.id,
                "turma": self.turma.id,
                "ativo": True,
            },
            format="json",
        )
        listagem = self.client.get("/api/alunos/")
        exclusao = self.client.delete(f"/api/alunos/{criada.data['id']}/")

        self.assertEqual(criada.status_code, status.HTTP_201_CREATED, criada.data)
        self.assertEqual(criada.data["turma_label"], "4º ano - A (2026)")
        self.assertEqual(criada.data["avatar_nome"], "Exploradora")
        self.assertEqual(len(listagem.data), 1)
        self.assertEqual(exclusao.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Aluno.objects.count(), 0)

    def test_faz_upload_e_lista_avatar(self):
        response = self.client.post(
            "/api/avatares/",
            {
                "nome": "Astronauta azul",
                "imagem": SimpleUploadedFile("azul.gif", GIF_1X1, content_type="image/gif"),
                "ativo": True,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Avatar.objects.get().nome, "Astronauta azul")
        self.assertIn("/media/avatars/", response.data["imagem"])

    def test_cria_turma_pela_api(self):
        response = self.client.post(
            "/api/turmas/",
            {"serie": "5º ano", "nome": "B", "ano_letivo": 2026, "ativa": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data["label"], "5º ano - B (2026)")

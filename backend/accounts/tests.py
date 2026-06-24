from rest_framework import status
from rest_framework.test import APITestCase
from django.core.exceptions import FieldDoesNotExist

from .models import User


class AuthApiTests(APITestCase):
    def registration_payload(self):
        return {
            "email": "professor@escola.com",
            "first_name": "Maria",
            "last_name": "Silva",
            "password": "SenhaForte#2026",
            "password_confirm": "SenhaForte#2026",
        }

    def test_registro_cria_usuario_sem_username_e_autentica(self):
        response = self.client.post("/api/auth/register/", self.registration_payload(), format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get()
        self.assertEqual(user.email, "professor@escola.com")
        with self.assertRaises(FieldDoesNotExist):
            user._meta.get_field("username")
        self.assertIn("quiz_access", response.cookies)

    def test_login_e_me(self):
        User.objects.create_user(
            email="professor@escola.com",
            first_name="Maria",
            last_name="Silva",
            password="SenhaForte#2026",
        )

        login = self.client.post(
            "/api/auth/login/",
            {"email": "professor@escola.com", "password": "SenhaForte#2026"},
            format="json",
        )
        me = self.client.get("/api/auth/me/")

        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["nome_completo"], "Maria Silva")

    def test_api_protegida_rejeita_usuario_anonimo(self):
        response = self.client.get("/api/perguntas/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

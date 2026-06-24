from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AlunoViewSet, AvatarViewSet


router = DefaultRouter()
router.register("alunos", AlunoViewSet, basename="aluno")
router.register("avatares", AvatarViewSet, basename="avatar")

urlpatterns = [path("", include(router.urls))]

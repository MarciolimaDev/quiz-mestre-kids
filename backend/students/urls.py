from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AlunoViewSet, AvatarViewSet


class OptionalSlashDefaultRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = "/?"


router = OptionalSlashDefaultRouter()
router.register("alunos", AlunoViewSet, basename="aluno")
router.register("avatares", AvatarViewSet, basename="avatar")

urlpatterns = [path("", include(router.urls))]

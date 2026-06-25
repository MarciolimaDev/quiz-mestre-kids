from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MateriaViewSet, PerguntaViewSet


class OptionalSlashDefaultRouter(DefaultRouter):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = "/?"


router = OptionalSlashDefaultRouter()
router.register("materias", MateriaViewSet, basename="materia")
router.register("perguntas", PerguntaViewSet, basename="pergunta")

urlpatterns = [
    path("", include(router.urls)),
]

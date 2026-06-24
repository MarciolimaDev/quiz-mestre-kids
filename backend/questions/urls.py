from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MateriaViewSet, PerguntaViewSet


router = DefaultRouter()
router.register("materias", MateriaViewSet, basename="materia")
router.register("perguntas", PerguntaViewSet, basename="pergunta")

urlpatterns = [
    path("", include(router.urls)),
]

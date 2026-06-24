from rest_framework import filters, viewsets

from .models import Materia, Pergunta
from .serializers import MateriaSerializer, PerguntaSerializer


class MateriaViewSet(viewsets.ModelViewSet):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer


class PerguntaViewSet(viewsets.ModelViewSet):
    serializer_class = PerguntaSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("enunciado", "materia__nome", "quiz__titulo")
    ordering_fields = ("ordem", "criada_em", "nivel")

    def get_queryset(self):
        queryset = Pergunta.objects.select_related("quiz", "materia").prefetch_related(
            "alternativas"
        )
        quiz_id = self.request.query_params.get("quiz")
        if quiz_id:
            queryset = queryset.filter(quiz_id=quiz_id)
        return queryset

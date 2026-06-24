from rest_framework import filters, viewsets

from .models import Aluno, Avatar
from .serializers import AlunoSerializer, AvatarSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class AvatarViewSet(viewsets.ModelViewSet):
    queryset = Avatar.objects.all()
    serializer_class = AvatarSerializer


class AlunoViewSet(viewsets.ModelViewSet):
    serializer_class = AlunoSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("nome", "apelido", "turma__nome", "turma__serie")
    ordering_fields = ("nome", "criado_em")

    def get_queryset(self):
        queryset = Aluno.objects.select_related("turma", "avatar")
        turma_id = self.request.query_params.get("turma")
        ativo = self.request.query_params.get("ativo")
        if turma_id:
            queryset = queryset.filter(turma_id=turma_id)
        if ativo in ("true", "false"):
            queryset = queryset.filter(ativo=ativo == "true")
        return queryset

    @action(detail=True, methods=["post"], url_path="pontos")
    def ajustar_pontos(self, request, pk=None):
        """Ajusta os pontos do aluno. Espera JSON: {"delta": 5} ou {"delta": -3}."""
        aluno = self.get_object()
        delta = request.data.get("delta")
        try:
            delta = int(delta)
        except (TypeError, ValueError):
            return Response({"detail": "delta inválido"}, status=status.HTTP_400_BAD_REQUEST)
        aluno.pontos = (aluno.pontos or 0) + delta
        aluno.save(update_fields=["pontos"])
        return Response({"id": aluno.id, "pontos": aluno.pontos})

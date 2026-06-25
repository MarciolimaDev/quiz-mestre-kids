import logging

from django.db.models import F, IntegerField, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import filters, viewsets

from .models import Aluno, Avatar
from .serializers import AlunoSerializer, AvatarSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


logger = logging.getLogger(__name__)


class AvatarViewSet(viewsets.ModelViewSet):
    queryset = Avatar.objects.all()
    serializer_class = AvatarSerializer

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception:
            logger.exception("Falha ao criar avatar e salvar imagem no storage.")
            raise


class AlunoViewSet(viewsets.ModelViewSet):
    serializer_class = AlunoSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("nome", "apelido", "turma__nome", "turma__serie")
    ordering_fields = ("nome", "criado_em")

    def get_queryset(self):
        queryset = (
            Aluno.objects.select_related("turma", "avatar")
            .annotate(
                pontos_quiz=Coalesce(
                    Sum("participacoes__resultado__pontuacao"),
                    Value(0),
                    output_field=IntegerField(),
                ),
            )
            .annotate(pontos_total=F("pontos") + F("pontos_quiz"))
        )
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
        aluno = self.get_queryset().get(pk=aluno.pk)
        return Response(
            {
                "id": aluno.id,
                "pontos": aluno.pontos_total or 0,
                "pontos_comportamento": aluno.pontos or 0,
                "pontos_quiz": aluno.pontos_quiz or 0,
            }
        )

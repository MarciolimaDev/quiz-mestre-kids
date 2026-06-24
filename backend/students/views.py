from rest_framework import filters, viewsets

from .models import Aluno, Avatar
from .serializers import AlunoSerializer, AvatarSerializer


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

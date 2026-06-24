from rest_framework import serializers

from .models import Aluno, Avatar


class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ("id", "nome", "imagem", "ativo", "criado_em")
        read_only_fields = ("criado_em",)

    def validate_imagem(self, imagem):
        if imagem.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("A imagem deve ter no máximo 5 MB.")
        return imagem


class AlunoSerializer(serializers.ModelSerializer):
    turma_label = serializers.CharField(source="turma.__str__", read_only=True)
    avatar_nome = serializers.CharField(source="avatar.nome", read_only=True)
    avatar_imagem = serializers.ImageField(source="avatar.imagem", read_only=True)
    pontos = serializers.IntegerField(read_only=True)

    class Meta:
        model = Aluno
        fields = (
            "id",
            "nome",
            "pontos",
            "apelido",
            "avatar",
            "avatar_nome",
            "avatar_imagem",
            "avatar_url",
            "turma",
            "turma_label",
            "ativo",
            "criado_em",
        )
        read_only_fields = ("criado_em",)

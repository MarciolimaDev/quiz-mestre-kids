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
    pontos = serializers.SerializerMethodField()
    pontos_comportamento = serializers.IntegerField(source="pontos", read_only=True)
    pontos_quiz = serializers.SerializerMethodField()

    class Meta:
        model = Aluno
        fields = (
            "id",
            "nome",
            "pontos",
            "pontos_comportamento",
            "pontos_quiz",
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

    def get_pontos(self, obj):
        if hasattr(obj, "pontos_total"):
            return obj.pontos_total or 0
        return obj.pontos or 0

    def get_pontos_quiz(self, obj):
        return getattr(obj, "pontos_quiz", 0) or 0

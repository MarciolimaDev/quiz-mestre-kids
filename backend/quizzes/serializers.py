from rest_framework import serializers

from .models import Categoria, Quiz, Turma


class TurmaSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()

    class Meta:
        model = Turma
        fields = ("id", "serie", "nome", "ano_letivo", "ativa", "label")

    def get_label(self, obj):
        return str(obj)


class QuizResumoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source="categoria.nome")
    turma_label = serializers.SerializerMethodField()
    turma_serie = serializers.CharField(write_only=True, required=False, allow_blank=True)
    turma_nome = serializers.CharField(write_only=True, required=False, allow_blank=True)
    turma_ano_letivo = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Quiz
        fields = (
            "id",
            "titulo",
            "descricao",
            "categoria_nome",
            "turma_label",
            "turma_serie",
            "turma_nome",
            "turma_ano_letivo",
            "tempo_limite_segundos",
            "quantidade_perguntas",
            "embaralhar_perguntas",
            "pontos_por_acerto",
            "ativo",
        )

    def get_turma_label(self, obj):
        return str(obj.turma) if obj.turma else None

    def validate(self, attrs):
        turma_fields = (
            attrs.get("turma_serie"),
            attrs.get("turma_nome"),
            attrs.get("turma_ano_letivo"),
        )
        if any(turma_fields) and not all(turma_fields):
            raise serializers.ValidationError(
                "Para vincular uma turma, informe série, nome e ano letivo."
            )
        return attrs

    def create(self, validated_data):
        categoria_data = validated_data.pop("categoria")
        categoria, _ = Categoria.objects.get_or_create(nome=categoria_data["nome"].strip())
        serie = validated_data.pop("turma_serie", "").strip()
        nome = validated_data.pop("turma_nome", "").strip()
        ano_letivo = validated_data.pop("turma_ano_letivo", None)
        turma = None
        if serie and nome and ano_letivo:
            turma, _ = Turma.objects.get_or_create(
                serie=serie,
                nome=nome,
                ano_letivo=ano_letivo,
            )
        return Quiz.objects.create(categoria=categoria, turma=turma, **validated_data)

import json

from django.db import transaction
from django.db.models import Max
from rest_framework import serializers

from core.image_processing import image_to_webp

from .models import Alternativa, Materia, Pergunta


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ("id", "nome")


class AlternativaSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Alternativa
        fields = ("id", "texto", "correta", "ordem")


class PerguntaSerializer(serializers.ModelSerializer):
    imagem = serializers.ImageField(required=False, allow_null=True, use_url=True)
    alternativas = AlternativaSerializer(many=True)
    quiz_titulo = serializers.CharField(source="quiz.titulo", read_only=True)
    materia_nome = serializers.CharField(source="materia.nome", read_only=True)
    ordem = serializers.IntegerField(required=False, min_value=1)

    class Meta:
        model = Pergunta
        fields = (
            "id",
            "quiz",
            "quiz_titulo",
            "imagem",
            "materia",
            "materia_nome",
            "enunciado",
            "nivel",
            "ordem",
            "ativa",
            "criada_em",
            "alternativas",
        )
        read_only_fields = ("criada_em",)
        validators = []

    def to_internal_value(self, data):
        return super().to_internal_value(self._normalize_multipart_data(data))

    def _normalize_multipart_data(self, data):
        if not hasattr(data, "get"):
            return data

        normalized = {field: data.get(field) for field in self.Meta.fields if field in data}
        alternativas = data.get("alternativas")

        if isinstance(alternativas, str):
            try:
                normalized["alternativas"] = json.loads(alternativas)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError({"alternativas": "Formato inválido para alternativas."}) from exc
        elif isinstance(alternativas, list) and len(alternativas) == 1 and isinstance(alternativas[0], str):
            try:
                normalized["alternativas"] = json.loads(alternativas[0])
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError({"alternativas": "Formato inválido para alternativas."}) from exc

        return normalized

    def validate_alternativas(self, alternativas):
        if len(alternativas) < 2:
            raise serializers.ValidationError("Cadastre pelo menos duas alternativas.")
        if sum(bool(item.get("correta")) for item in alternativas) != 1:
            raise serializers.ValidationError("Marque exatamente uma alternativa correta.")
        ordens = [item["ordem"] for item in alternativas]
        if len(ordens) != len(set(ordens)):
            raise serializers.ValidationError("As ordens das alternativas não podem se repetir.")
        if any(not item["texto"].strip() for item in alternativas):
            raise serializers.ValidationError("O texto das alternativas é obrigatório.")
        return alternativas

    def validate_imagem(self, imagem):
        if not imagem:
            return imagem
        if imagem.size > 8 * 1024 * 1024:
            raise serializers.ValidationError("A imagem deve ter no máximo 8 MB.")
        try:
            return image_to_webp(
                imagem,
                prefix="pergunta",
                max_size=(1280, 720),
                quality=84,
            )
        except Exception as exc:
            raise serializers.ValidationError("Não foi possível processar a imagem enviada.") from exc

    def validate(self, attrs):
        quiz = attrs.get("quiz", getattr(self.instance, "quiz", None))
        ordem = attrs.get("ordem")
        if quiz and ordem:
            existentes = Pergunta.objects.filter(quiz=quiz, ordem=ordem)
            if self.instance:
                existentes = existentes.exclude(pk=self.instance.pk)
            if existentes.exists():
                raise serializers.ValidationError(
                    {"ordem": "Já existe uma pergunta nesta posição para o quiz."}
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        alternativas = validated_data.pop("alternativas")
        if "ordem" not in validated_data:
            ultima_ordem = (
                Pergunta.objects.filter(quiz=validated_data["quiz"])
                .aggregate(maior=Max("ordem"))["maior"]
                or 0
            )
            validated_data["ordem"] = ultima_ordem + 1
        pergunta = Pergunta.objects.create(**validated_data)
        Alternativa.objects.bulk_create(
            Alternativa(pergunta=pergunta, **item) for item in alternativas
        )
        return pergunta

    @transaction.atomic
    def update(self, instance, validated_data):
        alternativas = validated_data.pop("alternativas", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.full_clean()
        instance.save()
        if alternativas is not None:
            self._update_alternativas(instance, alternativas)
        return instance

    def _update_alternativas(self, pergunta, alternativas):
        existing = {alternative.id: alternative for alternative in pergunta.alternativas.all()}

        # Avoid violating the conditional unique constraint while changing which
        # answer is correct. Historical RespostaAluno rows keep their stored
        # correctness/pontos values, but the alternative record is preserved.
        pergunta.alternativas.filter(correta=True).update(correta=False)

        for item in alternativas:
            alternative_id = item.pop("id", None)
            if alternative_id and alternative_id in existing:
                alternative = existing[alternative_id]
                alternative.texto = item["texto"]
                alternative.ordem = item["ordem"]
                alternative.correta = item["correta"]
                alternative.full_clean()
                alternative.save(update_fields=("texto", "ordem", "correta"))
            else:
                Alternativa.objects.create(pergunta=pergunta, **item)

from django.db import transaction
from django.db.models import Max
from rest_framework import serializers

from .models import Alternativa, Materia, Pergunta
import json


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

    def validate_alternativas(self, alternativas):
        # Accept alternativas as JSON string when multipart/form-data is used
        if isinstance(alternativas, str):
            try:
                alternativas = json.loads(alternativas)
            except Exception:
                raise serializers.ValidationError("Formato inválido para alternativas.")
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

    def to_internal_value(self, data):
        # If alternativas was sent as a JSON string in form-data, parse it
        alternativas = data.get("alternativas")
        if isinstance(alternativas, str):
            try:
                parsed = json.loads(alternativas)
                data._mutable = True if hasattr(data, "_mutable") else None
                # For QueryDict (request.POST), assign parsed value
                try:
                    data.setlist("alternativas", parsed)
                except Exception:
                    data["alternativas"] = parsed
            except Exception:
                pass
        return super().to_internal_value(data)

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
            instance.alternativas.all().delete()
            Alternativa.objects.bulk_create(
                Alternativa(pergunta=instance, **item) for item in alternativas
            )
        return instance

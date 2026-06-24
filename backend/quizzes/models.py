from django.core.validators import MinValueValidator
from django.db import models


class Categoria(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True)

    class Meta:
        ordering = ("nome",)
        verbose_name = "categoria"
        verbose_name_plural = "categorias"

    def __str__(self):
        return self.nome


class Turma(models.Model):
    serie = models.CharField(max_length=50, verbose_name="série")
    nome = models.CharField(max_length=50, help_text="Ex.: A, B ou Turma Azul")
    ano_letivo = models.PositiveSmallIntegerField()
    ativa = models.BooleanField(default=True)

    class Meta:
        ordering = ("-ano_letivo", "serie", "nome")
        constraints = [
            models.UniqueConstraint(
                fields=("serie", "nome", "ano_letivo"),
                name="turma_unica_por_ano",
            )
        ]

    def __str__(self):
        return f"{self.serie} - {self.nome} ({self.ano_letivo})"


class Quiz(models.Model):
    titulo = models.CharField(max_length=150)
    descricao = models.TextField(blank=True)
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name="quizzes",
    )
    turma = models.ForeignKey(
        Turma,
        on_delete=models.SET_NULL,
        related_name="quizzes",
        blank=True,
        null=True,
        help_text="Deixe vazio para disponibilizar o quiz a qualquer turma.",
    )
    tempo_limite_segundos = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Tempo total para concluir o quiz.",
    )
    quantidade_perguntas = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1)]
    )
    embaralhar_perguntas = models.BooleanField(
        default=True,
        help_text="Sorteia as perguntas sem repetição a cada nova rodada.",
    )
    pontos_por_acerto = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
    )
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-criado_em",)
        verbose_name_plural = "quizzes"

    def __str__(self):
        return self.titulo

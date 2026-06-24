from django.db import models


class Materia(models.Model):
    nome = models.CharField(max_length=100, unique=True, verbose_name="matéria")

    class Meta:
        ordering = ("nome",)
        verbose_name = "matéria"
        verbose_name_plural = "matérias"

    def __str__(self):
        return self.nome


class Pergunta(models.Model):
    class Nivel(models.TextChoices):
        FACIL = "facil", "Fácil"
        MEDIO = "medio", "Médio"
        DIFICIL = "dificil", "Difícil"

    quiz = models.ForeignKey(
        "quizzes.Quiz",
        on_delete=models.CASCADE,
        related_name="perguntas",
    )
    materia = models.ForeignKey(
        Materia,
        on_delete=models.PROTECT,
        related_name="perguntas",
        verbose_name="matéria",
    )
    enunciado = models.TextField()
    imagem = models.ImageField(
        upload_to="pergunta_imagens/", null=True, blank=True, verbose_name="imagem"
    )
    nivel = models.CharField(max_length=10, choices=Nivel.choices, default=Nivel.FACIL)
    ordem = models.PositiveSmallIntegerField(default=1)
    ativa = models.BooleanField(default=True)
    criada_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("quiz", "ordem", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("quiz", "ordem"),
                name="ordem_pergunta_unica_no_quiz",
            )
        ]

    def __str__(self):
        return self.enunciado[:80]


class Alternativa(models.Model):
    pergunta = models.ForeignKey(
        Pergunta,
        on_delete=models.CASCADE,
        related_name="alternativas",
    )
    texto = models.CharField(max_length=500)
    correta = models.BooleanField(default=False)
    ordem = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ("pergunta", "ordem", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("pergunta", "ordem"),
                name="ordem_alternativa_unica_na_pergunta",
            ),
            models.UniqueConstraint(
                fields=("pergunta",),
                condition=models.Q(correta=True),
                name="apenas_uma_alternativa_correta",
            ),
        ]

    def __str__(self):
        return self.texto[:80]

from django.db import models

from core.upload_paths import avatar_upload_path


class Avatar(models.Model):
    nome = models.CharField(max_length=80, unique=True)
    imagem = models.ImageField(upload_to=avatar_upload_path)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("nome",)

    def __str__(self):
        return self.nome


class Aluno(models.Model):
    nome = models.CharField(max_length=150)
    turma = models.ForeignKey(
        "quizzes.Turma",
        on_delete=models.PROTECT,
        related_name="alunos",
    )
    apelido = models.CharField(max_length=50, blank=True)
    avatar = models.ForeignKey(
        Avatar,
        on_delete=models.SET_NULL,
        related_name="alunos",
        blank=True,
        null=True,
    )
    avatar_url = models.URLField(blank=True, verbose_name="URL do avatar")
    ativo = models.BooleanField(default=True)
    pontos = models.IntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("nome",)
        constraints = [
            models.UniqueConstraint(
                fields=("turma", "nome"),
                name="nome_aluno_unico_na_turma",
            )
        ]

    def __str__(self):
        return self.apelido or self.nome

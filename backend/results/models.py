from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import F, Q


QUESTION_POINTS_BY_LEVEL = {
    "facil": 10,
    "medio": 15,
    "dificil": 20,
}


class SessaoQuiz(models.Model):
    class Status(models.TextChoices):
        AGUARDANDO = "aguardando", "Aguardando"
        EM_ANDAMENTO = "em_andamento", "Em andamento"
        FINALIZADA = "finalizada", "Finalizada"
        CANCELADA = "cancelada", "Cancelada"

    quiz = models.ForeignKey(
        "quizzes.Quiz",
        on_delete=models.PROTECT,
        related_name="sessoes",
    )
    turma = models.ForeignKey(
        "quizzes.Turma",
        on_delete=models.PROTECT,
        related_name="sessoes_quiz",
    )
    pergunta_atual = models.ForeignKey(
        "questions.Pergunta",
        on_delete=models.PROTECT,
        related_name="sessoes_como_pergunta_atual",
        blank=True,
        null=True,
    )
    aluno_atual = models.ForeignKey(
        "students.Aluno",
        on_delete=models.SET_NULL,
        related_name="sessoes_como_aluno_atual",
        blank=True,
        null=True,
    )
    status = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.AGUARDANDO,
    )
    criada_em = models.DateTimeField(auto_now_add=True)
    iniciada_em = models.DateTimeField(blank=True, null=True)
    pergunta_iniciada_em = models.DateTimeField(blank=True, null=True)
    ordem_perguntas = models.JSONField(
        default=list,
        blank=True,
        help_text="IDs das perguntas na ordem definida para esta rodada.",
    )
    finalizada_em = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ("-criada_em",)
        verbose_name = "sessão de quiz"
        verbose_name_plural = "sessões de quiz"
        constraints = [
            models.CheckConstraint(
                condition=Q(finalizada_em__isnull=True) | Q(iniciada_em__isnull=False),
                name="sessao_finalizada_deve_ter_inicio",
            ),
            models.CheckConstraint(
                condition=(
                    Q(finalizada_em__isnull=True)
                    | Q(finalizada_em__gte=F("iniciada_em"))
                ),
                name="fim_sessao_apos_inicio",
            ),
        ]

    def __str__(self):
        return f"{self.quiz} - {self.turma} - {self.get_status_display()}"

    def ranking(self):
        return (
            Resultado.objects.filter(participante__sessao=self)
            .select_related("participante__aluno")
            .order_by("-pontuacao", "tempo_gasto_segundos", "registrado_em")
        )


class ParticipanteSessao(models.Model):
    sessao = models.ForeignKey(
        SessaoQuiz,
        on_delete=models.CASCADE,
        related_name="participantes",
        verbose_name="sessão",
    )
    aluno = models.ForeignKey(
        "students.Aluno",
        on_delete=models.PROTECT,
        related_name="participacoes",
    )
    entrou_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("entrou_em",)
        constraints = [
            models.UniqueConstraint(
                fields=("sessao", "aluno"),
                name="aluno_unico_por_sessao",
            )
        ]

    def clean(self):
        if self.sessao_id and self.aluno_id and self.sessao.turma_id != self.aluno.turma_id:
            raise ValidationError({"aluno": "O aluno deve pertencer à turma da sessão."})

    def save(self, *args, **kwargs):
        self.full_clean()
        resultado = super().save(*args, **kwargs)
        Resultado.objects.get_or_create(participante=self)
        return resultado

    def __str__(self):
        return f"{self.aluno} em {self.sessao}"


class RespostaAluno(models.Model):
    participante = models.ForeignKey(
        ParticipanteSessao,
        on_delete=models.CASCADE,
        related_name="respostas",
    )
    pergunta = models.ForeignKey(
        "questions.Pergunta",
        on_delete=models.PROTECT,
        related_name="respostas_dos_alunos",
    )
    alternativa = models.ForeignKey(
        "questions.Alternativa",
        on_delete=models.PROTECT,
        related_name="respostas_dos_alunos",
    )
    correta = models.BooleanField(editable=False)
    pontos = models.PositiveSmallIntegerField(default=0, editable=False)
    tempo_gasto_segundos = models.PositiveIntegerField(default=0)
    respondida_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("respondida_em",)
        constraints = [
            models.UniqueConstraint(
                fields=("participante", "pergunta"),
                name="uma_resposta_por_aluno_e_pergunta",
            )
        ]

    def clean(self):
        errors = {}
        if self.alternativa_id and self.pergunta_id:
            if self.alternativa.pergunta_id != self.pergunta_id:
                errors["alternativa"] = "A alternativa não pertence à pergunta."
        if self.participante_id and self.pergunta_id:
            quiz_id = self.participante.sessao.quiz_id
            if self.pergunta.quiz_id != quiz_id:
                errors["pergunta"] = "A pergunta não pertence ao quiz desta sessão."
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.correta = self.alternativa.correta
        self.pontos = QUESTION_POINTS_BY_LEVEL.get(self.pergunta.nivel, 0) if self.correta else 0
        self.full_clean()
        resultado = super().save(*args, **kwargs)
        Resultado.atualizar_para(self.participante)
        return resultado

    def delete(self, *args, **kwargs):
        participante = self.participante
        resultado = super().delete(*args, **kwargs)
        Resultado.atualizar_para(participante)
        return resultado

    def __str__(self):
        return f"{self.participante.aluno}: {self.pergunta}"


class Resultado(models.Model):
    participante = models.OneToOneField(
        ParticipanteSessao,
        on_delete=models.CASCADE,
        related_name="resultado",
    )
    pontuacao = models.PositiveIntegerField(default=0, verbose_name="pontuação")
    acertos = models.PositiveSmallIntegerField(default=0)
    erros = models.PositiveSmallIntegerField(default=0)
    tempo_gasto_segundos = models.PositiveIntegerField(default=0)
    registrado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-pontuacao", "tempo_gasto_segundos", "registrado_em")
        constraints = [
            models.CheckConstraint(
                condition=Q(acertos__gte=0) & Q(erros__gte=0),
                name="totais_resultado_nao_negativos",
            )
        ]

    @property
    def aluno(self):
        return self.participante.aluno

    @property
    def quiz(self):
        return self.participante.sessao.quiz

    @classmethod
    def atualizar_para(cls, participante):
        respostas = participante.respostas.all()
        totais = respostas.aggregate(
            pontuacao=models.Sum("pontos", default=0),
            tempo_gasto_segundos=models.Sum("tempo_gasto_segundos", default=0),
            acertos=models.Count("id", filter=Q(correta=True)),
            erros=models.Count("id", filter=Q(correta=False)),
        )
        resultado, _ = cls.objects.update_or_create(
            participante=participante,
            defaults=totais,
        )
        return resultado

    def __str__(self):
        return f"{self.aluno} - {self.pontuacao} pontos"

from django.contrib import admin

from .models import ParticipanteSessao, RespostaAluno, Resultado, SessaoQuiz


class ParticipanteInline(admin.TabularInline):
    model = ParticipanteSessao
    extra = 0


@admin.register(SessaoQuiz)
class SessaoQuizAdmin(admin.ModelAdmin):
    list_display = ("quiz", "turma", "status", "criada_em", "iniciada_em")
    list_filter = ("status", "turma", "quiz")
    inlines = (ParticipanteInline,)


@admin.register(RespostaAluno)
class RespostaAlunoAdmin(admin.ModelAdmin):
    list_display = ("participante", "pergunta", "correta", "pontos", "respondida_em")
    list_filter = ("correta", "participante__sessao")
    readonly_fields = ("correta", "pontos", "respondida_em")


@admin.register(Resultado)
class ResultadoAdmin(admin.ModelAdmin):
    list_display = (
        "participante",
        "pontuacao",
        "acertos",
        "erros",
        "tempo_gasto_segundos",
        "registrado_em",
    )
    list_filter = ("participante__sessao",)
    readonly_fields = ("registrado_em",)

from django.contrib import admin

from .models import Alternativa, Materia, Pergunta


class AlternativaInline(admin.TabularInline):
    model = Alternativa
    extra = 4


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    search_fields = ("nome",)


@admin.register(Pergunta)
class PerguntaAdmin(admin.ModelAdmin):
    list_display = ("enunciado_resumido", "quiz", "materia", "nivel", "ativa")
    list_filter = ("nivel", "materia", "ativa", "quiz")
    search_fields = ("enunciado",)
    inlines = (AlternativaInline,)

    @admin.display(description="Pergunta")
    def enunciado_resumido(self, obj):
        return str(obj)

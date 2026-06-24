from django.contrib import admin

from .models import Categoria, Quiz, Turma


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    search_fields = ("nome",)


@admin.register(Turma)
class TurmaAdmin(admin.ModelAdmin):
    list_display = ("serie", "nome", "ano_letivo", "ativa")
    list_filter = ("ano_letivo", "ativa")
    search_fields = ("serie", "nome")


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = (
        "titulo",
        "categoria",
        "turma",
        "quantidade_perguntas",
        "ativo",
    )
    list_filter = ("ativo", "categoria", "turma")
    search_fields = ("titulo", "descricao")

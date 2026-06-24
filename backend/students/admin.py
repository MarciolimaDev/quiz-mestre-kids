from django.contrib import admin

from .models import Aluno, Avatar


@admin.register(Avatar)
class AvatarAdmin(admin.ModelAdmin):
    list_display = ("nome", "ativo", "criado_em")
    list_filter = ("ativo",)
    search_fields = ("nome",)


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ("nome", "apelido", "turma", "avatar", "ativo")
    list_filter = ("turma", "ativo")
    search_fields = ("nome", "apelido")

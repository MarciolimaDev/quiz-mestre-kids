import random

from django.db import transaction
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from questions.models import Alternativa
from quizzes.models import Quiz
from students.models import Aluno

from .models import ParticipanteSessao, RespostaAluno, SessaoQuiz
from .services import _image_url, build_game_state, session_questions


def active_session():
    return (
        SessaoQuiz.objects.filter(status=SessaoQuiz.Status.EM_ANDAMENTO)
        .select_related("quiz__categoria", "turma", "pergunta_atual", "aluno_atual")
        .first()
    )


class GameStateView(APIView):
    def get(self, request):
        return Response(build_game_state(request, active_session()))


class StartGameView(APIView):
    @transaction.atomic
    def post(self, request):
        quiz = get_object_or_404(
            Quiz.objects.select_related("turma", "categoria"),
            pk=request.data.get("quiz_id"),
            ativo=True,
        )
        if not quiz.turma_id:
            return Response({"detail": "O quiz precisa estar vinculado a uma turma."}, status=status.HTTP_400_BAD_REQUEST)
        perguntas = list(quiz.perguntas.filter(ativa=True).order_by("ordem", "id"))
        if not perguntas:
            return Response({"detail": "O quiz não possui perguntas ativas."}, status=status.HTTP_400_BAD_REQUEST)
        if quiz.embaralhar_perguntas:
            random.shuffle(perguntas)
        perguntas = perguntas[: quiz.quantidade_perguntas]
        pergunta = perguntas[0]
        now = timezone.now()
        SessaoQuiz.objects.filter(status=SessaoQuiz.Status.EM_ANDAMENTO).update(
            status=SessaoQuiz.Status.FINALIZADA,
            finalizada_em=now,
        )
        sessao = SessaoQuiz.objects.create(
            quiz=quiz,
            turma=quiz.turma,
            pergunta_atual=pergunta,
            status=SessaoQuiz.Status.EM_ANDAMENTO,
            iniciada_em=now,
            pergunta_iniciada_em=now,
            ordem_perguntas=[item.id for item in perguntas],
        )
        for aluno in quiz.turma.alunos.filter(ativo=True).select_related("avatar"):
            ParticipanteSessao.objects.create(sessao=sessao, aluno=aluno)
        primeiro = sessao.participantes.order_by("entrou_em").first()
        if primeiro:
            sessao.aluno_atual = primeiro.aluno
            sessao.save(update_fields=("aluno_atual",))
        sessao = SessaoQuiz.objects.select_related("quiz__categoria", "turma", "pergunta_atual", "aluno_atual").get(pk=sessao.pk)
        return Response(build_game_state(request, sessao), status=status.HTTP_201_CREATED)


class SelectStudentView(APIView):
    def post(self, request):
        sessao = get_object_or_404(SessaoQuiz, pk=request.data.get("sessao_id"), status=SessaoQuiz.Status.EM_ANDAMENTO)
        participante = get_object_or_404(sessao.participantes, aluno_id=request.data.get("aluno_id"))
        sessao.aluno_atual = participante.aluno
        sessao.save(update_fields=("aluno_atual",))
        sessao = SessaoQuiz.objects.select_related("quiz__categoria", "turma", "pergunta_atual", "aluno_atual").get(pk=sessao.pk)
        return Response(build_game_state(request, sessao))


class AnswerQuestionView(APIView):
    @transaction.atomic
    def post(self, request):
        sessao = get_object_or_404(
            SessaoQuiz.objects.select_related("quiz", "pergunta_atual", "aluno_atual"),
            pk=request.data.get("sessao_id"),
            status=SessaoQuiz.Status.EM_ANDAMENTO,
        )
        if not sessao.aluno_atual_id or not sessao.pergunta_atual_id:
            return Response({"detail": "Selecione um aluno e uma pergunta."}, status=status.HTTP_400_BAD_REQUEST)
        participante = get_object_or_404(sessao.participantes, aluno_id=sessao.aluno_atual_id)
        if participante.respostas.filter(pergunta=sessao.pergunta_atual).exists():
            return Response({"detail": "Este aluno já respondeu esta pergunta."}, status=status.HTTP_400_BAD_REQUEST)
        alternativa = get_object_or_404(
            Alternativa,
            pk=request.data.get("alternativa_id"),
            pergunta=sessao.pergunta_atual,
        )
        RespostaAluno.objects.create(
            participante=participante,
            pergunta=sessao.pergunta_atual,
            alternativa=alternativa,
            tempo_gasto_segundos=max(0, int(request.data.get("tempo_gasto_segundos", 0))),
        )
        sessao = SessaoQuiz.objects.select_related("quiz__categoria", "turma", "pergunta_atual", "aluno_atual").get(pk=sessao.pk)
        return Response(build_game_state(request, sessao), status=status.HTTP_201_CREATED)


class NextQuestionView(APIView):
    def post(self, request):
        sessao = get_object_or_404(
            SessaoQuiz.objects.select_related("quiz__categoria", "turma", "pergunta_atual", "aluno_atual"),
            pk=request.data.get("sessao_id"),
            status=SessaoQuiz.Status.EM_ANDAMENTO,
        )
        perguntas = session_questions(sessao)
        current_index = next(
            (index for index, item in enumerate(perguntas) if item.id == sessao.pergunta_atual_id),
            -1,
        )
        if current_index + 1 >= len(perguntas):
            sessao.status = SessaoQuiz.Status.FINALIZADA
            sessao.finalizada_em = timezone.now()
            sessao.save(update_fields=("status", "finalizada_em"))
        else:
            sessao.pergunta_atual = perguntas[current_index + 1]
            sessao.pergunta_iniciada_em = timezone.now()
            sessao.save(update_fields=("pergunta_atual", "pergunta_iniciada_em"))
        return Response(build_game_state(request, sessao))


class GeneralRankingView(APIView):
    def get(self, request):
        students = (
            Aluno.objects.filter(participacoes__resultado__isnull=False)
            .select_related("avatar", "turma")
            .annotate(
                pontuacao_total=Sum("participacoes__resultado__pontuacao"),
                acertos_total=Sum("participacoes__resultado__acertos"),
                erros_total=Sum("participacoes__resultado__erros"),
                tempo_total=Sum("participacoes__resultado__tempo_gasto_segundos"),
                rodadas=Count("participacoes__sessao", distinct=True),
            )
            .order_by("-pontuacao_total", "tempo_total", "nome")
        )
        return Response(
            [
                {
                    "posicao": index,
                    "aluno_id": student.id,
                    "nome": student.nome,
                    "apelido": student.apelido,
                    "avatar": _image_url(request, student),
                    "turma": str(student.turma),
                    "pontuacao": student.pontuacao_total or 0,
                    "acertos": student.acertos_total or 0,
                    "erros": student.erros_total or 0,
                    "tempo_gasto_segundos": student.tempo_total or 0,
                    "rodadas": student.rodadas,
                }
                for index, student in enumerate(students, start=1)
            ]
        )

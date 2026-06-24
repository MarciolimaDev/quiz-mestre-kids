from django.urls import path

from .views import AnswerQuestionView, GameStateView, GeneralRankingView, NextQuestionView, SelectStudentView, StartGameView


urlpatterns = [
    path("jogo/estado/", GameStateView.as_view(), name="game-state"),
    path("jogo/iniciar/", StartGameView.as_view(), name="game-start"),
    path("jogo/selecionar-aluno/", SelectStudentView.as_view(), name="game-select-student"),
    path("jogo/responder/", AnswerQuestionView.as_view(), name="game-answer"),
    path("jogo/proxima/", NextQuestionView.as_view(), name="game-next"),
    path("rankings/geral/", GeneralRankingView.as_view(), name="general-ranking"),
]

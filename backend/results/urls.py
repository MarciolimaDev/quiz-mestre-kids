from django.urls import re_path

from .views import AnswerQuestionView, GameStateView, GeneralRankingView, NextQuestionView, SelectStudentView, StartGameView


urlpatterns = [
    re_path(r"^jogo/estado/?$", GameStateView.as_view(), name="game-state"),
    re_path(r"^jogo/iniciar/?$", StartGameView.as_view(), name="game-start"),
    re_path(r"^jogo/selecionar-aluno/?$", SelectStudentView.as_view(), name="game-select-student"),
    re_path(r"^jogo/responder/?$", AnswerQuestionView.as_view(), name="game-answer"),
    re_path(r"^jogo/proxima/?$", NextQuestionView.as_view(), name="game-next"),
    re_path(r"^rankings/geral/?$", GeneralRankingView.as_view(), name="general-ranking"),
]

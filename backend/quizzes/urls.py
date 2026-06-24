from django.urls import path

from .views import QuizListCreateView, TurmaListCreateView


urlpatterns = [
    path("quizzes/", QuizListCreateView.as_view(), name="quiz-list-create"),
    path("turmas/", TurmaListCreateView.as_view(), name="turma-list-create"),
]

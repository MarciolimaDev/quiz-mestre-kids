from django.urls import re_path

from .views import QuizListCreateView, TurmaListCreateView


urlpatterns = [
    re_path(r"^quizzes/?$", QuizListCreateView.as_view(), name="quiz-list-create"),
    re_path(r"^turmas/?$", TurmaListCreateView.as_view(), name="turma-list-create"),
]

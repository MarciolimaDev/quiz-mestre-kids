from rest_framework import generics

from .models import Quiz, Turma
from .serializers import QuizResumoSerializer, TurmaSerializer


class QuizListCreateView(generics.ListCreateAPIView):
    queryset = Quiz.objects.select_related("categoria").all()
    serializer_class = QuizResumoSerializer


class TurmaListCreateView(generics.ListCreateAPIView):
    queryset = Turma.objects.all()
    serializer_class = TurmaSerializer

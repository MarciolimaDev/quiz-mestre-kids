from django.utils import timezone
from django.db.models.functions import Lower
from quizzes.models import Quiz

from .models import SessaoQuiz


QUESTION_TIME_SECONDS = 90


def _image_url(request, aluno):
    if aluno.avatar_id and aluno.avatar.imagem:
        return request.build_absolute_uri(aluno.avatar.imagem.url)
    return aluno.avatar_url or None


def session_questions(sessao):
    queryset = sessao.quiz.perguntas.filter(ativa=True).prefetch_related("alternativas")
    if sessao.ordem_perguntas:
        questions_by_id = {question.id: question for question in queryset.filter(id__in=sessao.ordem_perguntas)}
        return [questions_by_id[question_id] for question_id in sessao.ordem_perguntas if question_id in questions_by_id]
    return list(queryset.order_by("ordem", "id")[: sessao.quiz.quantidade_perguntas])


def session_participants(sessao):
    return list(
        sessao.participantes.select_related("aluno__avatar", "resultado")
        .order_by(Lower("aluno__nome"), "aluno__id")
    )


def first_participant(sessao):
    return (
        sessao.participantes.select_related("aluno")
        .order_by(Lower("aluno__nome"), "aluno__id")
        .first()
    )


def next_participant(sessao):
    participantes = session_participants(sessao)
    if not participantes:
        return None
    current_index = next(
        (index for index, item in enumerate(participantes) if item.aluno_id == sessao.aluno_atual_id),
        -1,
    )
    return participantes[(current_index + 1) % len(participantes)]


def available_quizzes():
    return [
        {
            "id": quiz.id,
            "titulo": quiz.titulo,
            "turma": str(quiz.turma) if quiz.turma else None,
        }
        for quiz in Quiz.objects.filter(
            ativo=True,
            turma__isnull=False,
            perguntas__ativa=True,
        ).select_related("turma").distinct()
    ]


def build_game_state(request, sessao=None):
    if sessao is None:
        return {"status": "sem_sessao", "quizzes": available_quizzes()}

    perguntas = session_questions(sessao)
    pergunta = sessao.pergunta_atual
    if pergunta and pergunta.id not in {item.id for item in perguntas}:
        pergunta = None

    participantes = session_participants(sessao)
    selected = next(
        (item for item in participantes if item.aluno_id == sessao.aluno_atual_id),
        participantes[0] if participantes else None,
    )

    participant_data = []
    for participante in participantes:
        resultado = getattr(participante, "resultado", None)
        participant_data.append(
            {
                "participante_id": participante.id,
                "aluno_id": participante.aluno_id,
                "nome": participante.aluno.nome,
                "apelido": participante.aluno.apelido,
                "avatar": _image_url(request, participante.aluno),
                "pontuacao": resultado.pontuacao if resultado else 0,
                "acertos": resultado.acertos if resultado else 0,
                "erros": resultado.erros if resultado else 0,
            }
        )
    ranking = sorted(
        participant_data,
        key=lambda item: (-item["pontuacao"], item["nome"].casefold()),
    )

    question_data = None
    answer_data = None
    current_number = 0
    if pergunta:
        current_number = next(
            (index for index, item in enumerate(perguntas, start=1) if item.id == pergunta.id),
            0,
        )
        question_data = {
            "id": pergunta.id,
            "enunciado": pergunta.enunciado,
            "nivel": pergunta.nivel,
            "nivel_label": pergunta.get_nivel_display(),
            "imagem": request.build_absolute_uri(pergunta.imagem.url) if pergunta.imagem else None,
            "alternativas": [
                {"id": item.id, "texto": item.texto, "ordem": item.ordem}
                for item in pergunta.alternativas.all()
            ],
        }
        if selected:
            resposta = selected.respostas.filter(pergunta=pergunta).first()
            if resposta:
                answer_data = {
                    "alternativa_id": resposta.alternativa_id,
                    "correta": resposta.correta,
                    "pontos": resposta.pontos,
                }

    elapsed = 0
    if sessao.pergunta_iniciada_em:
        elapsed = max(0, int((timezone.now() - sessao.pergunta_iniciada_em).total_seconds()))

    return {
        "status": sessao.status,
        "sessao_id": sessao.id,
        "quiz": {
            "id": sessao.quiz_id,
            "titulo": sessao.quiz.titulo,
            "categoria": sessao.quiz.categoria.nome,
            "turma": str(sessao.turma),
            "pontos_por_acerto": sessao.quiz.pontos_por_acerto,
        },
        "pergunta": question_data,
        "pergunta_numero": current_number,
        "total_perguntas": len(perguntas),
        "tempo_por_pergunta": QUESTION_TIME_SECONDS,
        "tempo_restante": max(0, QUESTION_TIME_SECONDS - elapsed),
        "aluno_atual_id": selected.aluno_id if selected else None,
        "resposta": answer_data,
        "participantes": participant_data,
        "ranking": ranking,
    }

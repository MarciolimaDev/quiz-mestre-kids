from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import LoginSerializer, RegisterSerializer, UserSerializer


def set_auth_cookies(response, user, request=None):
    """Set auth cookies. If `request` is provided, try to set cookie domain based
    on X-Forwarded-Host or Host so cookies work correctly behind a proxy.
    """
    refresh = RefreshToken.for_user(user)
    # Determine cookie domain from forwarded host if present (proxy case)
    cookie_domain = None
    if request is not None:
        forwarded = request.META.get("HTTP_X_FORWARDED_HOST") or request.META.get("HTTP_HOST")
        if forwarded:
            # strip port if present
            cookie_domain = forwarded.split(":")[0]

    cookie_params = {
        "max_age": int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": "Lax",
        "path": "/",
    }
    if cookie_domain:
        cookie_params["domain"] = cookie_domain

    response.set_cookie(settings.AUTH_COOKIE_ACCESS, str(refresh.access_token), **cookie_params)

    refresh_params = {
        "max_age": int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        "httponly": True,
        "secure": settings.AUTH_COOKIE_SECURE,
        "samesite": "Lax",
        "path": "/",
    }
    if cookie_domain:
        refresh_params["domain"] = cookie_domain

    response.set_cookie(settings.AUTH_COOKIE_REFRESH, str(refresh), **refresh_params)


class RegisterView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response = Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        set_auth_cookies(response, user, request=request)
        return response


class LoginView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        response = Response(UserSerializer(serializer.validated_data["user"]).data)
        set_auth_cookies(response, serializer.validated_data["user"], request=request)
        return response


class RefreshView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        raw_refresh = request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not raw_refresh:
            return Response({"detail": "Sessão expirada."}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            refresh = RefreshToken(raw_refresh)
            access = str(refresh.access_token)
        except TokenError:
            return Response({"detail": "Sessão inválida."}, status=status.HTTP_401_UNAUTHORIZED)
        response = Response({"detail": "Token renovado."})
        # Use same domain logic when refreshing token
        cookie_domain = request.META.get("HTTP_X_FORWARDED_HOST") or request.META.get("HTTP_HOST")
        if cookie_domain:
            cookie_domain = cookie_domain.split(":")[0]
            response.set_cookie(
                settings.AUTH_COOKIE_ACCESS,
                access,
                max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
                httponly=True,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite="Lax",
                path="/",
                domain=cookie_domain,
            )
        else:
            response.set_cookie(
                settings.AUTH_COOKIE_ACCESS,
                access,
                max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
                httponly=True,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite="Lax",
                path="/",
            )
        return response


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    def post(self, request):
        response = Response(status=status.HTTP_204_NO_CONTENT)
        # Delete cookies possibly set with domain when behind proxy
        cookie_domain = request.META.get("HTTP_X_FORWARDED_HOST") or request.META.get("HTTP_HOST")
        if cookie_domain:
            cookie_domain = cookie_domain.split(":")[0]
            response.delete_cookie(settings.AUTH_COOKIE_ACCESS, path="/", domain=cookie_domain)
            response.delete_cookie(settings.AUTH_COOKIE_REFRESH, path="/", domain=cookie_domain)
        else:
            response.delete_cookie(settings.AUTH_COOKIE_ACCESS, path="/")
            response.delete_cookie(settings.AUTH_COOKIE_REFRESH, path="/")
        return response

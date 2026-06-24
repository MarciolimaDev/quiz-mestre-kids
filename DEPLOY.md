# Deploy: Render + Vercel

## 1. Backend no Render

1. Envie o repositório para GitHub, GitLab ou Bitbucket.
2. No Render, escolha **New > Blueprint** e selecione o repositório.
3. O arquivo `render.yaml` cria o PostgreSQL, o serviço Django e um disco de 1 GB para uploads.
4. Depois do primeiro deploy, abra o Shell do serviço e crie o administrador:

   ```bash
   python manage.py createsuperuser
   ```

5. Anote a URL pública, por exemplo `https://quizmestrekids-api.onrender.com`.

O plano `starter` foi escolhido porque avatares e imagens de perguntas precisam de disco persistente. Se o disco for removido para usar um plano sem persistência, os uploads serão perdidos nos deploys e reinicializações.

## 2. Frontend na Vercel

1. Importe o mesmo repositório na Vercel.
2. Configure **Root Directory** como `frontend`.
3. Mantenha o framework **Next.js** e os comandos detectados automaticamente.
4. Cadastre a variável de ambiente em Production, Preview e Development:

   ```text
   BACKEND_URL=https://quizmestrekids-api.onrender.com
   ```

5. Faça o deploy.

O frontend acessa `/api` no próprio domínio da Vercel. O Next.js encaminha essas chamadas ao Render, permitindo que os cookies HttpOnly de autenticação funcionem corretamente.

## 3. Verificação após o deploy

- Acesse `https://SEU-BACKEND.onrender.com/health/` e confirme `{"status":"ok"}`.
- Registre ou autentique um usuário pela URL da Vercel.
- Acesse `/dashboard` e confirme que não há redirecionamento de volta ao login.
- Envie um avatar e uma imagem de pergunta, faça um novo deploy do backend e confirme que os arquivos continuam disponíveis.
- Acesse o Django Admin diretamente em `https://SEU-BACKEND.onrender.com/admin/`.

## Variáveis opcionais do backend

O Blueprint define as variáveis obrigatórias. Para liberar acesso direto à API a partir de outro frontend, configure no Render:

```text
CORS_ALLOWED_ORIGINS=https://seu-dominio.com
CSRF_TRUSTED_ORIGINS=https://seu-dominio.com
ALLOWED_HOSTS=seu-backend.onrender.com
```

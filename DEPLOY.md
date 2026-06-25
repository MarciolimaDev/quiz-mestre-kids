# Deploy: Render + Vercel

## 1. Backend no Render

1. Envie o repositório para GitHub, GitLab ou Bitbucket.
2. No Render, escolha **New > Blueprint** e selecione o repositório.
3. O arquivo `render.yaml` cria o PostgreSQL e o serviço Django.
4. Depois do primeiro deploy, abra o Shell do serviço e crie o administrador:

   ```bash
   python manage.py createsuperuser
   ```

5. Anote a URL pública, por exemplo `https://quizmestrekids-api.onrender.com`.

### Media no Cloudflare R2

Em produção, configure o Cloudflare R2 no Render para avatares e imagens de perguntas não dependerem do disco local do Render.

Variáveis obrigatórias no backend:

```text
USE_CLOUDFLARE_R2=True
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET=quiz-kids
AWS_ACCESS_KEY_ID=<access-key-do-r2>
AWS_SECRET_ACCESS_KEY=<secret-key-do-r2>
AWS_S3_REGION=auto
AWS_S3_ADDRESSING_STYLE=virtual
AWS_QUERYSTRING_AUTH=False
```

Para as imagens ficarem acessíveis no navegador, publique o bucket no R2 e configure:

```text
AWS_S3_CUSTOM_DOMAIN=<seu-dominio-publico-do-r2>
```

Exemplo:

```text
AWS_S3_CUSTOM_DOMAIN=pub-xxxx.r2.dev
```

Não coloque `https://` em `AWS_S3_CUSTOM_DOMAIN`.

Arquivos já enviados para o disco do Render não são migrados automaticamente para o R2. Reenvie esses avatares/imagens ou migre manualmente.

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
- Envie um avatar ou uma imagem de pergunta e confirme que o arquivo aparece no bucket R2.
- A URL retornada pela API deve usar o domínio configurado em `AWS_S3_CUSTOM_DOMAIN`, não `https://SEU-BACKEND.onrender.com/media/...`.
- Acesse o Django Admin diretamente em `https://SEU-BACKEND.onrender.com/admin/`.

## Variáveis opcionais do backend

O Blueprint define parte das variáveis. Para liberar acesso direto à API a partir de outro frontend, configure no Render:

```text
CORS_ALLOWED_ORIGINS=https://seu-dominio.com
CSRF_TRUSTED_ORIGINS=https://seu-dominio.com
ALLOWED_HOSTS=seu-backend.onrender.com
```

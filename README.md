# landingpage1

Landing page do projeto (desenvolvimento local nesta pasta).

## Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e faça login com GitHub.
2. **Import** o repositório `HondaT28/landingpage1`.
3. A Vercel lê o [`vercel.json`](vercel.json): instala dependências com pip, roda `python build.py` e publica a pasta `out/`.
4. Clique em **Deploy**. Cada `git push` na `main` gera um novo deploy.

Pré-visualização local: `python build.py` e abra `out/index.html`, ou use `.\serve.ps1` se existir.

## Leads no Google Sheets

Este projeto já está preparado para enviar o formulário para uma planilha Google chamada:
`Leads Tráfego Pago - Mapeamento de Processos`.

### 1) Publicar o Apps Script

1. Abra [script.new](https://script.new) com sua conta Google.
2. Substitua o conteúdo por `google-apps-script/Code.gs`.
3. Salve o projeto.
4. Clique em **Deploy > New deployment > Web app**.
5. Execute como: **Me**.
6. Who has access: **Anyone**.
7. Clique em **Deploy** e copie a URL do Web App.
8. (Opcional) Rode a função `setupLeadsSheet()` uma vez para criar a planilha imediatamente.

### 2) Conectar a landing page

No arquivo `src/templates/index.html.jinja2`, dentro do script do formulário, substitua:

`COLE_AQUI_URL_WEBAPP_GOOGLE_APPS_SCRIPT`

pela URL do Web App publicada.

Depois rode o build/deploy normalmente. Cada envio do formulário vira uma nova linha na aba `Leads`.

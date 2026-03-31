# landingpage1

Landing page do projeto (desenvolvimento local nesta pasta).

## Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e faça login com GitHub.
2. **Import** o repositório `HondaT28/landingpage1`.
3. A Vercel lê o [`vercel.json`](vercel.json): instala dependências com pip, roda `python build.py` e publica a pasta `out/`.
4. Clique em **Deploy**. Cada `git push` na `main` gera um novo deploy.

Pré-visualização local: `python build.py` e abra `out/index.html`, ou use `.\serve.ps1` se existir.

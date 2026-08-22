# rui-tech-helper-crm

Backoffice SPA (admin/técnico) para "O Rui dos Computadores", em `crm.oruidoscomputadores.pt`.

## Stack
React + Vite + TypeScript + TanStack Router + TanStack Query. Auth via cookie de sessão Sanctum SPA do backend `rui-tech-helper-api` (mesmo domínio `oruidoscomputadores.pt`).

## Desenvolvimento local
```
npm install
cp .env.example .env   # ajustar VITE_API_URL se necessário
npm run dev
```

## Deploy
cPanel shared hosting não tem runtime Node — a build tem de ser feita localmente e o resultado (`dist/`) commitado antes do push:
```
npm run build
git add -f dist
git commit -m "chore: commit production build for deploy"
git push origin master
```
Depois, no cPanel: puxar o repo (`update_git_repo`) e correr o deploy (`deploy_git_repo`), que copia `dist/` para o document root de `crm.oruidoscomputadores.pt` via `.cpanel.yml`.

Repo GitHub (`ruijacome-glitch/rui-tech-helper-crm`) tem de ser **público** — o clone do cPanel Git Version Control é feito via HTTPS sem credenciais, e falha silenciosamente (directório vazio, sem registo em `list_git_repos`) contra um repo privado.

Clone cPanel actual em `/home/mercadom/repositories/rui-tech-helper-crm-src3`.

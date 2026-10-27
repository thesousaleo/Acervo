# Acervo

Repositório pessoal de **filmes, séries, animes, livros e mangás**, com visual *Liquid Glass*.
Roda na Web (GitHub Pages) e como app Android (APK via Capacitor).

- **Web:** https://thesousaleo.github.io/Acervo/
- **APK:** aba [Releases](../../releases/latest) → baixe `Acervo-x.y.z.apk` no celular e instale.

## O que tem

Um menu só, na parte de baixo: **Início · Filmes/Séries · Livros · Diário**, com o botão **+** flutuante ao lado para adicionar. Conta e dados ficam no avatar do Início.

- **Tipos:** filmes, séries, animes, livros e mangás/HQs.
- **Busca automática** ao cadastrar: capa, ano, diretor/autor, gêneros, páginas e episódios por temporada
  (TMDB para filmes e séries, AniList para anime e mangá, Google Livros/Open Library para livros).
- **Onde assistir** no Brasil (dados do JustWatch via TMDB) e **próximos episódios** de séries e animes, atualizados sozinhos.
- **Quanto falta:** episódios restantes e previsão de término da leitura no seu ritmo.
- **Atalhos na capa:** `+1 ep`, `página`, `capítulo` e ✓ concluir; cada um vira uma sessão no histórico, com anotação opcional.
- **Status:** em andamento, na fila (com hype), pausado, abandonado e concluído; rever/reler com datas.
- **Tags, gêneros e listas** próprias, com filtros na estante.
- **O que eu faço agora?** sorteia algo da sua lista pelo tempo disponível.
- **Diário + Retrospectiva:** linha do tempo, números do ano, mês a mês, notas, gêneros favoritos, melhores do ano e **metas anuais**.
- **Compartilhar como imagem:** review de um item ou a retrospectiva do ano.
- **Importar** do Letterboxd e do Goodreads (CSV) e backup `.json`.
- **Conta** (e-mail e senha) com sincronização automática entre aparelhos; **notificações** no Android (episódio novo, lembrete de leitura).

Sem conta, tudo funciona offline no aparelho.

## Stack

React 18 + Vite + TypeScript · Tailwind CSS · Framer Motion · Lucide Icons · Capacitor 7 (Android, Status Bar, Filesystem, Share, Local Notifications) · Supabase.

## Desenvolvimento

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # gera dist/
```

### Android local (opcional)

Requer Android Studio e JDK 21.

```bash
npm run build
npx cap add android                       # só na primeira vez
npx capacitor-assets generate --android   # ícone e splash a partir de assets/
npx cap sync android
npx cap open android
```

A pasta `android/` não é versionada: o GitHub Actions gera ela do zero a cada build.

## Publicação automática

Cada push na branch `main` dispara dois workflows:

| Workflow | O que faz |
|---|---|
| `deploy-web.yml` | Builda o Vite e publica no GitHub Pages (Settings → Pages → Source: **GitHub Actions**). |
| `build-apk.yml` | Builda o Vite, gera o projeto Android, compila o APK assinado e publica em **Releases** como `v1.0.<n>`. |

### Assinatura do APK

O APK é assinado com `keystore/acervo.jks` para que versões novas instalem por cima das antigas sem perder dados.
Essa chave está no repositório (público) por praticidade. Para usar uma chave privada, crie estes *secrets* em
**Settings → Secrets and variables → Actions** e o workflow passa a usá-los automaticamente:

| Secret | Valor |
|---|---|
| `KEYSTORE_BASE64` | `base64 -w0 sua-chave.jks` |
| `KEYSTORE_PASSWORD` | senha do keystore |
| `KEY_ALIAS` | alias da chave |
| `KEY_PASSWORD` | senha da chave |

Trocar de chave exige desinstalar o app uma vez (exporte o backup antes).

## Supabase (conta, sincronização e busca)

O app usa o projeto Supabase definido em `src/services/supabase.ts` (URL + chave publicável, que é pública por natureza).
Os dados ficam protegidos por login e RLS: cada usuário só lê e grava as próprias linhas.

- Tabelas: `acervo_user_items (user_id, id, data, updated_at)` e `acervo_config (user_id, data, updated_at)`.
- Edge Function `meta` (código em `supabase/functions/meta`): busca no TMDB sem expor a chave.
  Segredo necessário em *Edge Functions → Secrets*: `TMDB_TOKEN`.
- AniList, Google Livros e Open Library são chamados direto do app (não precisam de chave).

## Estrutura

```
src/
├── App.tsx                 shell: fundo, header, páginas, dock
├── components/             Cover, Stars, Dock (menu + botão +), Goals, Upcoming, PickSheet, NoteSheet, items/, ItemModal/
├── data/                   catalog.ts (categorias, universos, campos) · seed.ts
├── lib/                    datas, progresso e estatísticas
├── pages/                  Inicio, Area (Filmes/Séries, Livros), Diario, Retrospectiva, Backup (conta e dados)
├── services/               auth, sync/, meta (busca), importers (CSV), notify, shareImage, storage, backup, platform
├── store/useLibrary.tsx    estado global e ações rápidas
└── styles/liquid.css       design system Liquid Glass
```

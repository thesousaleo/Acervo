# Acervo

Repositório pessoal de **filmes, séries, jogos e livros**, com visual *Liquid Glass*.
Roda na Web (GitHub Pages) e como app Android (APK via Capacitor).

- **Web:** https://thesousaleo.github.io/Acervo/
- **APK:** aba [Releases](../../releases/latest) → baixe `Acervo-x.y.z.apk` no celular e instale.

## O que tem

Um menu só, na parte de baixo: **Início · Filmes/Séries · Jogos · Livros · Diário** (backup na engrenagem do topo).

- **Início:** destaque do que você mexeu por último, resumo das três áreas, "Continuar" e terminados recentemente.
- **Filmes/Séries, Jogos e Livros:** números da área, o que está em andamento (atalhos `+1 ep`, `página`, `+1 h` e ✓ concluir na própria capa), **Na fila** (desejos por hype, com `Começar`) e **Estante** com busca, filtros e ordenação.
- **Diário:** tudo o que foi concluído, mês a mês, com nota, review e rewatches.
- **Backup:** exportar/importar `.json` e sincronização automática com Supabase.

Os dados ficam no próprio aparelho (`localStorage`) e funcionam offline. Web e APK guardam dados separados; use o backup `.json` ou o Supabase para levar de um para o outro.

## Stack

React 18 + Vite + TypeScript · Tailwind CSS · Framer Motion · Lucide Icons · Capacitor 7 (Android, Status Bar, Filesystem, Share).

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

## Sincronização com Supabase (opcional)

1. Crie um projeto grátis em supabase.com.
2. Em **SQL Editor → New query**, cole e rode:

```sql
create table if not exists acervo_items (
  id text primary key,
  data jsonb not null,
  updated_at bigint not null
);
alter table acervo_items enable row level security;
revoke all on acervo_items from anon, authenticated;
grant select, insert, update on acervo_items to anon, authenticated;
create policy "acervo: leitura"   on acervo_items for select to anon, authenticated using (true);
create policy "acervo: inserir"   on acervo_items for insert to anon, authenticated with check (true);
create policy "acervo: atualizar" on acervo_items for update to anon, authenticated using (true) with check (true);
```

3. Em **Project Settings → API Keys**, copie a **Project URL** (`https://xxxx.supabase.co`) e a chave
   **publishable** (`sb_publishable_…`; projetos antigos mostram a *anon key* `eyJ…`, que também funciona).
4. No app, aba **Backup → Supabase**, cole as duas e toque em **Salvar e conectar**. Faça o mesmo no outro aparelho.

A partir daí a sincronização é automática: ao abrir o app, ao voltar para ele, quando a internet volta e
poucos segundos depois de cada alteração. Em conflito vale a edição mais recente de cada item, e exclusões
também são sincronizadas.

> As políticas acima liberam leitura e escrita (sem apagar linhas) para quem tiver a chave pública. Para um app pessoal é suficiente; não divulgue a chave.
> Nunca use a chave **secret** / *service_role* no app.

O serviço fica em `src/services/sync/` (`SyncProvider` é a interface; `supabaseSync.ts` a implementação).

## Estrutura

```
src/
├── App.tsx                 shell: fundo, header, páginas, dock
├── components/             Cover, Stars, Header, Dock, items/, ItemModal/
├── data/                   catalog.ts (categorias, universos, campos) · seed.ts
├── lib/                    datas, progresso e estatísticas
├── pages/                  Inicio, Area (Filmes/Séries, Jogos, Livros), Diario, Backup
├── services/               storage, backup, platform (nativo), sync/
├── store/useLibrary.tsx    estado global e ações rápidas
└── styles/liquid.css       design system Liquid Glass
```

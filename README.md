# Activity Notes

Aplicativo de anotacoes moderno com editor rich-text, IA integrada (Gemini) e publicacao de documentos.

**Stack:** Next.js 16.1 | Firebase (Auth, Firestore, Storage, Functions, Analytics) | Tiptap | Tailwind CSS 4 | shadcn/ui

## Repositorio V2

- GitHub: https://github.com/rafaelminatto1/activity-notes-v2
- Branch principal: `main`
- Tag inicial de versao: `v2.0.0`

## Status de deploy Firebase (13/02/2026)

- Firestore Rules: deployado com sucesso (`firestore.rules`)
- Firestore Indexes: deployado com sucesso (`firestore.indexes.json`)
- Functions: deploy bloqueado porque o projeto remoto possui varias funcoes legadas que nao existem neste codigo local (Firebase aborta em modo nao-interativo sem deletar antes)
- Hosting: deploy bloqueado porque `firebase.json` aponta para `out/` e esse diretório ainda nao existe no build atual

## Funcionalidades

- Editor rich-text completo (Tiptap) com slash commands, tabelas, callouts, toggles, code blocks
- IA integrada (Google Gemini) — melhorar, resumir, expandir, traduzir, continuar escrevendo
- Documentos aninhados com sidebar em arvore
- Busca full-text instantanea
- Publicacao de documentos com link publico e SEO
- Temas (claro/escuro/sistema) com transicao suave
- Configuracoes de fonte, largura de conteudo e preferencias de IA
- Upload de imagens (capas e inline) para Firebase Storage
- Favoritos e documentos recentes
- Lixeira com exclusao automatica (30 dias via Cloud Function)
- Export de dados em JSON
- Cloud Functions v2 (Gen2) para automacao server-side
- Firebase Analytics e Performance Monitoring

## Inicio rapido

### Pre-requisitos

- Node.js 20+
- npm
- Firebase CLI (`npm install -g firebase-tools`)
- Projeto Firebase criado (Spark/free tier funciona)

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd activitynotes
npm install
cd functions && npm install && cd ..
```

### 2. Configurar variaveis de ambiente

Copie `.env.local.example` ou crie `.env.local`:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Gemini AI (gratis em https://aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Emuladores (descomentar para usar localmente)
# NEXT_PUBLIC_AUTH_EMULATOR_HOST=localhost:9099
# NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
# NEXT_PUBLIC_STORAGE_EMULATOR_HOST=localhost:9199
```

### 3. Configurar Firebase

No Firebase Console, ativar:
- **Authentication** — Email/Password + Google provider
- **Firestore Database** — modo producao
- **Storage** — regras padrao
- **Analytics** (opcional, para tracking)

Fazer login e selecionar projeto:

```bash
firebase login
firebase use your-project-id
```

Fazer deploy das regras e indexes:

```bash
npm run deploy:rules
npm run deploy:indexes
```

### 4. Rodar localmente

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 5. Usar emuladores (opcional)

Descomentar as variaveis `*_EMULATOR_HOST` no `.env.local` e rodar:

```bash
npm run emulators
```

## Scripts disponiveis

| Script | Descricao |
|---|---|
| `npm run dev` | Dev server Next.js |
| `npm run build` | Build de producao |
| `npm run start` | Servir build de producao |
| `npm run lint` | ESLint |
| `npm run build:functions` | Compilar Cloud Functions |
| `npm run deploy` | Build + deploy completo (hosting + functions + rules) |
| `npm run deploy:hosting` | Deploy apenas do hosting |
| `npm run deploy:functions` | Deploy apenas das functions |
| `npm run deploy:rules` | Deploy das regras Firestore + Storage |
| `npm run deploy:indexes` | Deploy dos indexes Firestore |
| `npm run emulators` | Iniciar emuladores Firebase |

## Cloud Functions

Localizadas em `functions/src/index.ts`:

| Funcao | Trigger | Descricao |
|---|---|---|
| `onUserCreated` | `beforeUserCreated` | Cria perfil + documento de boas-vindas |
| `onDocDeleted` | `onDocumentDeleted` | Limpa filhos e imagens do Storage |
| `onDocCreated` | `onDocumentCreated` | Atualiza childCount do pai |
| `scheduledCleanup` | `onSchedule` (03:00 BRT) | Remove docs na lixeira ha 30+ dias |
| `trackAIUsage` | `onCall` | Verifica limites diarios de IA (50 free / 500 pro) |

## Estrutura do projeto

```
activitynotes/
├── src/
│   ├── app/
│   │   ├── (main)/          # Rotas autenticadas (dashboard, editor, settings)
│   │   ├── (auth)/          # Login e registro
│   │   ├── (public)/        # Preview publico de documentos
│   │   ├── page.tsx          # Landing page
│   │   ├── layout.tsx        # Root layout (ThemeProvider, Toaster)
│   │   └── error.tsx         # Error boundary global
│   ├── components/
│   │   ├── editor/           # Tiptap editor, toolbar, slash commands, extensoes
│   │   ├── shared/           # Sidebar, toolbar, search, icon picker
│   │   ├── providers/        # AuthProvider
│   │   └── ui/               # shadcn/ui components
│   ├── hooks/                # useAuth, useSearch, useEditorAI, useSettings
│   ├── lib/
│   │   ├── firebase/         # Config, auth, firestore, storage, analytics
│   │   └── ai/               # Gemini client, prompt builder, usage tracker
│   ├── stores/               # Zustand (editor, sidebar, search, AI)
│   └── types/                # TypeScript types (document, user)
├── functions/
│   └── src/index.ts          # Cloud Functions v2
├── firebase.json             # Config Firebase (hosting, functions, firestore, storage)
├── firestore.rules           # Regras de seguranca Firestore
├── firestore.indexes.json    # Indexes compostos
└── storage.rules             # Regras de seguranca Storage
```

## Free tier Firebase

O app funciona 100% no plano gratuito (Spark):

- **Auth:** Ilimitado para email/Google
- **Firestore:** 1 GiB armazenamento, 50k leituras/dia, 20k escritas/dia
- **Storage:** 5 GB armazenamento, 1 GB download/dia
- **Functions:** Requer upgrade para Blaze (pay-as-you-go, porem com free tier generoso: 2M invocacoes/mes)
- **Analytics:** Gratuito e ilimitado
- **Hosting:** 10 GB armazenamento, 360 MB/dia transfer

## Deploy para producao

```bash
# Build completo + deploy
npm run deploy

# Ou separadamente
npm run deploy:hosting
npm run deploy:functions
npm run deploy:rules
npm run deploy:indexes
```

## Licenca

Projeto privado.

# Diário Alimentar

## Versão React web

Uma versão web mobile-first está disponível em `web/`, em paralelo ao aplicativo Expo. Ela usa o mesmo Supabase, tabelas, RLS e buckets de Storage.

```bash
cd web
copy .env.example .env
npm install
npm run dev
```

Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em `web/.env`. Para publicar separadamente na Vercel, selecione `web` como **Root Directory**; o arquivo `web/vercel.json` já configura o fallback das rotas da SPA.

MVP de diário alimentar em Expo, React Native e TypeScript. O aplicativo usa a mesma base de código no Android, iOS e web, com autenticação, perfil, banco e armazenamento privado no Supabase.

## Requisitos

- Node.js 20 ou superior
- npm
- Um projeto Supabase
- Expo Go no dispositivo, ou um emulador/simulador

## Configuração do Supabase

1. Crie ou abra um projeto no [Supabase](https://supabase.com/dashboard).
2. Abra **SQL Editor**, cole o conteúdo de `supabase/setup.sql` e execute-o. O script cria as tabelas `meals` e `profiles`, índices, RLS, políticas, os buckets privados `meal-photos` e `profile-photos` e a função protegida de exclusão da própria conta.
3. Em **Authentication > Providers > Email**, mantenha o provedor Email habilitado.
4. Para desenvolvimento local imediato, desative **Confirm email**. Se mantiver a confirmação ativa, configure os templates e URLs de redirecionamento e confirme o e-mail antes do primeiro login.
5. Em **Project Settings > API**, copie a Project URL e a chave pública `anon`/`publishable`. Nunca use a chave `service_role` no aplicativo.
6. Copie `.env.example` para `.env` e preencha:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-anon
EXPO_PUBLIC_SITE_URL=https://seu-dominio.com
```

`EXPO_PUBLIC_SITE_URL` deve apontar para a URL pública final do app, sem barra no
fim. Ela é usada nas tags Open Graph e Twitter Card para montar a URL absoluta
da imagem exibida ao compartilhar qualquer página.

Os buckets devem permanecer privados. O app cria URLs assinadas de curta duração para exibir as fotos. Os caminhos começam com o ID do usuário, e as políticas impedem acesso a arquivos e registros de outras contas.

## Execução

```bash
npm install
npm start
```

Atalhos úteis:

```bash
npm run android
npm run ios
npm run web
```

Ao alterar `.env`, reinicie o Expo. Para limpar o cache, use `npx expo start -c`.

## Deploy na Vercel

O arquivo `vercel.json` configura o build web do Expo e publica a pasta `dist`.
No projeto da Vercel, cadastre as variáveis `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY` e `EXPO_PUBLIC_SITE_URL` para os ambientes de
Production e Preview. Depois, faça um novo deploy a partir do commit que contém
essa configuração.

Para reproduzir o build localmente:

```bash
npm run build
```

## Verificações

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform web
```

## Estrutura

- `app/`: rotas de autenticação, diário e refeição.
- `components/`: calendário, cards e formulário reutilizável.
- `lib/`: cliente Supabase, datas e tipos.
- `supabase/setup.sql`: banco, RLS e políticas do Storage.

# Diário Alimentar

MVP de diário alimentar em Expo, React Native e TypeScript. O aplicativo usa a mesma base de código no Android, iOS e web, com autenticação, perfil, banco e armazenamento privado no Supabase.

## Requisitos

- Node.js 20 ou superior
- npm
- Um projeto Supabase
- Expo Go no dispositivo, ou um emulador/simulador

## Configuração do Supabase

1. Crie ou abra um projeto no [Supabase](https://supabase.com/dashboard).
2. Abra **SQL Editor**, cole o conteúdo de `supabase/setup.sql` e execute-o. O script cria as tabelas `meals` e `profiles`, índices, RLS, políticas e os buckets privados `meal-photos` e `profile-photos`.
3. Em **Authentication > Providers > Email**, mantenha o provedor Email habilitado.
4. Para desenvolvimento local imediato, desative **Confirm email**. Se mantiver a confirmação ativa, configure os templates e URLs de redirecionamento e confirme o e-mail antes do primeiro login.
5. Em **Project Settings > API**, copie a Project URL e a chave pública `anon`/`publishable`. Nunca use a chave `service_role` no aplicativo.
6. Copie `.env.example` para `.env` e preencha:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

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

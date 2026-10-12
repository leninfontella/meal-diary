# AGENTS.md — Diário Alimentar

## Objetivo

Construir e manter um diário alimentar **simples**: autenticação, foto de refeição e observação. Priorizar funcionamento, clareza e interface próxima à imagem de referência.

## Stack

- Expo, React Native, React Native Web, TypeScript e Expo Router.
- Supabase Auth, PostgreSQL e Storage.
- Uma única base de código para web, Android e iOS.

## Regras de implementação

- Não adicionar recursos não solicitados nem criar backend próprio.
- Preferir componentes pequenos, reutilizáveis e código legível, sem arquitetura excessiva.
- Manter o layout responsivo, com visual off-white e verde-sálvia.
- Tratar carregamento, ausência de registros e erros de forma simples.
- Proteger os dados por usuário com RLS e Storage privado.
- Não colocar segredos no código nem versionar arquivos `.env`.
- Manter `README.md` e `.env.example` atualizados quando necessário.
- Não modificar arquivos sem relação com a tarefa.

## Verificações básicas

Ao concluir mudanças relevantes:

1. Executar `npx tsc --noEmit`.
2. Executar `npm run lint`, se o script existir.
3. Verificar o build web com `npx expo export --platform web`, quando o ambiente permitir.
4. Conferir os fluxos principais, quando possível: cadastro/login, adicionar foto e observação, consultar por dia, editar/excluir e logout.

Se alguma verificação não puder ser executada, informar isso claramente. Não afirmar que testou algo que não foi testado.

## Entrega

- Resumir brevemente os arquivos alterados, verificações realizadas e pendências de configuração.
- Não executar `git push` nem criar commits automaticamente, salvo pedido explícito.

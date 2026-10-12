# PROMPT INICIAL — DIÁRIO ALIMENTAR

Crie um aplicativo simples de diário alimentar, utilizando a imagem fornecida como referência visual.

**Stack obrigatória:**
- Expo + React Native + TypeScript
- React Native Web
- Expo Router
- Supabase (Auth, PostgreSQL e Storage)
- Expo ImagePicker

Utilize uma única base de código para web, Android e iOS.

## Funcionalidades

1. Cadastro, login e logout com e-mail e senha.
2. Manter o usuário conectado entre sessões.
3. Tela principal com calendário horizontal para selecionar o dia.
4. Exibir fotografias das refeições em cards, com horário.
5. Botão para tirar foto ou selecionar da galeria.
6. Campo para adicionar uma observação à fotografia.
7. Tipo de refeição opcional: Café da manhã, Almoço, Lanche, Jantar ou Outro.
8. Salvar fotos no Supabase Storage e registros no PostgreSQL.
9. Visualizar, editar a observação e excluir registros.
10. Cada usuário acessa somente seus próprios dados.

## Interface

Seguir a imagem de referência: design minimalista, fundo off-white, detalhes verde-sálvia, bordas arredondadas, calendário horizontal e fotografias grandes.

Priorizar a experiência mobile e garantir responsividade na web.

Criar apenas as telas necessárias: autenticação, diário e formulário/visualização da refeição.

## Banco de dados e segurança

Criar `supabase/setup.sql` contendo tabela, políticas RLS e configuração das políticas de acesso ao Storage privado.

Utilizar variáveis de ambiente para URL e chave pública do Supabase. Nunca utilizar a chave service_role no aplicativo.

## Instruções

Leia o `AGENTS.md` antes de começar.

- Manter código simples e organizado.
- Não criar backend separado.
- Não adicionar calorias, IA, estatísticas, gráficos, notificações ou funcionalidades sociais.
- Criar `.env.example` e README com instruções.
- Executar verificações básicas de TypeScript, lint e build web.
- Informar as configurações necessárias no Supabase.
- Não executar git push.

Implemente o MVP completo, sem dividir o desenvolvimento em fases.
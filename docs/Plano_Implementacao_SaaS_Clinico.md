# Plano de Implementação — SaaS de Monitoramento Clínico e Fidelização

**Guia de Instruções para Vibe Coding — Frontend & Backend**

Baseado na Especificação Técnica v2.0 — Fevereiro 2026

---

## 1. Visão Geral do Plano

Este documento organiza a implementação do SaaS de Monitoramento Clínico em **10 Partes sequenciais e incrementais**, projetadas para serem usadas como prompts de vibe coding. Cada parte gera entregáveis funcionais que se acumulam até o sistema completo.

**Filosofia:** Cada parte é um bloco autônomo. Ao concluir uma parte, o sistema já funciona com o escopo implementado até ali. A parte seguinte adiciona novas capacidades sem quebrar as anteriores.

**Stack:** Next.js (Frontend) + Nest.js (Backend) + PostgreSQL + Prisma + Redis

**Metodologia:** Mobile First, PWA, MVP em 3 meses

---

### Mapa de Dependências entre Partes

| Parte | Título | Depende de | Entrega Principal |
|-------|--------|------------|-------------------|
| 1 | Fundação e Infraestrutura | — | Projeto configurado, DB rodando, CI/CD |
| 2 | Autenticação e RBAC | Parte 1 | Login, 2FA, controle de acesso |
| 3 | LGPD e Consentimento | Parte 2 | Consentimento, auditoria, criptografia |
| 4 | Perfil do Paciente e Daily Log | Parte 3 | App do paciente funcional |
| 5 | Dashboard Médico e Linha do Tempo | Parte 4 | Visualização de dados clínicos |
| 6 | Sistema Sentinela (Alertas) | Parte 5 | Detecção de risco e workflow |
| 7 | Prontuário Eletrônico (PEP) | Parte 6 | Consultas, versionamento, assinatura |
| 8 | Prescrições e Validações CID-10 | Parte 7 | Receituário digital completo |
| 9 | Notificações e Agendamento | Parte 8 | Push, WhatsApp, email, agenda |
| 10 | Upload de Mídia, Busca e Polish | Parte 9 | Blob storage, full-text, QA final |

---

## 2. Setup Inicial (Pré-Requisitos)

> **Faça este setup ANTES de iniciar o vibe coding. Sem ele, nada funciona.**

### 2.1 Instale na sua máquina

- **Node.js 20 LTS** via nvm: `nvm install 20 && nvm use 20`
- **Docker Desktop** (inclui docker-compose): [docker.com](https://docker.com)
- **Git**: controle de versão
- **pnpm** (recomendado): `npm install -g pnpm`
- **Editor**: Cursor (vibe coding), VS Code + Copilot, ou Claude Code no terminal

### 2.2 Crie a estrutura de pastas

```
saas-clinico/
├── backend/              ← repo git separado (Nest.js)
├── frontend/             ← repo git separado (Next.js)
├── docker-compose.yml    ← infraestrutura local
└── .env                  ← variáveis compartilhadas
```

### 2.3 docker-compose.yml (crie na raiz)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: clinico_db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: clinico_user
      POSTGRES_PASSWORD: clinico_dev_2026
      POSTGRES_DB: clinico_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: clinico_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 2.4 Inicialize os projetos

```bash
# Subir infraestrutura
docker-compose up -d

# Backend
npx @nestjs/cli new backend --package-manager pnpm
cd backend
pnpm add @prisma/client @nestjs/config @nestjs/swagger class-validator class-transformer
pnpm add -D prisma
npx prisma init

# Frontend
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
cd frontend
pnpm add zustand @tanstack/react-query axios
pnpm add -D @shadow-panda/preset
```

### 2.5 Configure variáveis de ambiente

**backend/.env**
```env
DATABASE_URL="postgresql://clinico_user:clinico_dev_2026@localhost:5432/clinico_db"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="dev-jwt-secret-troque-em-producao"
JWT_REFRESH_SECRET="dev-refresh-secret-troque-em-producao"
ENCRYPTION_KEY="dev-aes256-key-32-chars-exatas!!"
SENTRY_DSN=""
PORT=3001
```

**frontend/.env.local**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 2.6 Valide o ambiente

```bash
# Containers rodando?
docker ps  # deve mostrar clinico_db e clinico_redis

# Backend conecta?
cd backend && pnpm run start:dev  # deve subir na porta 3001

# Frontend conecta?
cd frontend && pnpm run dev  # deve subir na porta 3000
```

✅ **Se tudo subir sem erro, seu ambiente está pronto para vibe coding.**

---

## 3. Parte 1 — Fundação e Infraestrutura

**Objetivo:** Criar a base do projeto com ambos os repositórios configurados, banco de dados rodando e pipeline de deploy funcional.

**Duração estimada:** 3–4 dias

**RFs cobertos:** Nenhum diretamente (infraestrutura de suporte)

**RNFs cobertos:** RNF-004 (API RESTful), RNF-006 (Backup)

---

### 3.1 Backend (Nest.js)

#### Prompt de Instrução — Backend Parte 1

> Crie um projeto Nest.js com TypeScript seguindo arquitetura modular. Configure:
>
> - **Estrutura de módulos:** auth, users, patients, daily-logs, consultations, prescriptions, alerts, notifications, documents.
> - **Prisma ORM** conectado a PostgreSQL. Crie o schema inicial com TODAS as tabelas do documento:
>   - `users`, `patient_profiles`, `medications`, `prescriptions`, `daily_logs`, `alerts`, `consultations`, `clinical_documents`, `formal_prescriptions`, `therapeutic_plans`, `icd10_codes`, `audit_logs`, `consent_logs`, `clinical_evolutions`, `appointments`, `notifications_log`
>   - Inclua os campos exatos, tipos, constraints (CHECKs), índices e UNIQUE constraints conforme a especificação.
> - **Soft delete** padrão (`deleted_at`, `deleted_by`) nas tabelas: consultations, clinical_documents, formal_prescriptions, therapeutic_plans, patient_profiles.
> - **Redis** configurado para cache e rate limiting.
> - **Variáveis de ambiente** (.env.example): DATABASE_URL, REDIS_URL, JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY, SENTRY_DSN.
> - **Swagger/OpenAPI** em `/api/docs` com versionamento `/api/v1/`.
> - **Health check** endpoint em `/health`.
> - **Sentry** configurado para captura de erros.
> - **Docker Compose** com PostgreSQL 16, Redis 7 e a aplicação Nest.
> - **Helmet.js** com headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS (1 ano), CSP configurado.
> - **CORS** com whitelist de domínios.
> - **Estrutura de migration** com nomenclatura `YYYYMMDDHHMMSS_descricao.sql`.
>
> Nomenclatura de códigos de erro conforme catálogo: AUTH_1xxx, VAL_2xxx, CON_3xxx, PRE_4xxx, CID_5xxx, DOC_6xxx, RATE_7xxx, LGPD_8xxx, SYS_9xxx. Crie um módulo `shared/errors` com todas as constantes.

---

### 3.2 Frontend (Next.js)

#### Prompt de Instrução — Frontend Parte 1

> Crie um projeto Next.js 14+ (App Router) com TypeScript configurado como PWA Mobile First:
>
> - **Tailwind CSS + ShadcnUI** instalado e configurado.
> - **Zustand** para client state e **TanStack Query** para server state.
> - **Estrutura de pastas:** `app/(auth)`, `app/(patient)`, `app/(doctor)`, `app/(admin)` com layouts separados por role.
> - **Configuração PWA** com next-pwa: manifest.json, service worker, ícones, splash screens.
> - **Tema de cores** consistente (CSS variables para primary, secondary, success, warning, danger).
> - **Componentes base:** Button, Input, Card, Modal, Toast, LoadingSpinner, EmptyState.
> - **API client** com Axios/fetch interceptors para JWT (attach token, refresh automático, redirect em 401).
> - **Middleware Next.js** para proteção de rotas por role.
> - **Página de loading** e **error boundary** globais.
> - **Responsividade:** breakpoints mobile-first (sm, md, lg).

---

### 3.3 Critérios de Aceitação da Parte 1

- [ ] `docker-compose up` sobe PostgreSQL, Redis e backend sem erros
- [ ] `npx prisma migrate dev` aplica todas as tabelas sem conflitos
- [ ] `GET /health` retorna 200 com status dos serviços
- [ ] `GET /api/docs` mostra Swagger funcional
- [ ] Frontend roda em dev e é instalável como PWA
- [ ] Estrutura de pastas segue convenção definida

---

## 4. Parte 2 — Autenticação e RBAC

**Objetivo:** Implementar o sistema completo de autenticação, autorização e controle de acesso baseado em papéis.

**Duração estimada:** 4–5 dias

**RFs cobertos:** RF-002 (RBAC), RF-026 (2FA)

**RNs cobertos:** RN-014 (Sessão), RN-015 (2FA Médicos), RNF-012 (Rate Limiting)

---

### 4.1 Backend

#### Prompt de Instrução — Backend Parte 2

> Implemente o módulo de autenticação no Nest.js:
>
> - **Registro** de usuário com email + senha (bcrypt hash). Campos: email, password, role (`patient` | `doctor` | `secretary` | `admin`).
> - **Login** retornando JWT access token (expira 30min) + refresh token (expira 7 dias). Payload do JWT: `{ sub: userId, role, iat, exp }`.
> - **Refresh token** com rotação (invalida o token anterior).
> - **2FA com TOTP** (speakeasy ou otplib):
>   - Setup que retorna QR code
>   - Verify que valida o código
>   - Geração de 10 códigos de recuperação descartáveis
> - **2FA obrigatório para `role=doctor`** (RN-015): bloquear acesso ao prontuário se `two_factor_enabled=false`.
> - **SMS fallback** via Twilio para 2FA.
> - **Guards do Nest.js:** `JwtAuthGuard` (valida token), `RolesGuard` (valida role), `TwoFactorGuard` (valida 2FA ativo para médicos).
> - **Decorator** `@Roles('doctor', 'admin')` para proteger rotas.
> - **Rate limiting com Redis** (RNF-012.1):
>   - 100 req/min por IP (não autenticado)
>   - 300 req/min por usuário (autenticado)
>   - 5 tentativas/15min para login
> - **Anti-brute force escalonado** (RNF-012.2):
>   - 3 falhas → CAPTCHA
>   - 5 falhas → bloqueio 15min
>   - 10 falhas → bloqueio 1h
>   - 20 falhas → bloqueio permanente + notificação
> - **Filtragem:** bloqueio de User-Agents suspeitos, blacklist de IPs, Content-Type restrito a JSON/multipart.
> - **Códigos de erro:** AUTH_1001 a AUTH_1007 conforme catálogo.

---

### 4.2 Frontend

#### Prompt de Instrução — Frontend Parte 2

> Crie as telas de autenticação:
>
> - **Tela de Login:** email + senha, link para registro, feedback de erro contextual (AUTH_1001, AUTH_1005, AUTH_1006).
> - **Tela de Registro:** formulário com email, senha (com medidor de força), confirmação, role (apenas `patient` no registro público).
> - **Tela de 2FA Setup:** exibição de QR code, input para código de verificação, exibição dos códigos de recuperação.
> - **Tela de 2FA Verify:** input de 6 dígitos no login, opção "Usar código de recuperação".
> - **Interceptor de 401:** refresh automático, retry da requisição original, redirect para login se refresh falhar.
> - **CAPTCHA** integration (reCAPTCHA ou hCaptcha) ativado após AUTH_1006.
> - **Tela de Conta Bloqueada:** mensagem específica por nível de bloqueio.
> - **Redirect pós-login** baseado em role:
>   - `patient` → `/app`
>   - `doctor` → `/dashboard`
>   - `secretary` → `/dashboard`
>   - `admin` → `/admin`
> - **Provider de autenticação** (Zustand): armazena user, token, role. Persiste em sessionStorage.

---

### 4.3 Critérios de Aceitação da Parte 2

- [ ] Paciente consegue se registrar, logar e acessar apenas rotas de paciente
- [ ] Médico é forçado a configurar 2FA no primeiro acesso
- [ ] Sem 2FA ativo, médico não acessa prontuário
- [ ] Após 5 tentativas de login com falha, conta é bloqueada por 15 minutos
- [ ] Sessão expira após 30min de inatividade
- [ ] Rate limiting funciona: exceder limites retorna RATE_7001

---

## 5. Parte 3 — LGPD, Consentimento e Auditoria

**Objetivo:** Garantir conformidade com LGPD, registrar consentimentos e implementar auditoria completa.

**Duração estimada:** 3–4 dias

**RFs cobertos:** RF-001 (Consentimento LGPD)

**RNs cobertos:** RN-008 (Auditoria), RN-011 (Compartilhamento), RN-012 (Retenção), RNF-001 (Criptografia), RNF-005 (Rastreabilidade), RNF-008 (Exportação), RNF-009 (Logs WORM), RNF-011 (Field-Level Encryption)

---

### 5.1 Backend

#### Prompt de Instrução — Backend Parte 3

> Implemente o módulo LGPD e auditoria:
>
> - **CRUD da tabela `consent_logs`:** registro de aceite com timestamp, versão dos termos, IP de origem. Tipos: `terms_of_use`, `data_processing`, `data_sharing`.
> - **Middleware de consentimento:** bloquear acesso às funcionalidades até que consentimento seja fornecido (retornar LGPD_8001). Histórico imutável.
> - **Revogação** de consentimento pelo paciente a qualquer momento, com log.
> - **Interceptor global de auditoria** (`audit_logs`): registrar automaticamente `user_id`, `patient_id`, `action_type`, `resource_type`, `resource_id`, `ip_address`, `user_agent`, `success` em TODA operação que acesse dados de paciente.
> - **Logs imutáveis:** tabela `audit_logs` sem UPDATE ou DELETE (WORM). Retenção mínima 5 anos.
> - **Field-Level Encryption** com AES-256 nos campos:
>   - `patient_profiles.phone`
>   - `users.email`
>   - `clinical_documents.extracted_text`
>   - `daily_logs.notes`
>   - Chave mestra em variável de ambiente. Rotação a cada 12 meses.
> - **Endpoint de exportação** de dados do paciente (portabilidade LGPD — RNF-008): gerar JSON ou PDF consolidado com todos os dados do paciente.
> - **Endpoint** para paciente solicitar relatório de quem acessou seu prontuário.
> - **Hash SHA-256** em todo registro clínico para garantir integridade (RNF-005).
> - **Token temporário** (7 dias) para compartilhamento de prontuário com terceiros (RN-011).

---

### 5.2 Frontend

#### Prompt de Instrução — Frontend Parte 3

> Crie as telas de LGPD:
>
> - **Tela de Onboarding/Consentimento:** exibir termos de uso e política de dados. Checkbox granular por tipo. Botão "Aceitar". Bloquear navegação até aceite.
> - **Página de Privacidade** (configurações do paciente):
>   - Visualizar consentimentos ativos
>   - Revogar consentimentos
>   - Solicitar exportação de dados
>   - Visualizar log de acessos ao prontuário
> - **Modal de Compartilhamento de Prontuário:** gerar link temporário, exibir validade e para quem foi compartilhado.

---

### 5.3 Critérios de Aceitação da Parte 3

- [ ] Novo usuário é bloqueado até fornecer consentimento
- [ ] Consentimento é registrado com timestamp, versão e IP
- [ ] Toda operação em dados de paciente gera log de auditoria
- [ ] Campos sensíveis estão criptografados no banco (verificar via `psql` direto)
- [ ] Paciente consegue exportar seus dados em JSON
- [ ] Token de compartilhamento expira após 7 dias

---

## 6. Parte 4 — Perfil do Paciente e Daily Log

**Objetivo:** Implementar o app do paciente com prontuário pessoal, diário do sono, humor/sintomas e atividade física.

**Duração estimada:** 5–7 dias

**RFs cobertos:** RF-003 (Meus Dados), RF-004 (Sono), RF-005 (Humor), RF-006 (Medicamentos), RF-023 (Atividade Física)

**RNs cobertos:** RN-001 (gatilho secundário — ideação suicida), RN-002 (Interações medicamentosas)

---

### 6.1 Backend

#### Prompt de Instrução — Backend Parte 4

> Implemente os módulos de perfil e daily log:
>
> - **CRUD `patient_profiles`:** peso (`CHECK > 0 AND < 500`), altura (`CHECK > 0 AND < 300`), queixa principal, diagnósticos. Versionamento de alterações. Paciente só edita seus próprios dados.
> - **CRUD `daily_logs`** com UNIQUE constraint `(patient_id, date)` — apenas 1 registro por paciente/dia.
> - **Validações do Diário do Sono** (RF-004):
>   - `sleep_onset_time` > `sleep_bedtime`
>   - `sleep_wake_time` > `sleep_onset_time`
>   - Campos: bedtime, onset_time, wake_time, awakenings (>= 0), quality (1-5), difficulty (boolean)
> - **Diário de Humor** (RF-005):
>   - `mood_rating` (1-5), `mood_tags` (JSONB), `side_effects_checklist` (JSONB selecionável de lista padrão + "outros"), `notes` (texto livre criptografado)
> - **GATILHO CRÍTICO:** Se resposta positiva a ideação suicida (`suicidal_ideation_flag = true`):
>   - Setar `risk_flag = true`
>   - Disparar criação de alerta na tabela `alerts` com `severity = 'high'` e `trigger_source = 'suicidal_ideation'`
>   - Isso será consumido pela Parte 6
> - **Atividade Física** (RF-023): `exercise_category` (enum), `exercise_intensity` (enum), `exercise_duration_min` (`CHECK > 0`).
> - **Central de Medicamentos** (RF-006): endpoint GET que retorna prescrições ativas do paciente com `interaction_tags` do medicamento. Indicador visual ativa vs. expirada.
> - **Endpoint** para médico configurar perguntas norteadoras da escrita terapêutica.

---

### 6.2 Frontend

#### Prompt de Instrução — Frontend Parte 4

> Crie o App do Paciente (mobile first):
>
> - **Home do Paciente:** card de resumo do dia (preencheu sono? humor? atividade?), acesso rápido aos diários, card de medicamentos ativos.
> - **Tela "Meus Dados"** (RF-003): formulário de peso, altura, queixas. Histórico de alterações acessível.
> - **Diário do Sono** (RF-004): time pickers para deitar/dormir/acordar, slider para qualidade (1-5 com emojis), counter para despertares, toggle "demorou a dormir".
> - **Diário de Humor** (RF-005): escala Likert visual com emojis (1-5), campo de texto para escrita terapêutica com perguntas norteadoras, checklist de efeitos colaterais com multi-select + campo "outros".
> - **NOTA DE SEGURANÇA:** pergunta sobre ideação suicida com UI sensível — resposta positiva aciona Sentinela automaticamente.
> - **Atividade Física** (RF-023): seletor de categoria, intensidade e duração.
> - **Central de Medicamentos** (RF-006): lista de medicamentos prescritos, Info Cards com dicas de segurança baseados em `interaction_tags`, indicador visual ativo/expirado, link para bula.

---

### 6.3 Critérios de Aceitação da Parte 4

- [ ] Paciente consegue registrar sono, humor e atividade física
- [ ] Apenas 1 registro por dia é permitido (UNIQUE constraint funciona)
- [ ] Validações de horário do sono funcionam (onset > bedtime, wake > onset)
- [ ] Flag de ideação suicida cria alerta automaticamente na tabela `alerts`
- [ ] Central de medicamentos exibe dicas de segurança corretas
- [ ] Dados pessoais são versionados (histórico acessível)

---

## 7. Parte 5 — Dashboard Médico e Linha do Tempo

**Objetivo:** Criar o dashboard web do médico com linha do tempo e gráficos correlacionais.

**Duração estimada:** 5–7 dias

**RFs cobertos:** RF-009 (Linha do Tempo), RF-010 (Gráficos), RF-008 (FAQ)

**RNs cobertos:** RN-003 (Feedback Loop), RNF-003 (Performance < 2s)

---

### 7.1 Backend

#### Prompt de Instrução — Backend Parte 5

> Implemente os endpoints do dashboard médico:
>
> - **GET `/api/v1/patients/:id/timeline`** — agregação cronológica de: daily_logs (sono, humor, atividade), consultas, prescrições, evoluções clínicas, alertas. Paginação cursor-based. **Meta de performance: < 2 segundos** (RNF-003).
> - **GET `/api/v1/patients/:id/correlations`** — dados formatados para gráficos:
>   - Dose do Medicamento × Qualidade do Sono
>   - Dose do Medicamento × Variação de Humor
>   - Atividade Física × Humor
>   - Latência do Sono × Humor
>   - Filtros por período
> - **POST `/api/v1/patients/:id/timeline/markers`** — Marcadores de Ajuste do médico (RN-003): texto, data, tipo (ex: `ajuste_dose`, `mudanca_terapeutica`). Aparecem como anotações verticais nos gráficos.
> - **GET `/api/v1/doctor/patients`** — lista de pacientes do médico com indicadores: último registro, alertas pendentes, próxima consulta.
> - **Índices otimizados:** `idx_patient_datetime`, `idx_daily_logs_patient_date`. Cache com TanStack Query (staleTime configurado).

---

### 7.2 Frontend

#### Prompt de Instrução — Frontend Parte 5

> Crie o Dashboard Médico (web, responsivo):
>
> - **Página principal:** lista de pacientes com cards (nome, último registro, status de alerta, próxima consulta). Busca e filtros.
> - **Linha do Tempo do Paciente** (RF-009): timeline vertical com todos os eventos. Filtros por tipo (sono, humor, consulta, prescrição). Lazy loading. Target: leitura em 5min antes da consulta.
> - **Gráficos Correlacionais** (RF-010): usar Recharts ou Chart.js. 4 gráficos obrigatórios (Dose × Sono, Dose × Humor, Atividade × Humor, Latência × Humor). Marcadores de Ajuste como linhas verticais anotadas. Seletor de período.
> - **Botão "Adicionar Marcador":** modal com texto e tipo do marcador.
> - **Página FAQ e Suporte** (RF-008): accordion com dúvidas frequentes, links para WhatsApp/Instagram corporativo.

---

### 7.3 Critérios de Aceitação da Parte 5

- [ ] Linha do tempo carrega em < 2 segundos
- [ ] 4 gráficos correlacionais renderizam corretamente
- [ ] Marcadores de ajuste aparecem nos gráficos como anotações verticais
- [ ] Lista de pacientes mostra indicadores corretos (alertas, último registro)
- [ ] Paginação cursor-based funciona na timeline

---

## 8. Parte 6 — Sistema Sentinela (Alertas de Risco)

**Objetivo:** Implementar o sistema de detecção de risco e workflow de alertas.

**Duração estimada:** 4–5 dias

**RFs cobertos:** RF-011 (Alertas de Risco)

**RNs cobertos:** RN-001 (Algoritmo Sentinela), RN-018 (Workflow), RNF-002 (Alta Disponibilidade)

---

### 8.1 Backend

#### Prompt de Instrução — Backend Parte 6

> Implemente o Sistema Sentinela:
>
> - **Serviço de detecção de risco** executado após cada criação/atualização de `daily_log`:
>   - **Gatilho Primário:** `mood_rating <= 2` por 3 dias consecutivos → criar alerta `severity = 'medium'`
>   - **Gatilho Secundário:** `suicidal_ideation_flag = true` → criar alerta `severity = 'high'`
>   - Setar `risk_flag = true` no daily_log quando qualquer gatilho dispara
> - **Máquina de estados de alertas** (RN-018):
>   - `pending → viewed → contacted → resolved | false_positive | escalated`
>   - Validação de transições (impedir transições inválidas, retornar CON_3004)
> - **Campos ao resolver:** `resolution_notes`, `contact_method` (phone, whatsapp, email, in_person)
> - **SLA automático:** Cron job que verifica alertas `pending > 24h` e dispara email ao supervisor
> - **Recuperação automática:** se `mood > 3` após alerta ativo, sistema sugere transição para resolved (não transiciona automaticamente)
> - **Logs de erro críticos** para falhas no envio de alertas (RNF-002)

---

### 8.2 Frontend

#### Prompt de Instrução — Frontend Parte 6

> Crie o painel de alertas:
>
> - **Dashboard "Pacientes em Atenção"** (RF-011): lista priorizada por severidade (`high > medium > low`). Indicador visual: alertas `pending > 24h` em vermelho (SLA).
> - **Card de alerta:** nome do paciente, trigger, data, severidade, status atual. Expandir para ver histórico de ações.
> - **Ações:** marcar como visualizado, registrar contato (com método), resolver, marcar falso positivo, escalar. Cada ação com confirmação.
> - **Badge de alertas** pendentes no header do dashboard para médico e secretária.
> - **Acessível para roles:** `doctor` e `secretary`.

---

### 8.3 Critérios de Aceitação da Parte 6

- [ ] 3 dias com mood <= 2 gera alerta medium automaticamente
- [ ] Flag de ideação suicida gera alerta high imediatamente
- [ ] Transições de estado do alerta funcionam corretamente
- [ ] Transições inválidas são bloqueadas
- [ ] Alertas pending > 24h são destacados visualmente
- [ ] Secretária e médico conseguem gerenciar alertas

---

## 9. Parte 7 — Prontuário Eletrônico (PEP)

**Objetivo:** Implementar o registro de consultas com versionamento, assinatura digital e evolução clínica.

**Duração estimada:** 7–10 dias

**RFs cobertos:** RF-014 (Consultas), RF-015 (Evolução), RF-018 (Plano Terapêutico), RF-019 (Atestados), RF-020 (Assinatura Digital)

**RNs cobertos:** RN-004 (Versionamento), RN-005 (Controle de Acesso), RN-007 (Completude), RN-009 (Bloqueio Retroativo), RN-016 (Máquina de Estados)

---

### 9.1 Backend

#### Prompt de Instrução — Backend Parte 7

> Implemente o PEP completo:
>
> - **CRUD de consultas** (`consultations`) com máquina de estados RN-016:
>   - `draft → finalized` (requer campos obrigatórios + assinatura)
>   - `draft → cancelled` (médico criador, qualquer momento, `cancelled_reason` obrigatório)
>   - `finalized → cancelled` (apenas admin, com justificativa)
>   - **Transições proibidas:** `finalized → draft`, `cancelled → qualquer`
> - **Campos obrigatórios para finalização:**
>   - `date_time` (não pode ser futuro)
>   - `duration_minutes` (>= 15)
>   - `modality` ('presencial' | 'telemedicina')
>   - `anamnesis` (>= 50 caracteres)
>   - `icd10_codes` (validados contra base oficial)
>   - `treatment_plan`
>   - `signature_hash`
> - **Versionamento** (RN-004): cada edição cria nova versão (`version` + `parent_id`). Versões anteriores acessíveis.
> - **Bloqueio retroativo** (RN-009): consultas finalizadas há > 24h não podem ser editadas. Apenas médico criador (`created_by`) pode editar.
> - **Alerta de completude** (RN-007): endpoint que retorna campos faltantes antes de finalizar.
> - **Controle de acesso** (RN-005): apenas `doctor_id` edita. Paciente tem read-only.
> - **CRUD de evoluções clínicas** (`clinical_evolutions` — RF-015):
>   - Tipos: `note`, `phone_call`, `crisis`, `hospitalization`, `significant_change`
>   - Campo `is_important_marker`
> - **CRUD de planos terapêuticos** (`therapeutic_plans` — RF-018):
>   - Objetivos curto/médio/longo prazo
>   - Metas mensuráveis, estratégias, frequência de revisão
> - **Geração de atestados e relatórios** (RF-019): templates personalizáveis, geração de PDF.
> - **Assinatura digital** (RF-020):
>   - Integração com SDK ICP-Brasil (A1 e A3)
>   - Validação contra LCR
>   - Gerar `signature_hash` com timestamp
>   - Log de auditoria de todas as assinaturas
> - **NOTA MVP:** Se a integração ICP-Brasil for muito complexa, implementar assinatura simplificada (hash do conteúdo + timestamp + doctor_id) e deixar a integração completa como melhoria.

---

### 9.2 Frontend

#### Prompt de Instrução — Frontend Parte 7

> Crie as telas do PEP:
>
> - **Formulário de Consulta:** todos os campos obrigatórios, autocomplete CID-10, indicador de campos faltantes (vermelho), botão "Salvar Rascunho" e "Finalizar e Assinar".
> - **Histórico de versões:** diff visual entre versões, quem editou e quando.
> - **Evoluções Clínicas:** timeline lateral com notas rápidas, marcadores visuais para eventos importantes.
> - **Plano Terapêutico:** formulário estruturado com seções curto/médio/longo prazo. Progress bar de metas.
> - **Geração de Atestados:** seletor de template, preview, download PDF.
> - **Modal de Assinatura:** solicitar certificado digital, exibir confirmação.
> - **Visualização read-only para paciente:** prontuário clínico completo, sem edição.

---

### 9.3 Critérios de Aceitação da Parte 7

- [ ] Consulta em draft pode ser editada e finalizada
- [ ] Finalização exige todos os campos obrigatórios + assinatura
- [ ] Consulta finalizada há > 24h não aceita edição
- [ ] Cada edição cria nova versão (histórico acessível)
- [ ] Apenas médico criador edita; paciente tem read-only
- [ ] Transições proibidas retornam erro CON_3004
- [ ] Evoluções clínicas aparecem na timeline
- [ ] Atestado é gerado como PDF

---

## 10. Parte 8 — Prescrições e Validações CID-10

**Objetivo:** Implementar o receituário digital com todas as validações clínicas e regulatórias.

**Duração estimada:** 5–7 dias

**RFs cobertos:** RF-017 (Prescrições Formais)

**RNs cobertos:** RN-006 (Validação de Prescrição), RN-010 (Prescrição × Diagnóstico), RN-013 (CID-10), RN-017 (Ciclo de Vida)

---

### 10.1 Backend

#### Prompt de Instrução — Backend Parte 8

> Implemente o sistema de prescrições:
>
> - **Seed da tabela `icd10_codes`** com todos os códigos do capítulo F (F00-F99) no mínimo. Validação via regex: `^[A-Z]\d{2}(\.\d{1,2})?$`.
> - **CRUD `formal_prescriptions`** vinculado obrigatoriamente a uma consulta.
> - **Tipos:** `simples`, `controle_especial`, `antimicrobiano`.
> - **Campos obrigatórios para controle especial:**
>   - Identificação prescritor (CRM + UF)
>   - Identificação paciente (CPF)
>   - Medicamento (DCB/DCI), concentração, forma farmacêutica
>   - Posologia detalhada
>   - Quantidade (número + extenso)
>   - Assinatura ICP-Brasil
> - **Validação Prescrição × Diagnóstico** (RN-010):
>   - Alerta se medicamento não tem indicação para CID informado (via `medications.indication_cids`)
>   - Para psicotrópicos: ao menos 1 CID do capítulo F obrigatório
>   - Alerta vermelho se dose > `max_daily_dose`
> - **Ciclo de vida** (RN-017):
>   - `is_valid = true` na criação
>   - `valid_until = created_at + 30 dias` (controle especial)
>   - Cron job diário para expirar
>   - Revogação manual pelo médico
>   - **Exclusividade:** bloquear prescrição duplicada para mesmo medicamento se já existe ativa (PRE_4002)
>   - **Irreversibilidade:** prescrições invalidadas não podem ser reativadas
> - **Alerta de interação medicamentosa:** ao prescrever, verificar `interaction_tags` de TODOS os medicamentos ativos do paciente.
> - **Geração de PDF** do receituário: template formatado conforme Portaria 344/98.
> - **Autocomplete CID-10** com priorização pelo histórico do médico.
> - **Códigos de erro:** PRE_4001 a PRE_4006, CID_5001 a CID_5003.

---

### 10.2 Frontend

#### Prompt de Instrução — Frontend Parte 8

> Crie as telas de prescrição:
>
> - **Formulário de Prescrição:** seletor de tipo, busca de medicamento com autocomplete, campos dinâmicos (controle especial mostra campos extras). Autocomplete CID-10.
> - **Alertas visuais em tempo real:**
>   - Interação medicamentosa (amarelo)
>   - Dose acima do máximo (vermelho)
>   - CID incompatível (vermelho)
> - **Preview** do receituário antes de assinar.
> - **Lista de prescrições** do paciente: ativas vs. expiradas/revogadas, com filtros.
> - **Botão de revogar** prescrição com confirmação e motivo obrigatório.
> - **Download/impressão** do PDF formatado.

---

### 10.3 Critérios de Aceitação da Parte 8

- [ ] Validação CID-10 funciona (regex + base oficial)
- [ ] Prescrição de controle especial exige todos os campos extras
- [ ] Alerta aparece quando medicamento não tem indicação para CID
- [ ] Prescrição duplicada para mesmo medicamento é bloqueada
- [ ] Cron job expira prescrições após 30 dias
- [ ] PDF do receituário é gerado corretamente
- [ ] Interações medicamentosas são detectadas

---

## 11. Parte 9 — Notificações e Agendamento

**Objetivo:** Implementar o sistema multicanal de notificações e o módulo de agendamento de consultas.

**Duração estimada:** 4–5 dias

**RFs cobertos:** RF-012 (Notificações), RF-025 (Agendamento)

---

### 11.1 Backend

#### Prompt de Instrução — Backend Parte 9

> Implemente notificações e agendamento:
>
> - **Serviço de notificações** com `@nestjs/schedule`:
>   - Manhã (padrão 8h): lembrete preenchimento sono
>   - Noite (padrão 21h): lembrete humor/atividade
>   - 48h antes consulta: confirmação de agendamento
> - **Providers:** Evolution API (WhatsApp), NodeMailer (Email), Twilio (SMS).
> - **Fallback:** se WhatsApp falhar, enviar email. Log de TODAS as tentativas na tabela `notifications_log` (status: sent, failed, pending; retry_count).
> - **Horários configuráveis** por paciente.
> - **CRUD de `appointments`** (RF-025):
>   - Máquina de estados: `scheduled → confirmed → completed | cancelled | no_show`
>   - Reagendamento pelo paciente até 24h antes
>   - Visão de calendário para médico com slots disponíveis
> - **Notificação automática** 48h antes da consulta.

---

### 11.2 Frontend

#### Prompt de Instrução — Frontend Parte 9

> Crie as telas de notificações e agendamento:
>
> - **Configurações de Notificação** (paciente): toggles por canal (push, whatsapp, email), configuração de horários preferenciais.
> - **Calendário do Médico:** visão semanal/mensal, slots disponíveis, consultas agendadas com status visual.
> - **Agendamento pelo Paciente:** seletor de data/horário com slots disponíveis, confirmação, reagendamento.
> - **Lista de consultas agendadas** para paciente e médico.
> - **Histórico de notificações** enviadas (admin).

---

### 11.3 Critérios de Aceitação da Parte 9

- [ ] Notificações são enviadas nos horários configurados
- [ ] Fallback WhatsApp → email funciona
- [ ] Todas as tentativas são logadas em `notifications_log`
- [ ] Paciente consegue agendar e reagendar consultas
- [ ] Reagendamento é bloqueado com < 24h de antecedência
- [ ] Médico vê calendário com slots ocupados/disponíveis

---

## 12. Parte 10 — Upload de Mídia, Busca Full-Text e Polish Final

**Objetivo:** Implementar upload de documentos, busca avançada, e realizar QA e polish final do sistema.

**Duração estimada:** 5–7 dias

**RFs cobertos:** RF-016 (Exames/Documentos), RF-021 (Busca), RF-022 (Blob Storage)

**RNFs cobertos:** RNF-010 (Full-Text Search)

---

### 12.1 Backend

#### Prompt de Instrução — Backend Parte 10

> Implemente upload, busca e finalizações:
>
> - **Upload de documentos** (RF-016/RF-022):
>   - Integração com Supabase Storage ou S3
>   - Validações: máximo 10MB (DOC_6001), formatos PDF/JPG/PNG/DICOM (DOC_6002)
>   - Nomenclatura obrigatória: `[TipoExame]_[DataExame]_[NomePaciente]`
>   - Compressão automática de imagens > 2MB
>   - CDN para servir imagens
> - **Metadados obrigatórios:** data do exame, laboratório, médico solicitante, categoria (`laboratorial`, `imagem`, `psicométrico`, `outros`).
> - **OCR automático** (Tesseract.js ou Google Vision API) para extração de texto e indexação.
> - **Hash SHA-256** de cada arquivo para integridade.
> - **Rate limit de uploads:** 10 docs/hora por paciente (RATE_7003).
> - **Busca Full-Text** (RF-021/RNF-010):
>   - Implementar `ts_vector` no PostgreSQL nos campos: `anamnesis` (consultations), `notes` (daily_logs), `extracted_text` (clinical_documents), `content` (clinical_evolutions)
>   - Índice GIN
>   - Filtros por período, tipo de registro, medicamentos, diagnósticos
>   - **Performance < 500ms** para 10.000 registros
> - **Endpoint de busca unificada:** `GET /api/v1/patients/:id/search?q=&type=&from=&to=`
> - **Revisão final:** verificar todos os códigos de erro mapeados, testar todas as máquinas de estado, validar constraints do banco, rodar migration em ambiente limpo.

---

### 12.2 Frontend

#### Prompt de Instrução — Frontend Parte 10

> Crie as telas finais e faça o polish:
>
> - **Upload de Documentos** (RF-016): drag-and-drop com preview, progress bar, validação de tamanho/formato em tempo real, formulário de metadados.
> - **Galeria de Documentos:** grid/lista com filtros por categoria, busca por nome, preview de PDFs e imagens.
> - **Busca Avançada** (RF-021): campo de busca global no dashboard, resultados agrupados por tipo (consulta, documento, evolução), highlight dos termos encontrados.
> - **QA e Polish:**
>   - Revisar responsividade mobile de TODAS as telas
>   - Testar fluxos completos end-to-end
>   - Verificar acessibilidade (contraste, labels, tab navigation)
>   - Otimizar bundle size, lazy loading de rotas
> - **Testes de performance:** linha do tempo < 2s, busca < 500ms, upload estável.

---

### 12.3 Critérios de Aceitação da Parte 10

- [ ] Upload aceita PDF/JPG/PNG até 10MB e rejeita outros formatos
- [ ] OCR extrai texto e é indexado para busca
- [ ] Busca full-text retorna resultados em < 500ms
- [ ] Busca unificada agrupa por tipo de registro
- [ ] Imagens > 2MB são comprimidas automaticamente
- [ ] TODAS as telas funcionam em mobile (320px+)
- [ ] Fluxos e2e: registro → login → daily log → consulta → prescrição → busca

---

## 13. Boas Práticas para Vibe Coding com este Plano

### 13.1 Como usar os prompts

- Copie o prompt de instrução da parte atual (Backend ou Frontend) e cole na ferramenta de vibe coding (Cursor, Copilot, Claude Code, etc).
- Antes de cada prompt, forneça contexto: *"Estamos na Parte X do plano. As Partes 1 a X-1 já estão implementadas. Aqui está o schema atual do Prisma: [cole o schema]"*.
- Ao concluir cada parte, **TESTE todos os critérios de aceitação** antes de avançar.
- Se uma parte ficar muito grande, divida o prompt em sub-partes (ex: "Parte 7A: Consultas" e "Parte 7B: Evoluções e Planos").

### 13.2 Contexto essencial para cada prompt

- Sempre inclua: `schema.prisma` atual, estrutura de pastas, códigos de erro já implementados.
- Para o frontend: inclua também os tipos TypeScript gerados pelo Prisma e os endpoints já disponíveis.
- Para o backend: inclua guards e decorators já existentes.

### 13.3 Estratégia de testes

- A cada parte, peça ao vibe coding para gerar testes unitários dos serviços críticos.
- Priorize testes em: máquinas de estado (consultas, prescrições, alertas), validações CID-10, lógica do Sentinela e controle de acesso RBAC.

---

## 14. Cronograma Estimado (MVP — 12 semanas)

| Semana | Parte | Entrega |
|--------|-------|---------|
| 1 | Parte 1 | Fundação e infraestrutura |
| 2 | Parte 2 | Autenticação completa com 2FA e RBAC |
| 3 | Parte 3 | LGPD, consentimento e auditoria |
| 4–5 | Parte 4 | App do paciente (perfil + daily logs) |
| 5–6 | Parte 5 | Dashboard médico + gráficos |
| 6–7 | Parte 6 | Sistema Sentinela |
| 7–9 | Parte 7 | Prontuário eletrônico completo |
| 9–10 | Parte 8 | Prescrições e CID-10 |
| 10–11 | Parte 9 | Notificações e agendamento |
| 11–12 | Parte 10 | Upload, busca e QA final |

> **Nota:** Este cronograma assume um desenvolvedor trabalhando tempo integral com auxílio de vibe coding. Com mais desenvolvedores, partes com dependências independentes podem ser paralelizadas (ex: Frontend Parte 4 e Backend Parte 5 em paralelo, desde que os endpoints estejam mockados).

---

## 15. Próximos Passos para Aprofundamento

### 15.1 Durante o MVP

- Engajar consultor jurídico para validação LGPD e termos de uso antes do lançamento
- Realizar PoC de assinatura digital ICP-Brasil na semana 1 para mitigar risco
- Configurar Sentry desde a Parte 1 para rastrear bugs durante desenvolvimento

### 15.2 Pós-MVP (Fase 2)

- RF-013: Integração com wearables (Apple HealthKit, Garmin)
- RF-024: Integração com Memed/iClinic via HL7 FHIR
- RF-007: Área de conteúdo (meditações guiadas)
- Migração de notificações para n8n (self-hosted) quando volume > 1000/dia
- Migração de infra para AWS/GCP quando escala justificar

### 15.3 Profissionalização Técnica

- **Certificações:** AWS Solutions Architect (infra), LGPD Essentials (compliance), HL7 FHIR (interoperabilidade em saúde)
- **Observabilidade avançada:** Grafana + Prometheus para métricas, distributed tracing com OpenTelemetry
- **GitOps:** ArgoCD/FluxCD para deploy automatizado
- **Testes avançados:** Playwright (e2e frontend), Pact (testes de contrato API)
- **Arquitetura:** Clean Architecture, Event Sourcing (auditoria), CQRS (performance leitura vs. escrita)
- **Segurança avançada:** OWASP Top 10, pen testing, SOC 2 compliance

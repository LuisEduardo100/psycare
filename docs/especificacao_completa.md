# SaaS Monitoramento Clínico — Especificação Técnica v2.0

**DOCUMENTO DE ESPECIFICAÇÃO TÉCNICA**
**SaaS de Monitoramento Clínico e Fidelização**
**Versão 2.0 — Revisada e Consolidada**
**Data: Fevereiro de 2026**

---

## Controle do Documento

### Histórico de Versões

| Versão | Data       | Autor                              | Descrição                                                                                      |
|--------|------------|------------------------------------|-------------------------------------------------------------------------------------------------|
| 1.0    | 2026-02-07 | Luís Eduardo de Paula Albuquerque  | Versão inicial do documento de requisitos                                                       |
| 2.0    | 2026-02-14 | Luís Eduardo de Paula Albuquerque  | Revisão completa: correção de gaps, consolidação de regras de negócio, padronização de schema   |

---

## Índice

- [1. Visão Geral do Produto](#1-visão-geral-do-produto)
  - [1.1. Descrição](#11-descrição)
  - [1.2. Estratégia de MVP](#12-estratégia-de-mvp)
  - [1.3. Personas](#13-personas)
- [2. Requisitos Funcionais (RF)](#2-requisitos-funcionais-rf)
  - [2.1. Módulo 1 — Gestão de Identidade e Onboarding](#21-módulo-1--gestão-de-identidade-e-onboarding)
  - [2.2. Módulo 2 — App do Paciente (Input de Dados)](#22-módulo-2--app-do-paciente-input-de-dados)
  - [2.3. Módulo 3 — Dashboard Médico (Análise e Decisão)](#23-módulo-3--dashboard-médico-análise-e-decisão)
  - [2.4. Módulo 4 — Notificações e Integrações](#24-módulo-4--notificações-e-integrações)
  - [2.5. Módulo 5 — Prontuário Eletrônico do Paciente (PEP)](#25-módulo-5--prontuário-eletrônico-do-paciente-pep)
- [3. Regras de Negócio (RN)](#3-regras-de-negócio-rn)
  - [3.1. Segurança Clínica e Alertas](#31-segurança-clínica-e-alertas)
  - [3.2. Prontuário e Versionamento](#32-prontuário-e-versionamento)
  - [3.3. Prescrições e Validações CID-10](#33-prescrições-e-validações-cid-10)
  - [3.4. LGPD, Auditoria e Retenção de Dados](#34-lgpd-auditoria-e-retenção-de-dados)
  - [3.5. Sessão e Autenticação](#35-sessão-e-autenticação)
  - [3.6. Máquinas de Estado](#36-máquinas-de-estado)
- [4. Requisitos Não Funcionais (RNF)](#4-requisitos-não-funcionais-rnf)
  - [4.1. Segurança e Compliance](#41-segurança-e-compliance)
  - [4.2. Performance e Disponibilidade](#42-performance-e-disponibilidade)
  - [4.3. API e Interoperabilidade](#43-api-e-interoperabilidade)
  - [4.4. Backup e Recuperação](#44-backup-e-recuperação)
  - [4.5. Rate Limiting e Segurança de API (RNF-012)](#45-rate-limiting-e-segurança-de-api-rnf-012)
- [5. Catálogo de Códigos de Erro](#5-catálogo-de-códigos-de-erro)
- [6. Schema do Banco de Dados (MVP)](#6-schema-do-banco-de-dados-mvp)
  - [6.1. Gestão de Acesso e Perfis](#61-gestão-de-acesso-e-perfis)
  - [6.2. Prescrições e Medicamentos](#62-prescrições-e-medicamentos)
  - [6.3. Core: Daily Log](#63-core-daily-log)
  - [6.4. Notificações e Alertas (Sentinela)](#64-notificações-e-alertas-sentinela)
  - [6.5. Prontuário Eletrônico e Documentação Clínica](#65-prontuário-eletrônico-e-documentação-clínica)
  - [6.6. Tabelas Adicionais Identificadas (Gap Fix)](#66-tabelas-adicionais-identificadas-gap-fix)
  - [6.7. Padrão de Soft Delete](#67-padrão-de-soft-delete)
- [7. Stack de Desenvolvimento e Infraestrutura](#7-stack-de-desenvolvimento-e-infraestrutura)
- [8. Gaps Identificados e Correções Aplicadas](#8-gaps-identificados-e-correções-aplicadas)
- [9. Pontos em Aberto / Próximos Passos](#9-pontos-em-aberto--próximos-passos)
- [10. Glossário de Termos Técnicos](#10-glossário-de-termos-técnicos)

---

## 1. Visão Geral do Produto

### 1.1. Descrição

Plataforma SaaS voltada para a área médica (foco inicial em psiquiatria) com três pilares: fidelização do paciente, otimização do tempo médico e melhoria dos resultados clínicos. O sistema conecta pacientes (App Mobile/PWA) e equipe médica (Dashboard Web) para monitoramento contínuo entre consultas.

### 1.2. Estratégia de MVP

- **Metodologia:** Mobile First, entregue como PWA (Progressive Web App) instalável.
- **Foco inicial:** Psiquiatria e saúde mental.
- **Prazo estimado MVP:** 3 meses (Fase 1).

### 1.3. Personas

| Persona                  | Descrição                                                                                          | Acesso Principal       |
|--------------------------|-----------------------------------------------------------------------------------------------------|------------------------|
| Paciente                 | Usuário final que registra dados diários de saúde (sono, humor, sintomas) e acompanha seu tratamento. | App Mobile (PWA)       |
| Médico                   | Profissional de saúde que analisa dados, realiza consultas e gera prescrições.                       | Dashboard Web + App    |
| Secretária/Administrativo| Responsável por triagem de alertas, agendamento e suporte operacional.                              | Dashboard Web          |
| Administrador            | Gestão do sistema, permissões e operações excepcionais.                                             | Dashboard Web          |

---

## 2. Requisitos Funcionais (RF)

### 2.1. Módulo 1 — Gestão de Identidade e Onboarding

#### RF-001: Gestão de Consentimento (LGPD)

**Descrição:** O sistema deve registrar o aceite dos termos legais e de uso de dados sensíveis no primeiro acesso (Onboarding), com granularidade por tipo de consentimento.

**Critérios de Aceitação:**
- Registro de aceite com timestamp, versão dos termos e IP de origem.
- Suporte a revogação de consentimento pelo paciente a qualquer momento.
- Histórico imutável de todas as ações de consentimento.
- Bloqueio de acesso às funcionalidades até que o consentimento seja fornecido.

**Prioridade:** Crítica (MVP)

#### RF-002: Perfis de Acesso (RBAC)

**Descrição:** Suporte a múltiplos níveis de permissão baseado em papéis (Role-Based Access Control).

**Papéis:**

| Papel (role) | Permissões Principais                                                                           |
|--------------|--------------------------------------------------------------------------------------------------|
| patient      | CRUD do próprio prontuário pessoal, diários, visualização read-only do prontuário clínico        |
| doctor       | CRUD completo de consultas, prescrições, planos terapêuticos de seus pacientes                   |
| secretary    | Visualização de alertas, agendamento, contato com pacientes                                      |
| admin        | Gerenciamento de usuários, operações excepcionais (cancelamento de consultas finalizadas)         |

**Prioridade:** Crítica (MVP)

#### RF-026: Autenticação Multi-Fator (2FA)

**Descrição:** Sistema de autenticação com segundo fator obrigatório para médicos e opcional para demais perfis.

**Critérios de Aceitação:**
- Suporte a TOTP (Google Authenticator, Authy) como método primário.
- SMS via Twilio como fallback para 2FA.
- Obrigatório para role = doctor (conforme RN-015).
- Códigos de recuperação descartáveis gerados no setup.

**Prioridade:** Crítica (MVP)

### 2.2. Módulo 2 — App do Paciente (Input de Dados)

#### RF-003: Prontuário Pessoal ("Meus Dados")

**Descrição:** CRUD de dados antropométricos (peso, altura), diagnósticos atuais e principais queixas.

**Critérios de Aceitação:**
- Histórico completo de todas as atualizações (versionado).
- Validações: peso > 0 e < 500kg, altura > 0 e < 300cm.
- Paciente só edita seus próprios dados.

**Prioridade:** Alta (MVP)

#### RF-004: Diário do Sono

**Descrição:** Input estruturado para monitoramento diário do sono.

**Campos:**
- Horário que deitou (Timestamp)
- Horário que dormiu (Timestamp) — para cálculo de latência do sono
- Horário que acordou (Timestamp)
- Número de despertares noturnos (Integer >= 0)
- Qualidade do sono (escala 1-5)
- Indicador "Demorou a pegar no sono?" (Boolean)

**Validações:** Horário de dormir deve ser após horário de deitar. Horário de acordar deve ser após horário de dormir. Apenas um registro por paciente/dia.

**Prioridade:** Alta (MVP)

#### RF-005: Diário de Humor e Sintomas

**Descrição:** Registro diário de estado emocional e sintomas percebidos.

**Componentes:**
- **Afetivograma:** Escala Likert Visual com Emojis (1 a 5).
- **Campo de texto livre** para Escrita Terapêutica/Diário, com perguntas norteadoras configuráveis pelo médico.
- **Checklist de efeitos colaterais** percebidos (selecionáveis de lista padrão + campo "outros").

**Nota de Segurança:** Perguntas sobre ideação suicida (ex: "sentiu vontade de tirar sua vida?") devem acionar automaticamente o Sistema Sentinela (RN-001) caso a resposta seja positiva, com prioridade "high".

**Prioridade:** Alta (MVP)

#### RF-006: Central de Medicamentos Inteligente

**Descrição:** Visualização dos medicamentos prescritos com informações de segurança automáticas.

**Critérios de Aceitação:**
- Exibição de Info Cards automáticos ao receber prescrição, baseados nas interaction_tags do medicamento (ex: "Tomar preferencialmente à noite", "Não ingerir álcool").
- Indicador visual de prescrições ativas vs. expiradas.
- Link para bula (quando disponível).

**Prioridade:** Alta (MVP)

#### RF-007: Área de Conteúdo (Meditações)

**Descrição:** Player de áudio ou lista de links para meditações guiadas, personalizáveis por médico.

**Prioridade:** Baixa (Pós-MVP)

#### RF-008: FAQ e Suporte

**Descrição:** Área de dúvidas frequentes e acesso rápido ao contato corporativo (WhatsApp/Instagram).

**Prioridade:** Média (MVP)

#### RF-023: Monitoramento de Atividade Física (sem wearables)

**Descrição:** Input manual de exercícios no Daily Log.

**Campos:**
- Categoria: aeróbico, musculação, caminhada, yoga, outros
- Intensidade: leve, moderada, intensa
- Duração em minutos (Integer > 0)

**Prioridade:** Alta (MVP)

### 2.3. Módulo 3 — Dashboard Médico (Análise e Decisão)

#### RF-009: Linha do Tempo do Paciente

**Descrição:** Agregação de todos os inputs (sono, humor, notas, consultas, prescrições) em timeline cronológica.

**Meta de Performance:** Carregamento em < 2 segundos (RNF-003), mesmo com grande volume histórico. Target: leitura rápida em 5 min antes da consulta.

**Prioridade:** Crítica (MVP)

#### RF-010: Análise Correlacional (Gráficos)

**Descrição:** Geração de gráficos comparativos cruzando variáveis clínicas.

**Correlações Obrigatórias:**
- Dose do Medicamento (Eixo X) vs. Qualidade do Sono (Eixo Y)
- Dose do Medicamento vs. Variação de Humor
- Atividade Física vs. Humor
- Latência do Sono vs. Humor (sugerido)

**Nota:** Os "Marcadores de Ajuste" inseridos pelo médico (RN-003) devem aparecer como anotações verticais nos gráficos.

**Prioridade:** Alta (MVP)

#### RF-011: Alertas de Risco (Sentinela)

**Descrição:** Dashboard de "Pacientes em Atenção" para secretária/médico, baseado nos gatilhos de risco definidos em RN-001.

**Critérios de Aceitação:**
- Lista priorizada por severidade (high > medium > low).
- Indicadores visuais de SLA (alerta pending > 24h destacado em vermelho).
- Workflow completo conforme RN-018 (pending → viewed → contacted → resolved).

**Prioridade:** Crítica (MVP)

### 2.4. Módulo 4 — Notificações e Integrações

#### RF-012: Notificações Push/WhatsApp/Email

**Descrição:** Sistema de lembretes multicanal.

**Canais e Horários:**
- **Manhã** (configurável, padrão 8h): Lembrete de preenchimento do sono
- **Noite** (configurável, padrão 21h): Lembrete de preenchimento do dia geral (humor, atividade)
- **48h antes da consulta:** Confirmação de agendamento (RF-025)

**Fallback:** Se WhatsApp falhar, enviar via email. Log de todas as tentativas.

**Prioridade:** Alta (MVP)

#### RF-013: Integração Wearables

**Descrição:** Sincronização via API (Apple HealthKit / Garmin Health API) para coleta automática de dados de sono e atividade física.

**Prioridade:** Baixa (Pós-MVP / Fase 2)

#### RF-024: Integração com Receituário Digital Padrão

**Descrição:** Compatibilidade com plataformas Memed e iClinic. Import/export de prescrições em formato HL7 FHIR.

**Prioridade:** Baixa (Pós-MVP / Fase 2)

#### RF-025: Agendamento de Consultas

**Descrição:** Calendário médico integrado com gerenciamento de agendamentos.

**Critérios de Aceitação:**
- Notificação de confirmação 48h antes.
- Reagendamento pelo paciente até 24h antes.
- Visão de calendário para médico com slots disponíveis.

**Prioridade:** Média (MVP)

### 2.5. Módulo 5 — Prontuário Eletrônico do Paciente (PEP)

#### RF-014: Registro de Consultas

**Descrição:** CRUD completo de consultas médicas com versionamento e assinatura digital.

**Campos Obrigatórios:**

| Campo                        | Tipo           | Validação                                    |
|------------------------------|----------------|----------------------------------------------|
| Data e horário               | Timestamp      | Não pode ser data futura                     |
| Duração da sessão            | Integer (min)  | Mínimo 15 minutos                            |
| Modalidade                   | Enum           | 'presencial' ou 'telemedicina'               |
| Anamnese estruturada         | Text           | Mínimo 50 caracteres                         |
| Exame físico e mental        | Text           | —                                            |
| Hipóteses diagnósticas (CID10)| JSONB Array   | Validado contra base oficial (RN-013)        |
| Conduta terapêutica          | Text           | Obrigatório para finalização                 |
| Observações gerais           | Text           | Opcional                                     |
| Assinatura digital           | Hash + Timestamp| Obrigatória para finalizar (ICP-Brasil)     |

**Máquina de Estados:** Definida em RN-016 (draft → finalized → cancelled).

**Prioridade:** Crítica (MVP)

#### RF-015: Evolução Clínica

**Descrição:** Registro cronológico de evoluções entre consultas.
- Notas rápidas sobre ligações telefônicas ou contatos.
- Marcadores de eventos importantes (internações, crises, mudanças significativas).

**Prioridade:** Alta (MVP)

#### RF-016: Exames e Documentos

**Descrição:** Upload e gestão de documentos clínicos.

**Validações de Upload:**
- Tamanho máximo: 10MB por arquivo
- Formatos aceitos: PDF, JPG, PNG, DICOM
- Nomenclatura obrigatória: `[TipoExame]_[DataExame]_[NomePaciente]`
- OCR automático para extração de texto (facilita busca full-text)

**Metadados Obrigatórios:** Data do exame, laboratório/clínica emissora, médico solicitante, categoria.

**Categorias:** laboratorial, imagem, psicométrico, outros.

**Prioridade:** Alta (MVP)

#### RF-017: Prescrições Médicas Formais

**Descrição:** Geração de receituário digital com assinatura eletrônica e validade jurídica.

**Tipos de Receituário:** simples, controle_especial, antimicrobiano.

**Campos Obrigatórios (Controle Especial):**
- Identificação completa do prescritor (CRM + UF)
- Identificação completa do paciente (RG ou CPF)
- Nome do medicamento (DCB ou DCI)
- Concentração, forma farmacêutica, posologia detalhada
- Quantidade (em algarismos e por extenso)
- Data de emissão + Assinatura digital ICP-Brasil

**Validações:** Conforme RN-006, RN-010 e RN-017. Limitação de quantidade conforme Portaria 344/98.

**Prioridade:** Crítica (MVP)

#### RF-018: Plano Terapêutico Individualizado

**Descrição:** Documento estruturado com objetivos de curto, médio e longo prazo, metas mensuráveis e estratégias de intervenção.

**Prioridade:** Média (MVP)

#### RF-019: Atestados e Relatórios

**Descrição:** Geração de atestados médicos e relatórios (perícia, convênios, solicitação de benefícios) com templates personalizáveis.

**Prioridade:** Média (MVP)

#### RF-020: Assinatura Digital

**Descrição:** Integração com certificado digital ICP-Brasil (A1/A3) com validade jurídica.

**Critérios de Aceitação:**
- Suporte a certificados A1 (armazenado) e A3 (via token/smart card).
- Validação em tempo real contra LCR (Lista de Certificados Revogados).
- Log de auditoria de todas as assinaturas realizadas.

**Prioridade:** Crítica (MVP)

#### RF-021: Busca Avançada no Prontuário

**Descrição:** Pesquisa full-text em todo o histórico do paciente com filtros por período, tipo de registro, medicamentos e diagnósticos.

**Prioridade:** Alta (MVP)

#### RF-022: Upload de Mídia (Blob Storage)

**Descrição:** Integração com S3 ou Supabase Storage, CDN para imagens, compressão automática de imagens > 2MB.

**Prioridade:** Alta (MVP)

---

## 3. Regras de Negócio (RN)

### 3.1. Segurança Clínica e Alertas

#### RN-001: Algoritmo de Detecção de Risco (Sentinela)

**Gatilho Primário:** mood_rating <= 2 por 3 dias consecutivos.

**Gatilho Secundário (adicionado):** Resposta positiva a pergunta sobre ideação suicida no RF-005.

**Ação:** Disparo de alerta crítico (severity = 'high') no painel da secretária/médico, sugerindo contato para encaixe emergencial.

**Ação Secundária:** Taggear paciente como "Em Risco" (risk_flag = true no daily_log).

#### RN-002: Validação de Interações (Segurança Medicamentosa)

**Regra:** Ao prescrever ou cadastrar um medicamento, o backend verifica interaction_tags. Se o medicamento possui tag "sedativo_potente", exibir alerta visual no App: "Dica de Segurança: Não ingerir álcool com esta medicação".

**Nota:** As tags de interação são armazenadas como JSONB na tabela `medications.interaction_tags`.

#### RN-003: Feedback Loop da Consulta

**Regra:** Os dados do dashboard permitem que o médico insira "Marcadores de Ajuste" na linha do tempo (ex: "Aumentei dose aqui"), refletidos nos gráficos do RF-010.

### 3.2. Prontuário e Versionamento

#### RN-004: Versionamento de Prontuário

- Qualquer alteração em registro de consulta cria uma nova versão (campo version + parent_id).
- Versões anteriores permanecem acessíveis com indicação de quem editou e quando.
- Soft delete: dados nunca são realmente apagados, apenas marcados como inativos (deleted_at).

#### RN-005: Controle de Acesso ao Prontuário

- Apenas o médico responsável (doctor_id) pode editar registros.
- Paciente tem acesso read-only ao seu próprio prontuário.
- Log de auditoria registra todos os acessos (conforme RN-008).

#### RN-007: Completude de Prontuário

- Sistema alerta médico sobre campos obrigatórios não preenchidos antes de finalizar consulta.
- Indicadores visuais de "prontuário incompleto" no dashboard.

#### RN-009: Bloqueio de Edição Retrospectiva

- Consultas finalizadas há mais de 24h não podem ser editadas.
- Apenas médico criador pode editar (created_by).
- Edições geram versão nova com timestamp e user_id do editor.

### 3.3. Prescrições e Validações CID-10

#### RN-006: Validação de Prescrição

- Prescrições de medicamentos controlados requerem campos adicionais: posologia detalhada e tempo de tratamento.
- Sistema valida CID-10 e impede códigos inválidos.
- Alertas de interação medicamentosa ao prescrever novo medicamento.

#### RN-010: Validação Prescrição x Diagnóstico

- Alerta se medicamento prescrito não tem indicação para CID-10 informado.
- Para psicotrópicos, CID deve pertencer ao capítulo F (F00-F99).
- Alerta vermelho se prescrição exceder dose máxima recomendada em bula.

#### RN-013: Validação de Códigos CID-10

**Formato aceito:** Regex `^[A-Z]\d{2}(\.\d{1,2})?$` (ex: F32, F32.0, F32.01)

- Validação em tempo real com autocomplete baseado no histórico do médico.
- Tabela local atualizada semestralmente (icd10_codes).
- Para prescrições psicotrópicas: ao menos um CID do capítulo F obrigatório.

### 3.4. LGPD, Auditoria e Retenção de Dados

#### RN-008: Auditoria de Acesso ao Prontuário

- Todo acesso gera log: user_id, patient_id, timestamp, ação (view/edit/delete), IP de origem, user_agent.
- Logs são imutáveis e mantidos por no mínimo 5 anos (requisito CFM).
- Paciente pode solicitar relatório de quem acessou seu prontuário.

#### RN-011: Consentimento para Compartilhamento

- Prontuário só pode ser compartilhado com terceiros mediante autorização explícita.
- Compartilhamento gera token temporário (validade 7 dias).
- Log inclui: para quem, quando e quais registros.

#### RN-012: Retenção e Descarte de Dados

- Prontuários mantidos por no mínimo 20 anos (CFM Resolução 1.821/2007).
- Soft delete: nenhum dado clínico é apagado fisicamente.
- Paciente pode solicitar anonimização (não deleção) após período legal.

### 3.5. Sessão e Autenticação

#### RN-014: Expiração de Sessão

Sessão expira após 30 minutos de inatividade. Refresh token com validade de 7 dias.

#### RN-015: 2FA Obrigatório para Médicos

Médicos devem configurar 2FA no primeiro acesso. Sem 2FA ativo, acesso ao prontuário é bloqueado.

### 3.6. Máquinas de Estado

#### RN-016: Máquina de Estados de Consultas

**Estados possíveis:** draft, finalized, cancelled.

**Transições permitidas:**

| De        | Para       | Ator            | Condições                                                                  |
|-----------|------------|-----------------|----------------------------------------------------------------------------|
| draft     | finalized  | Médico criador  | Todos os campos obrigatórios preenchidos + assinatura digital              |
| draft     | cancelled  | Médico criador  | A qualquer momento. Campo cancelled_reason obrigatório                     |
| finalized | cancelled  | Admin           | Apenas em casos excepcionais. Requer justificativa                         |

**Transições PROIBIDAS:**
- **finalized → draft:** Imutabilidade garantida após assinatura digital.
- **cancelled → qualquer estado:** Cancelamento é irreversível.

#### RN-017: Ciclo de Vida de Prescrições

**Estados:** is_valid = true (válida) ou false (expirada/revogada).

- Na criação: is_valid = true, valid_until = created_at + 30 dias (controle especial).
- Expiração automática: Cron job diário altera status quando data atual > valid_until.
- Revogação manual: Médico pode invalidar antes do prazo.
- Exclusividade: Paciente NÃO pode ter duas prescrições válidas para o mesmo medicamento.
- Irreversibilidade: Prescrições invalidadas não podem ser reativadas.

#### RN-018: Workflow de Alertas do Sistema Sentinela

**Estados:** pending → viewed → contacted → resolved | false_positive | escalated

| De        | Para            | Condição                                       |
|-----------|-----------------|-------------------------------------------------|
| pending   | viewed          | Visualizado por qualquer membro da equipe       |
| viewed    | contacted       | Após tentativa/sucesso de contato               |
| viewed    | false_positive  | Identificado que não há risco real               |
| contacted | resolved        | Paciente apresenta melhora                      |
| contacted | escalated       | Necessária intervenção urgente                   |

**Automações:**
- **SLA:** Alerta pending > 24h dispara email ao supervisor.
- **Recuperação:** Se mood > 3 após alerta, sistema sugere transição para resolved.

---

## 4. Requisitos Não Funcionais (RNF)

### 4.1. Segurança e Compliance

#### RNF-001: Segurança de Dados

- Banco de dados criptografado (Encryption at Rest).
- Comunicação via SSL/TLS em todas as rotas.
- Separação lógica entre dados de identificação (PII) e dados de saúde (PHI).

#### RNF-005: Rastreabilidade

Todo registro clínico deve ter hash SHA-256 para garantir integridade. Alterações geram nova versão com diff auditável.

#### RNF-007: Assinatura Digital

Suporte a certificados ICP-Brasil (A1 armazenado, A3 via token/smart card). Validação em tempo real contra LCR.

#### RNF-009: Tempo de Retenção de Logs

Logs de auditoria mantidos por no mínimo 5 anos em armazenamento WORM (Write Once Read Many).

#### RNF-011: Criptografia de Campos Sensíveis (Field-Level Encryption)

**Campos criptografados com AES-256:**
- `patient_profiles.phone`
- `users.email` (reversível para busca)
- `clinical_documents.extracted_text` (se contiver dados identificáveis)
- `daily_logs.notes` (escrita terapêutica pode conter dados sensíveis)

**Implementação:** Chave mestra em variável de ambiente (nunca no código). Rotação a cada 12 meses. Não criptografar campos usados em JOINs frequentes (patient_id, doctor_id).

### 4.2. Performance e Disponibilidade

#### RNF-002: Disponibilidade

O sistema de alertas (Sentinela) deve ter alta disponibilidade. Falhas no envio de alertas de risco geram logs de erro críticos.

#### RNF-003: Performance da Linha do Tempo

Carregamento em < 2 segundos, mesmo com grande volume histórico.

#### RNF-010: Busca Full-Text

Implementar índice full-text search (PostgreSQL ts_vector) em campos de texto livre (anamnesis, notes, extracted_text). Tempo de resposta < 500ms para 10.000 registros.

### 4.3. API e Interoperabilidade

#### RNF-004: API RESTful

API bem documentada com Swagger/OpenAPI. Versionamento de API (ex: /api/v1/).

#### RNF-008: Exportação de Dados (Portabilidade LGPD)

Paciente pode exportar todo seu prontuário em formato estruturado (JSON ou PDF consolidado) mediante solicitação autenticada.

### 4.4. Backup e Recuperação

#### RNF-006: Política de Backup

- Backup incremental diário.
- Backup completo semanal.
- Restauração point-in-time de até 30 dias.

### 4.5. Rate Limiting e Segurança de API (RNF-012)

#### RNF-012.1: Rate Limits Gerais

| Categoria         | Contexto            | Limite                    |
|-------------------|---------------------|---------------------------|
| API Pública       | Não autenticada     | 100 req/min por IP        |
| API Autenticada   | Usuário logado      | 300 req/min por usuário   |
| Autenticação      | Login / Register    | 5 tentativas/15min        |
| Uploads           | Documentos / Avatar | 10 docs/hora por paciente |
| Críticos          | Prescrições / Deletes| 20 prescrições/dia       |

#### RNF-012.2: Anti-Brute Force (Bloqueio Escalonado)

| Nível | Tentativas | Ação                                                  | Duração              |
|-------|------------|-------------------------------------------------------|----------------------|
| 1     | 3 falhas   | CAPTCHA obrigatório                                   | Até login bem-sucedido|
| 2     | 5 falhas   | Bloqueio temporário                                   | 15 minutos           |
| 3     | 10 falhas  | Bloqueio prolongado                                   | 1 hora               |
| 4     | 20 falhas  | Bloqueio permanente do IP + notificação à equipe de segurança | —              |

#### RNF-012.3: Proteções Adicionais

**Headers HTTP (Helmet.js):** X-Frame-Options: DENY, X-Content-Type-Options: nosniff, HSTS (1 ano), CSP configurado.

**Filtragem de Tráfego:** Bloqueio de User-Agents suspeitos, blacklist de IPs, restrição de Content-Type (JSON ou multipart/form-data).

**CORS:** Whitelist rigorosa de domínios em produção.

---

## 5. Catálogo de Códigos de Erro

**Formato:** `CATEGORIA_NUMERO` (ex: AUTH_1001). Todos os erros retornam JSON com `{ code, identifier, message, details? }`.

### Autenticação (AUTH_1xxx)

| Código    | Identificador         | Descrição                                  |
|-----------|-----------------------|--------------------------------------------|
| AUTH_1001 | INVALID_CREDENTIALS   | Email ou senha incorretos                  |
| AUTH_1002 | TOKEN_EXPIRED         | Token JWT expirado, necessário refresh     |
| AUTH_1003 | TOKEN_INVALID         | Token JWT inválido ou corrompido           |
| AUTH_1004 | UNAUTHORIZED_ACCESS   | Usuário não tem permissão para este recurso|
| AUTH_1005 | ACCOUNT_LOCKED        | Conta bloqueada por tentativas excessivas  |
| AUTH_1006 | CAPTCHA_REQUIRED      | CAPTCHA obrigatório                        |
| AUTH_1007 | TWO_FACTOR_REQUIRED   | 2FA necessário                             |

### Validação (VAL_2xxx)

| Código   | Identificador         | Descrição                        |
|----------|-----------------------|----------------------------------|
| VAL_2001 | VALIDATION_ERROR      | Erro genérico de validação       |
| VAL_2002 | MISSING_REQUIRED_FIELD| Campo obrigatório não fornecido  |
| VAL_2003 | INVALID_FORMAT        | Formato de dado inválido         |
| VAL_2004 | VALUE_OUT_OF_RANGE    | Valor fora da faixa permitida    |
| VAL_2005 | DUPLICATE_ENTRY       | Registro duplicado               |

### Consultas (CON_3xxx)

| Código   | Identificador                    | Descrição                            |
|----------|----------------------------------|--------------------------------------|
| CON_3001 | CONSULTATION_NOT_FOUND           | Consulta não encontrada              |
| CON_3002 | CONSULTATION_ALREADY_FINALIZED   | Consulta já finalizada               |
| CON_3003 | CONSULTATION_INCOMPLETE          | Campos faltantes para finalização    |
| CON_3004 | INVALID_STATE_TRANSITION         | Transição de estado não permitida    |
| CON_3005 | SIGNATURE_REQUIRED               | Assinatura digital obrigatória       |

### Prescrições (PRE_4xxx)

| Código   | Identificador                     | Descrição                                       |
|----------|-----------------------------------|-------------------------------------------------|
| PRE_4001 | PRESCRIPTION_EXPIRED              | Receita expirada                                |
| PRE_4002 | PRESCRIPTION_DUPLICATE            | Prescrição ativa duplicada                      |
| PRE_4003 | MEDICATION_NOT_FOUND              | Medicamento não cadastrado                      |
| PRE_4004 | INVALID_CID_FOR_MEDICATION        | CID-10 não válido para este medicamento         |
| PRE_4005 | DOSAGE_EXCEEDS_MAXIMUM            | Dosagem excede máximo                           |
| PRE_4006 | CONTROLLED_SUBSTANCE_VIOLATION    | Violação de regras de substância controlada     |

### CID-10 (CID_5xxx)

| Código   | Identificador        | Descrição                                 |
|----------|----------------------|-------------------------------------------|
| CID_5001 | INVALID_CID_FORMAT   | Formato inválido (esperado: A00 ou A00.0) |
| CID_5002 | CID_NOT_FOUND        | Código não existe na base oficial         |
| CID_5003 | CID_CHAPTER_MISMATCH | CID não pertence ao capítulo esperado     |

### Documentos (DOC_6xxx)

| Código   | Identificador      | Descrição                    |
|----------|---------------------|------------------------------|
| DOC_6001 | FILE_TOO_LARGE      | Arquivo excede 10MB          |
| DOC_6002 | INVALID_FILE_TYPE   | Tipo não suportado           |
| DOC_6003 | UPLOAD_FAILED       | Falha no upload              |
| DOC_6004 | DOCUMENT_NOT_FOUND  | Documento não encontrado     |
| DOC_6005 | OCR_FAILED          | Falha na extração de texto   |

### Rate Limiting (RATE_7xxx)

| Código    | Identificador          | Descrição                      |
|-----------|------------------------|--------------------------------|
| RATE_7001 | TOO_MANY_REQUESTS      | Limite de req/min excedido     |
| RATE_7002 | DAILY_LIMIT_EXCEEDED   | Limite diário excedido         |
| RATE_7003 | UPLOAD_QUOTA_EXCEEDED  | Cota de uploads excedida       |

### LGPD / Compliance (LGPD_8xxx)

| Código    | Identificador      | Descrição                      |
|-----------|---------------------|--------------------------------|
| LGPD_8001 | CONSENT_NOT_GIVEN   | Consentimento não fornecido    |
| LGPD_8002 | DATA_EXPORT_FAILED  | Falha na exportação de dados   |
| LGPD_8003 | AUDIT_LOG_FAILED    | Falha no log de auditoria      |

### Sistema (SYS_9xxx)

| Código   | Identificador           | Descrição                          |
|----------|-------------------------|------------------------------------|
| SYS_9001 | INTERNAL_SERVER_ERROR   | Erro interno                       |
| SYS_9002 | DATABASE_ERROR          | Erro de comunicação com banco      |
| SYS_9003 | EXTERNAL_SERVICE_ERROR  | Serviço externo indisponível       |
| SYS_9004 | MAINTENANCE_MODE        | Manutenção programada              |

---

## 6. Schema do Banco de Dados (MVP)

Modelagem relacional com PostgreSQL. Utiliza JSONB para flexibilidade em tags e checklists. Todas as tabelas críticas implementam soft delete (deleted_at, deleted_by).

### 6.1. Gestão de Acesso e Perfis

#### Tabela: users

| Campo              | Tipo              | Descrição                                      |
|--------------------|-------------------|-------------------------------------------------|
| id                 | UUID (PK)         | Identificador único                             |
| email              | VARCHAR (Unique)  | E-mail do usuário (criptografado AES-256)       |
| password_hash      | VARCHAR           | Hash da senha (bcrypt)                          |
| role               | VARCHAR           | Enum: 'patient', 'doctor', 'secretary', 'admin' |
| two_factor_enabled | BOOLEAN           | Se 2FA está ativo (obrigatório para doctor)     |
| two_factor_secret  | VARCHAR           | Secret TOTP criptografado                       |
| is_active          | BOOLEAN           | Soft delete lógico                              |
| created_at         | TIMESTAMP         | Data de criação                                 |
| updated_at         | TIMESTAMP         | Data da última atualização                      |

#### Tabela: patient_profiles

| Campo                | Tipo              | Descrição                              |
|----------------------|-------------------|----------------------------------------|
| id                   | UUID (PK)         | Identificador do perfil                |
| user_id              | UUID (FK → users.id) | Vínculo com usuário                 |
| full_name            | VARCHAR           | Nome completo                          |
| phone                | VARCHAR           | Telefone (criptografado AES-256)       |
| cpf                  | VARCHAR           | CPF (criptografado, para receituário)  |
| height_cm            | INTEGER           | Altura em cm (CHECK > 0 AND < 300)    |
| weight_kg            | DECIMAL           | Peso em kg (CHECK > 0 AND < 500)      |
| main_complaint       | TEXT              | Queixa principal                       |
| lgpd_consent         | BOOLEAN           | Status do consentimento                |
| lgpd_consent_at      | TIMESTAMP         | Data/hora do consentimento             |
| lgpd_consent_version | VARCHAR           | Versão dos termos aceitos              |
| deleted_at           | TIMESTAMP         | Soft delete                            |
| deleted_by           | UUID (FK)         | Quem deletou                           |

### 6.2. Prescrições e Medicamentos

#### Tabela: medications

| Campo               | Tipo    | Descrição                                        |
|---------------------|---------|--------------------------------------------------|
| id                  | UUID (PK) | Identificador                                  |
| name                | VARCHAR | Nome comercial/substância                        |
| active_ingredient   | VARCHAR | Princípio ativo (DCB/DCI)                        |
| concentration       | VARCHAR | Concentração (ex: 10mg)                          |
| pharmaceutical_form | VARCHAR | Forma farmacêutica                               |
| max_daily_dose      | VARCHAR | Dose máxima diária (para validação RN-010)       |
| safety_tips         | TEXT    | Dicas de segurança                               |
| interaction_tags    | JSONB   | Tags de risco (ex: ["sedativo_potente"])          |
| indication_cids     | JSONB   | CIDs indicados (para validação RN-010)           |
| is_controlled       | BOOLEAN | Se é substância controlada (Portaria 344)        |

#### Tabela: prescriptions (uso interno/simplificado)

| Campo         | Tipo      | Descrição                    |
|---------------|-----------|------------------------------|
| id            | UUID (PK) | Identificador                |
| patient_id    | UUID (FK) | Referência ao paciente       |
| medication_id | UUID (FK) | Referência ao medicamento    |
| dosage        | VARCHAR   | Dosagem prescrita            |
| active        | BOOLEAN   | Se o tratamento está em curso|
| start_date    | DATE      | Início do tratamento         |
| end_date      | DATE      | Fim previsto do tratamento   |

### 6.3. Core: Daily Log

Tabela central para geração da Linha do Tempo e monitoramento. Constraint UNIQUE: (patient_id, date).

#### Tabela: daily_logs

| Campo                  | Tipo      | Descrição                                                  |
|------------------------|-----------|------------------------------------------------------------|
| id                     | UUID (PK) | Identificador                                              |
| patient_id             | UUID (FK) | Referência ao paciente                                     |
| date                   | DATE      | Data do registro (UNIQUE por paciente/dia)                 |
| **--- Módulo Sono ---**|           |                                                            |
| sleep_bedtime          | TIMESTAMP | Momento em que deitou                                      |
| sleep_onset_time       | TIMESTAMP | Momento em que dormiu (para latência)                      |
| sleep_wake_time        | TIMESTAMP | Momento em que acordou                                     |
| sleep_awakenings       | INTEGER   | Despertares noturnos (CHECK >= 0)                          |
| sleep_quality          | INTEGER   | Nota 1-5 (CHECK BETWEEN 1 AND 5)                          |
| sleep_difficulty       | BOOLEAN   | Demorou a pegar no sono?                                   |
| **--- Módulo Humor ---**|          |                                                            |
| mood_rating            | INTEGER   | Nota 1-5 via emojis (CHECK BETWEEN 1 AND 5)               |
| mood_tags              | JSONB     | Tags de sentimentos                                        |
| side_effects_checklist | JSONB     | Efeitos colaterais percebidos                              |
| **--- Módulo Atividade Física ---** | |                                                       |
| exercise_category      | VARCHAR   | Enum: aerobico, musculacao, caminhada, yoga, outros        |
| exercise_intensity     | VARCHAR   | Enum: leve, moderada, intensa                              |
| exercise_duration_min  | INTEGER   | Duração em minutos (CHECK > 0)                             |
| **--- Metadados ---**  |           |                                                            |
| notes                  | TEXT      | Escrita terapêutica (criptografado)                        |
| risk_flag              | BOOLEAN   | Sinalização automática de risco                            |
| suicidal_ideation_flag | BOOLEAN   | Resposta positiva a pergunta de ideação suicida            |
| created_at             | TIMESTAMP |                                                            |
| updated_at             | TIMESTAMP |                                                            |

### 6.4. Notificações e Alertas (Sentinela)

#### Tabela: alerts

| Campo            | Tipo      | Descrição                                                        |
|------------------|-----------|------------------------------------------------------------------|
| id               | UUID (PK) | Identificador                                                    |
| patient_id       | UUID (FK) | Referência ao paciente                                           |
| trigger_source   | VARCHAR   | Origem (ex: daily_log_risk, suicidal_ideation)                   |
| severity         | VARCHAR   | Enum: low, medium, high                                          |
| status           | VARCHAR   | Enum: pending, viewed, contacted, resolved, false_positive, escalated |
| resolution_notes | TEXT      | Notas de resolução                                               |
| contact_method   | VARCHAR   | Enum: phone, whatsapp, email, in_person                          |
| resolved_at      | TIMESTAMP | Data/hora da resolução                                           |
| resolved_by      | UUID (FK) | Quem resolveu                                                    |
| escalated_to     | UUID (FK) | Para quem foi escalado                                           |
| created_at       | TIMESTAMP |                                                                  |

### 6.5. Prontuário Eletrônico e Documentação Clínica

#### Tabela: consultations

| Campo            | Tipo                        | Descrição                                    |
|------------------|-----------------------------|----------------------------------------------|
| id               | UUID (PK)                   | Identificador                                |
| patient_id       | UUID (FK → patient_profiles.id) | Paciente                                 |
| doctor_id        | UUID (FK → users.id)        | Médico (role='doctor')                       |
| date_time        | TIMESTAMP                   | Data/hora da consulta                        |
| duration_minutes | INTEGER                     | Duração (CHECK >= 15)                        |
| modality         | VARCHAR                     | Enum: 'presencial', 'telemedicina'           |
| anamnesis        | TEXT                        | Anamnese (MIN 50 chars para finalized)       |
| physical_exam    | TEXT                        | Exame físico e mental                        |
| icd10_codes      | JSONB                       | Array de CID-10                              |
| treatment_plan   | TEXT                        | Conduta terapêutica                          |
| general_notes    | TEXT                        | Observações gerais                           |
| status           | VARCHAR                     | Enum: 'draft', 'finalized', 'cancelled'     |
| cancelled_reason | TEXT                        | Obrigatório se status = cancelled            |
| cancelled_by     | UUID (FK)                   | Quem cancelou                                |
| cancelled_at     | TIMESTAMP                   | Quando cancelou                              |
| signed_at        | TIMESTAMP                   | Data/hora da assinatura                      |
| signature_hash   | VARCHAR                     | Hash da assinatura                           |
| version          | INTEGER                     | Número da versão                             |
| parent_id        | UUID (FK → consultations.id)| Versão anterior                              |
| created_by       | UUID (FK)                   | Médico criador                               |
| last_modified_by | UUID (FK)                   | Último editor                                |
| deleted_at       | TIMESTAMP                   | Soft delete                                  |
| deleted_by       | UUID (FK)                   | Quem deletou                                 |
| created_at       | TIMESTAMP                   |                                              |
| updated_at       | TIMESTAMP                   |                                              |

**Índices:** idx_patient_datetime (patient_id, date_time DESC), idx_doctor_datetime (doctor_id, date_time DESC). UNIQUE: (patient_id, date_time).

#### Tabela: clinical_documents

| Campo              | Tipo      | Descrição                                |
|--------------------|-----------|------------------------------------------|
| id                 | UUID (PK) |                                          |
| patient_id         | UUID (FK) |                                          |
| consultation_id    | UUID (FK) | Vinculação opcional com consulta         |
| document_type      | VARCHAR   | Enum: exam, report, certificate, prescription |
| category           | VARCHAR   | laboratorial, imagem, psicométrico, outros |
| file_url           | VARCHAR   | Caminho no blob storage                  |
| file_name          | VARCHAR   | Nome original                            |
| file_size_kb       | INTEGER   | CHECK <= 10240 (10MB)                    |
| file_hash          | VARCHAR   | SHA-256 (integridade)                    |
| extracted_text     | TEXT      | Texto OCR (full-text indexed)            |
| tags               | JSONB     | Array de tags (GIN indexed)              |
| exam_date          | DATE      | Data do exame                            |
| issuing_entity     | VARCHAR   | Laboratório/clínica                      |
| requesting_doctor  | VARCHAR   | Médico solicitante                       |
| uploaded_by        | UUID (FK) | Quem fez upload                          |
| is_active          | BOOLEAN   | Soft delete                              |
| created_at         | TIMESTAMP |                                          |
| updated_at         | TIMESTAMP |                                          |

#### Tabela: formal_prescriptions

| Campo               | Tipo      | Descrição                                           |
|---------------------|-----------|-----------------------------------------------------|
| id                  | UUID (PK) |                                                     |
| consultation_id     | UUID (FK) | Vinculação obrigatória                              |
| patient_id          | UUID (FK) |                                                     |
| doctor_id           | UUID (FK) |                                                     |
| medication_id       | UUID (FK) |                                                     |
| prescription_type   | VARCHAR   | Enum: simples, controle_especial, antimicrobiano    |
| dosage              | VARCHAR   | Posologia detalhada                                 |
| quantity            | VARCHAR   | Quantidade (ex: 30 comprimidos)                     |
| quantity_written    | VARCHAR   | Quantidade por extenso                              |
| duration_days       | INTEGER   | CHECK > 0                                           |
| instructions        | TEXT      | Instruções de uso                                   |
| icd10_justification | JSONB     | CIDs que justificam                                 |
| is_valid            | BOOLEAN   | Status de validade                                  |
| valid_until         | DATE      | CHECK >= created_at::date                           |
| signature_hash      | VARCHAR   |                                                     |
| certificate_serial  | VARCHAR   | Serial ICP-Brasil                                   |
| signed_at           | TIMESTAMP |                                                     |
| revoked_at          | TIMESTAMP | Se revogada                                         |
| revoked_by          | UUID (FK) | Quem revogou                                        |
| revocation_reason   | TEXT      | Motivo da revogação                                 |
| created_at          | TIMESTAMP |                                                     |
| printed_at          | TIMESTAMP | Quando PDF foi gerado                               |

#### Tabela: therapeutic_plans

| Campo              | Tipo      | Descrição                                    |
|--------------------|-----------|----------------------------------------------|
| id                 | UUID (PK) |                                              |
| patient_id         | UUID (FK) |                                              |
| doctor_id          | UUID (FK) |                                              |
| active_version     | BOOLEAN   | Se é versão ativa                            |
| short_term_goals   | JSONB     | Objetivos 1-3 meses                         |
| medium_term_goals  | JSONB     | Objetivos 3-6 meses                         |
| long_term_goals    | JSONB     | Objetivos 6+ meses                          |
| measurable_targets | JSONB     | Metas mensuráveis (ex: PHQ-9 < 10)          |
| interventions      | JSONB     | Estratégias                                  |
| review_frequency   | VARCHAR   | Enum: semanal, quinzenal, mensal             |
| next_review_date   | DATE      |                                              |
| progress_notes     | TEXT      |                                              |
| deleted_at         | TIMESTAMP | Soft delete                                  |
| deleted_by         | UUID (FK) |                                              |
| created_at         | TIMESTAMP |                                              |
| updated_at         | TIMESTAMP |                                              |

#### Tabela: icd10_codes

| Campo        | Tipo           | Descrição                            |
|--------------|----------------|--------------------------------------|
| code         | VARCHAR(10) (PK)| Código CID-10                       |
| description  | TEXT           | Descrição                            |
| chapter      | VARCHAR(5)     | Ex: F para transtornos mentais       |
| last_updated | TIMESTAMP      | Data da última atualização           |

#### Tabela: audit_logs

| Campo          | Tipo      | Descrição                                          |
|----------------|-----------|----------------------------------------------------|
| id             | UUID (PK) |                                                    |
| user_id        | UUID (FK) | Quem acessou                                       |
| patient_id     | UUID (FK) | Prontuário acessado                                |
| action_type    | VARCHAR   | Enum: view, edit, delete, share, print             |
| resource_type  | VARCHAR   | consultation, document, prescription               |
| resource_id    | UUID      | ID do recurso                                      |
| ip_address     | VARCHAR   | IP de origem                                       |
| user_agent     | TEXT      | Browser/app                                        |
| success        | BOOLEAN   | Se ação foi bem-sucedida                           |
| failure_reason | VARCHAR   | Motivo de falha                                    |
| created_at     | TIMESTAMP | Imutável (WORM)                                    |

### 6.6. Tabelas Adicionais Identificadas (Gap Fix)

#### Tabela: consent_logs (NOVO - suporte RF-001)

| Campo        | Tipo      | Descrição                                              |
|--------------|-----------|---------------------------------------------------------|
| id           | UUID (PK) |                                                        |
| user_id      | UUID (FK) |                                                        |
| consent_type | VARCHAR   | Enum: terms_of_use, data_processing, data_sharing      |
| version      | VARCHAR   | Versão dos termos                                      |
| granted      | BOOLEAN   | Se aceitou ou revogou                                  |
| ip_address   | VARCHAR   | IP de origem                                           |
| created_at   | TIMESTAMP | Imutável                                               |

#### Tabela: clinical_evolutions (NOVO - suporte RF-015)

| Campo               | Tipo      | Descrição                                                          |
|---------------------|-----------|--------------------------------------------------------------------|
| id                  | UUID (PK) |                                                                    |
| patient_id          | UUID (FK) |                                                                    |
| doctor_id           | UUID (FK) |                                                                    |
| evolution_type      | VARCHAR   | Enum: note, phone_call, crisis, hospitalization, significant_change |
| content             | TEXT      | Descrição da evolução                                              |
| is_important_marker | BOOLEAN   | Evento importante                                                  |
| created_at          | TIMESTAMP |                                                                    |

#### Tabela: appointments (NOVO - suporte RF-025)

| Campo               | Tipo      | Descrição                                               |
|---------------------|-----------|---------------------------------------------------------|
| id                  | UUID (PK) |                                                        |
| patient_id          | UUID (FK) |                                                        |
| doctor_id           | UUID (FK) |                                                        |
| scheduled_at        | TIMESTAMP | Data/hora agendada                                     |
| duration_minutes    | INTEGER   | Duração prevista                                       |
| modality            | VARCHAR   | Enum: presencial, telemedicina                         |
| status              | VARCHAR   | Enum: scheduled, confirmed, cancelled, completed, no_show |
| confirmation_sent_at| TIMESTAMP | Quando a confirmação foi enviada                       |
| cancelled_at        | TIMESTAMP |                                                        |
| cancellation_reason | TEXT      |                                                        |
| created_at          | TIMESTAMP |                                                        |
| updated_at          | TIMESTAMP |                                                        |

#### Tabela: notifications_log (NOVO - suporte RF-012)

| Campo          | Tipo      | Descrição                              |
|----------------|-----------|----------------------------------------|
| id             | UUID (PK) |                                        |
| user_id        | UUID (FK) | Destinatário                           |
| channel        | VARCHAR   | Enum: push, whatsapp, email, sms       |
| template       | VARCHAR   | Tipo da notificação                    |
| status         | VARCHAR   | Enum: sent, failed, pending            |
| sent_at        | TIMESTAMP |                                        |
| failure_reason | TEXT      | Se falhou                              |
| retry_count    | INTEGER   | Número de retentativas                 |
| created_at     | TIMESTAMP |                                        |

### 6.7. Padrão de Soft Delete

Tabelas com soft delete obrigatório: consultations, clinical_documents, formal_prescriptions, therapeutic_plans, patient_profiles. Sempre usar views `_active` para queries normais.

---

## 7. Stack de Desenvolvimento e Infraestrutura

### 7.1. Frontend

**Framework:** Next.js (React) — renderização híbrida SSR/CSR, PWA mobile first.
**Estilização:** Tailwind CSS + ShadcnUI.
**Gerenciamento de Estado:** Zustand (client state) + TanStack Query (server state/cache).

### 7.2. Backend

**Framework:** Nest.js (Node.js/TypeScript) — arquitetura modular.
**Validação:** Zod ou Class-Validator.
**Autenticação:** JWT com refresh token + 2FA (TOTP).

### 7.3. Banco de Dados

**SGBD:** PostgreSQL — integridade relacional + flexibilidade JSONB.
**ORM:** Prisma (tipagem segura TypeScript).
**Migrações:** Prisma Migrate. Nomenclatura: `YYYYMMDDHHMMSS_descricao.sql`. Estratégia expand-migrate-contract para alterações destrutivas.
**Cache:** Redis (rate limiting, sessões, brute force tracking).

### 7.4. Notificações

**Fase 1 (MVP, < 500 usuários):** Nest.js nativo com @nestjs/schedule. Providers: Evolution API (WhatsApp), NodeMailer (Email), Twilio (SMS/2FA).

**Fase 2 (Escala, 500+):** Migração gradual para n8n (self-hosted). Critérios: volume > 1000 notificações/dia, necessidade de A/B testing, múltiplos canais simultâneos.

### 7.5. Infraestrutura e Deploy

**Frontend:** Vercel (deploy automático, Edge Network, suporte nativo Next.js).
**Backend + DB:** VPS (Hetzner ou DigitalOcean) com Docker + Coolify.
**Justificativa:** Para MVP, AWS adiciona complexidade desnecessária (VPC, IAM, RDS). Coolify funciona como Heroku open-source com custo fixo previsível.

### 7.6. Observabilidade

**Erros:** Sentry (frontend + backend em tempo real).
**Logs de Auditoria:** Tabela interna PostgreSQL (audit_logs) — requisito LGPD/CFM.
**Health Checks:** Endpoint `/health` para monitoramento de serviços.

---

## 8. Gaps Identificados e Correções Aplicadas

Esta seção documenta as incoerências e lacunas encontradas no documento original v1.0 e as correções aplicadas nesta revisão.

| Gap                                        | Problema                                                                                                                         | Correção Aplicada                                                                         |
|--------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| Schema: Tabela consent_logs ausente        | RF-001 exige registro de consentimento LGPD, mas não havia tabela dedicada. patient_profiles.lgpd_consent é insuficiente para histórico. | Criada tabela consent_logs com versionamento e imutabilidade.                              |
| Schema: Tabela clinical_evolutions ausente | RF-015 (Evolução Clínica) não tinha tabela de suporte.                                                                            | Criada tabela com campos para tipos de evolução e marcadores.                              |
| Schema: Tabela appointments ausente        | RF-025 (Agendamento) não tinha tabela dedicada.                                                                                   | Criada tabela com workflow de status completo.                                             |
| Schema: Tabela notifications_log ausente   | RF-012 (Notificações) não tinha rastreamento de envios.                                                                           | Criada tabela com status, retentativas e fallback.                                         |
| Schema: users sem campos 2FA              | RN-015 exige 2FA obrigatório para médicos, mas users não tinha campos.                                                            | Adicionados two_factor_enabled e two_factor_secret.                                        |
| Schema: medications incompleta             | RN-010 exige validação prescrição x diagnóstico, mas medications não tinha campos de dose máxima nem CIDs indicados.               | Adicionados max_daily_dose, indication_cids, active_ingredient, concentration, pharmaceutical_form, is_controlled. |
| Schema: patient_profiles sem CPF           | RF-017 exige identificação do paciente (RG ou CPF) no receituário.                                                                | Adicionado campo cpf criptografado.                                                        |
| Schema: daily_logs sem campos de atividade física | RF-023 define input de exercícios, mas daily_logs não tinha esses campos.                                                   | Adicionados exercise_category, exercise_intensity, exercise_duration_min.                  |
| Schema: daily_logs sem flag de ideação suicida | RF-005 menciona perguntas sobre ideação suicida, mas não havia campo dedicado para acionar Sentinela.                          | Adicionado suicidal_ideation_flag + gatilho secundário em RN-001.                          |
| Schema: consultations sem campos de cancelamento | RN-016 define transição para cancelled com justificativa obrigatória, mas não havia campos.                                 | Adicionados cancelled_reason, cancelled_by, cancelled_at.                                  |
| Schema: daily_logs campos de sono inconsistentes | sleep_start_time e sleep_end_time eram ambíguos para cálculo de latência (RF-004). Não havia campo para despertares.         | Renomeados para sleep_bedtime, sleep_onset_time, sleep_wake_time. Adicionado sleep_awakenings e sleep_difficulty. |
| RF-002: Role 'secretary' ausente           | Documento mencionava Secretária/Administrativo mas users.role só tinha patient, doctor, admin.                                     | Adicionado role 'secretary' com permissões definidas.                                      |
| Ausência de prioridades nos requisitos     | Nenhum RF tinha prioridade (MVP vs. Pós-MVP).                                                                                     | Adicionadas prioridades (Crítica, Alta, Média, Baixa) a todos os RFs.                     |
| Ausência de critérios de aceitação         | RFs não tinham critérios claros de aceitação para desenvolvimento.                                                                | Adicionados critérios de aceitação detalhados nos RFs principais.                          |
| Seção de controle do documento ausente     | Não havia histórico de versões nem aprovadores.                                                                                   | Adicionada seção Controle do Documento com template.                                       |
| Personas não documentadas                  | Faltava definição clara das personas do sistema.                                                                                  | Adicionada seção Personas com tabela de papéis e acessos.                                  |

---

## 9. Pontos em Aberto / Próximos Passos

### 9.1. Pesquisas Técnicas Necessárias

- **Certificado Digital:** Pesquisar SDKs ICP-Brasil para Node.js (ex: vidaaas, lacunapki).
- **OCR Médico:** Avaliar Tesseract.js vs. Google Vision API (precisão, custo, LGPD).
- **DICOM Viewer:** Biblioteca para visualização de imagens médicas no browser (ex: Cornerstone.js).
- **HL7 FHIR:** Avaliar bibliotecas de integração para RF-024.

### 9.2. Decisões Pendentes

- Definir provedor de hosting final para backend (Hetzner vs. DigitalOcean vs. Hostinger VPS).
- Definir estratégia de deploy de Redis (mesmo servidor ou separado).
- Validar com consultor jurídico os requisitos LGPD e termos de uso.
- Definir escopo exato do MVP com Product Owner (quais RFs entram na Fase 1).
- Definir estratégia de testes (unit, integration, e2e) e cobertura mínima.

### 9.3. Riscos Identificados

| Risco                                               | Impacto | Mitigação                                                        |
|------------------------------------------------------|---------|------------------------------------------------------------------|
| Complexidade da assinatura digital ICP-Brasil        | Alto    | Iniciar PoC na semana 1 do desenvolvimento                      |
| Performance da Linha do Tempo com alto volume        | Médio   | Índices otimizados + paginação + cache com TanStack Query        |
| Dependência do Evolution API (WhatsApp)              | Médio   | Fallback para Z-API configurado desde o início                   |
| Conformidade LGPD incompleta                         | Alto    | Engajar consultor jurídico antes do lançamento                   |

---

## 10. Glossário de Termos Técnicos

| Termo        | Definição                                                                         |
|--------------|-----------------------------------------------------------------------------------|
| API          | Interface de Programação de Aplicações — permite comunicação entre sistemas.      |
| Blob Storage | Armazenamento de arquivos binários (PDFs, imagens).                               |
| CAPTCHA      | Teste automatizado para distinguir humanos de bots.                               |
| CID-10       | Classificação Internacional de Doenças, 10ª revisão.                              |
| CORS         | Mecanismo de segurança para requisições entre domínios.                           |
| CRUD         | Create, Read, Update, Delete — operações básicas de dados.                        |
| FK           | Chave estrangeira — garantia de relacionamento entre tabelas.                     |
| Hash         | Impressão digital única de um dado (ex: SHA-256).                                 |
| HL7 FHIR    | Padrão de interoperabilidade para dados de saúde.                                 |
| ICP-Brasil   | Infraestrutura de Chaves Públicas Brasileira.                                     |
| JSONB        | Tipo de dado PostgreSQL para JSON binário e indexável.                             |
| LGPD         | Lei Geral de Proteção de Dados (Lei 13.709/2018).                                 |
| OCR          | Reconhecimento Óptico de Caracteres.                                              |
| ORM          | Mapeamento Objeto-Relacional (ex: Prisma).                                        |
| PHI          | Protected Health Information — dados de saúde protegidos.                          |
| PII          | Personally Identifiable Information — dados pessoais identificáveis.              |
| PWA          | Progressive Web App — experiência similar a apps nativos.                          |
| RBAC         | Controle de Acesso Baseado em Papéis.                                             |
| Rate Limiting| Limitação do número de requisições por período.                                   |
| Redis        | Banco de dados em memória para cache e dados temporários.                         |
| Soft Delete  | Marcação de inatividade sem remoção física.                                       |
| SSR          | Server-Side Rendering — renderização no servidor.                                 |
| TOTP         | Time-based One-Time Password — senha única baseada em tempo (2FA).                |
| UUID         | Identificador Único Universal (128 bits).                                         |
| Webhook      | Notificação automática entre sistemas via HTTP.                                   |
| WORM         | Write Once Read Many — armazenamento imutável.                                    |

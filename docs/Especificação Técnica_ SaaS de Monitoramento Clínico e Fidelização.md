# Especificação Técnica: SaaS de Monitoramento Clínico e Fidelização
**Versão 2.0 — Revisada e Consolidada**

O presente documento detalha a especificação técnica para o desenvolvimento de uma plataforma **Software as a Service (SaaS)** voltada ao monitoramento clínico, com foco inicial no segmento de psiquiatria e saúde mental. O sistema visa integrar o acompanhamento contínuo do paciente através de aplicações móveis com um painel de gestão para profissionais de saúde, otimizando o processo de tomada de decisão clínica e fortalecendo o vínculo terapêutico.

---

## Controle do Documento e Histórico

A manutenção da integridade deste documento é gerida através de um histórico de versões rigoroso, garantindo que todas as alterações em requisitos, regras de negócio e definições de arquitetura sejam devidamente rastreadas e auditadas.

| Versão | Data | Autor | Descrição das Alterações |
| :--- | :--- | :--- | :--- |
| 1.0 | 2026-02-07 | Luís Eduardo de Paula Albuquerque | Elaboração da versão inicial contendo os requisitos básicos do sistema. |
| 2.0 | 2026-02-14 | Luís Eduardo de Paula Albuquerque | Revisão abrangente para correção de lacunas, consolidação de regras de negócio e padronização do esquema de dados. |

---

## 1. Visão Geral e Estratégia de Produto

A plataforma fundamenta-se em três pilares estratégicos: a fidelização do paciente por meio de engajamento diário, a otimização do tempo do médico através de visualizações de dados consolidadas e a melhoria dos desfechos clínicos via monitoramento preditivo. A estratégia de lançamento prioriza o modelo **Minimum Viable Product (MVP)**, utilizando a metodologia *Mobile First* com entrega via **Progressive Web App (PWA)**, permitindo uma implantação ágil em um cronograma estimado de três meses.

As personas identificadas para o ecossistema do produto são fundamentais para a definição dos fluxos de trabalho e níveis de acesso, conforme detalhado na tabela abaixo:

| Persona | Responsabilidades e Atividades | Interface Principal |
| :--- | :--- | :--- |
| **Paciente** | Registro de dados vitais, diário de sono, humor e sintomas; acompanhamento da prescrição. | Aplicativo Móvel (PWA) |
| **Médico** | Análise de tendências clínicas, realização de consultas, emissão de prescrições e planos terapêuticos. | Dashboard Web e App |
| **Secretária** | Triagem inicial de alertas de risco, gestão de agendamentos e suporte administrativo. | Dashboard Web |
| **Administrador** | Gestão de infraestrutura, controle de permissões globais e auditoria de sistema. | Dashboard Web |

---

## 2. Requisitos Funcionais e Módulos do Sistema

### 2.1. Gestão de Identidade e Segurança de Acesso

A conformidade com a **Lei Geral de Proteção de Dados (LGPD)** é um requisito crítico. O sistema implementa a **Gestão de Consentimento (RF-001)**, exigindo o aceite explícito dos termos de uso no primeiro acesso, com armazenamento imutável de logs de consentimento. O controle de acesso é baseado em papéis (**RBAC - RF-002**), garantindo que cada usuário visualize apenas as informações pertinentes à sua função. Para médicos, a **Autenticação Multi-Fator (2FA - RF-026)** é obrigatória, utilizando protocolos TOTP ou SMS como contingência.

### 2.2. Ecossistema do Paciente e Coleta de Dados

O aplicativo do paciente é o principal ponto de entrada de dados clínicos. O **Diário do Sono (RF-004)** e o **Diário de Humor e Sintomas (RF-005)** permitem a coleta de variáveis qualitativas e quantitativas. Um componente vital é o **Sistema Sentinela**, que monitora respostas sobre ideação suicida ou quedas bruscas no humor, disparando alertas imediatos para a equipe médica. A **Central de Medicamentos Inteligente (RF-006)** fornece orientações de segurança baseadas na prescrição ativa, enquanto o monitoramento de atividade física manual (RF-023) complementa o perfil de saúde do usuário.

### 2.3. Dashboard Médico e Prontuário Eletrônico (PEP)

A interface médica é centrada na **Linha do Tempo do Paciente (RF-009)**, que agrega dados históricos em uma visualização cronológica performática. A **Análise Correlacional (RF-010)** permite cruzar dados de dosagem medicamentosa com indicadores de sono e humor, facilitando o ajuste terapêutico. O **Prontuário Eletrônico (RF-014)** suporta o registro completo de consultas, incluindo anamnese estruturada e hipóteses diagnósticas via CID-10. Todas as prescrições formais (RF-017) e documentos clínicos possuem validade jurídica através da integração com a **Assinatura Digital ICP-Brasil (RF-020)**.

---

## 3. Regras de Negócio e Segurança Clínica

As regras de negócio definem a inteligência operacional do sistema, com foco especial na segurança do paciente e integridade dos dados clínicos.

| Identificador | Regra de Negócio | Descrição Técnica e Gatilhos |
| :--- | :--- | :--- |
| **RN-001** | Algoritmo Sentinela | Dispara alerta de alta prioridade se o humor for inferior a 2 por 3 dias ou em caso de ideação suicida. |
| **RN-002** | Validação de Interações | Verifica tags de segurança nos medicamentos para emitir alertas automáticos ao paciente. |
| **RN-004** | Versionamento de Prontuário | Implementa imutabilidade; qualquer edição gera uma nova versão vinculada ao registro pai. |
| **RN-009** | Bloqueio de Edição | Impede a alteração de consultas finalizadas após o período de 24 horas para garantir integridade. |
| **RN-013** | Validação CID-10 | Exige códigos válidos conforme a base oficial e obrigatoriedade do capítulo F para psicotrópicos. |
| **RN-015** | 2FA Obrigatório | Bloqueia o acesso de médicos ao prontuário caso a autenticação de dois fatores não esteja ativa. |

---

## 4. Arquitetura de Dados e Infraestrutura

### 4.1. Esquema de Banco de Dados (PostgreSQL)

A modelagem de dados utiliza o PostgreSQL com suporte a JSONB para campos flexíveis e criptografia de nível de campo (AES-256) para dados sensíveis como CPF, e-mail e notas terapêuticas.

> **Nota de Implementação:** Todas as tabelas críticas (consultas, documentos, prescrições) implementam o padrão *Soft Delete*, garantindo que nenhum dado clínico seja removido fisicamente do banco de dados, em conformidade com as resoluções do Conselho Federal de Medicina (CFM).

### 4.2. Stack Tecnológica Recomendada

| Camada | Tecnologia Selecionada | Justificativa Técnica |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React) | Suporte nativo a SSR/CSR, otimização de performance e facilidade para PWA. |
| **Backend** | Nest.js (TypeScript) | Arquitetura modular, escalável e tipagem forte para processos críticos. |
| **Banco de Dados** | PostgreSQL + Redis | Integridade relacional robusta combinada com cache de alta performance. |
| **Infraestrutura** | Docker + Coolify | Orquestração simplificada em VPS com custos previsíveis para o MVP. |
| **Assinatura** | SDK ICP-Brasil | Garantia de validade jurídica para documentos médicos e prescrições. |

---

## 5. Requisitos Não Funcionais e Compliance

O sistema deve garantir uma **disponibilidade elevada (RNF-002)**, especialmente para o módulo de alertas críticos. A **performance da linha do tempo (RNF-003)** é fixada em um tempo de carregamento inferior a 2 segundos. Em termos de segurança, além da criptografia de campos sensíveis (RNF-011), é implementado um mecanismo de **Rate Limiting (RNF-012)** com bloqueio escalonado para prevenir ataques de força bruta. A retenção de dados é definida por um período de 20 anos para prontuários, conforme exigência legal brasileira.

---

## 6. Considerações Finais e Gaps de Revisão

Esta versão 2.0 endereça lacunas identificadas na versão inicial, como a ausência de tabelas para logs de consentimento, agendamentos e evoluções clínicas. Foram adicionados campos de segurança essenciais, como o monitoramento de ideação suicida e a identificação por CPF para fins de receituário digital. Os próximos passos incluem a Prova de Conceito (PoC) para a integração de assinatura digital e a validação jurídica final dos fluxos de conformidade com a LGPD.

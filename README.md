# Clínica - Agendamento de Consultas (Vue + Node/Express + MongoDB)

Sistema web para uma clínica médica com:

- Cadastro e login seguro (pacientes e secretários) via JWT
- Agendamento com verificação de horário disponível
- Preenchimento automático de endereço por CEP (ViaCEP)
- Alerta de chuva no dia da consulta (OpenWeatherMap)
- Painel administrativo para gerenciar atendimentos

## Tecnologias

- Frontend: `Vue 3` + `Vite` + `vue-router` + `axios`
- Backend: `Node.js` + `Express` + `MongoDB/Mongoose`
- Autenticação: `JWT` + `bcryptjs`
- Validação: `zod`

## Requisitos

- Node.js 18+ (recomendado Node 20+)
- MongoDB (local ou MongoDB Atlas)

## Configuração (variáveis de ambiente)

### Backend

1. Crie um arquivo `backend/.env` a partir de `backend/.env.example`
2. Preencha obrigatoriamente:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SECRETARY_INVITE_CODE` (para cadastro de secretários)
3. Para alerta de chuva:
   - `OPENWEATHERMAP_API_KEY` (opcional; se não informar, o agendamento funciona sem alerta)

### Frontend

1. Crie `frontend/.env` a partir de `frontend/.env.example`
2. Verifique `VITE_API_BASE_URL` (ex.: `http://localhost:4000/api`)

## Como rodar localmente

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

O backend sobe em `http://localhost:4000`.

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço exibido (geralmente `http://localhost:5173`).

## Rotas principais (API)

### Autenticação

- `POST /api/auth/register` (cria usuário; secretários exigem `SECRETARY_INVITE_CODE`)
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/patients/search?email=...` (secretário busca pacientes por e-mail)

### Agendamentos

- `POST /api/appointments` (paciente cria para si; secretário cria para paciente)
- `GET /api/appointments/me` (lista do paciente)
- `GET /api/appointments` (painel do secretário/administrativo; filtros por query)
- `PATCH /api/appointments/:id/status` (secretário gerencia; paciente só pode cancelar)
- `GET /api/appointments/address?cep=...` (ViaCEP para preencher endereço)

### Campos de agendamento

- `appointmentAt` (data/hora em ISO)
- `cep` e `address` (preenchidos automaticamente)
- `weather.willRain` (indica previsão de chuva)

## Telas implementadas (frontend)

- `Login`: autentica via `/api/auth/login`
- `Cadastro`: cadastra paciente/secretário via `/api/auth/register`
- `Agendar Consulta`: cria agendamentos e preenche endereço via `/api/appointments/address?cep=...`
- `Meus Agendamentos`: lista e permite cancelar (status `cancelled`)
- `Painel Administrativo`: secretários gerenciam status dos atendimentos

## Deploy (pronto para publicação)

### Backend (Node/Express)

Exemplos comuns:

- Render / Railway / Fly.io

Configuração:

1. Build command: `npm install`
2. Start command: `npm run start`
3. Defina as variáveis de ambiente (base em `backend/.env.example`):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SECRETARY_INVITE_CODE`
   - `OPENWEATHERMAP_API_KEY` (se quiser alerta de chuva)

### Frontend (Vue)

Exemplos comuns:

- Vercel / Netlify

1. Build command: `npm run build`
2. Output: `dist/`
3. Defina `VITE_API_BASE_URL` apontando para a API do backend em produção

> Observação: o backend habilita CORS de forma flexível (`origin: true`), então o frontend consegue consumir a API sem bloqueios.

## Publicação no GitHub

Se você ainda não tiver um repositório:

1. Crie um repositório vazio no GitHub
2. No projeto local:
   - `git init`
   - `git add .`
   - `git commit -m "Clinica - agendamento com JWT, CEP e clima"`
   - `git branch -M main`
   - `git remote add origin <URL_DO_SEU_REPO>`
   - `git push -u origin main`

## Próximos aprimoramentos (opcional)

- Agendamento por múltiplos consultórios/profissionais
- Migração para validações mais rígidas de status/data/hora
- Paginação e busca por nome no painel


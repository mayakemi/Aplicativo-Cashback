# App de Cashback (Python + API + Frontend estático)

## Regras implementadas

1. Cashback base: **5%** sobre o valor final (após desconto).
2. Promoção comercial: se valor final da compra for **maior que R$ 500**, o cashback é **dobrado**.
3. VIP: recebe **10% de bônus sobre o cashback já calculado** (após aplicar eventual dobra).

## Rodar localmente

1. Suba um banco PostgreSQL ou MySQL.
2. Configure `DATABASE_URL` (veja `.env.example`).
3. Instale dependências:
   - `py -m pip install -r requirements.txt`
4. Rode:
   - `py -m uvicorn main:app --reload`
5. Abra:
   - `http://localhost:8000`

## Endpoints

- `POST /api/calculate`
  - body:
    ```json
    {
      "client_type": "vip",
      "purchase_amount": 600,
      "discount_percent": 20
    }
    ```
- `GET /api/history` (filtrado por IP de acesso)

## Histórico por IP

Cada cálculo é salvo na tabela `consultations` com:
- IP do cliente
- tipo de cliente
- valor original
- desconto
- valor final
- cashback
- data/hora

## Deploy sugerido (Render)

1. Crie um banco PostgreSQL no Render.
2. Crie um Web Service Python apontando para este diretório.
3. Configure:
   - Build Command: `py -m pip install -r requirements.txt`
   - Start Command: `py -m uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Defina `DATABASE_URL` do banco criado.
5. Publicar.

> O frontend já é servido pela própria API em `/`.

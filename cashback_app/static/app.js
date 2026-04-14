const form = document.getElementById("cashback-form");
const result = document.getElementById("result");
const historyBody = document.getElementById("history-body");

const money = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function loadHistory() {
  const res = await fetch("/api/history");
  const data = await res.json();

  historyBody.innerHTML = "";
  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(item.created_at).toLocaleString("pt-BR")}</td>
      <td>${item.client_type.toUpperCase()}</td>
      <td>${money(item.purchase_amount)}</td>
      <td>${item.discount_percent}%</td>
      <td>${money(item.final_amount)}</td>
      <td>${money(item.cashback)}</td>
    `;
    historyBody.appendChild(tr);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    client_type: document.getElementById("client_type").value,
    purchase_amount: Number(document.getElementById("purchase_amount").value),
    discount_percent: Number(document.getElementById("discount_percent").value),
  };

  const res = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    result.classList.remove("hidden");
    result.innerHTML = `<p>Erro: ${data.detail || "Não foi possível calcular."}</p>`;
    return;
  }

  result.classList.remove("hidden");
  result.innerHTML = `
    <h2>Resultado</h2>
    <p>Valor final da compra: <strong>${money(data.final_amount)}</strong></p>
    <p>Cashback gerado: <strong>${money(data.cashback)}</strong></p>
  `;

  await loadHistory();
});

loadHistory();

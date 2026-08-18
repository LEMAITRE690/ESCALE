export function computeCrmMetrics({ reservations = [], payments = [], expenses = [], now = new Date() }) {
  const month = now.getMonth();
  const year = now.getFullYear();
  const today = now.toISOString().slice(0, 10);

  const activeReservations = reservations.filter((r) => !["annulee", "remboursee"].includes(r.status));
  const confirmed = activeReservations.filter((r) => ["confirmee", "terminee"].includes(r.status));

  const caMonth = confirmed
    .filter((r) => {
      const d = new Date(`${r.start_date}T12:00:00`);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, r) => sum + Number(r.amount_total || 0), 0);

  const expensesMonth = expenses
    .filter((e) => {
      const d = new Date(`${e.expense_date}T12:00:00`);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + Number(e.amount_cents || 0), 0);

  const awaitingPayout = payments
    .filter((p) => p.status === "succeeded" && !p.transferred_at)
    .reduce((sum, p) => sum + Number(p.amount_host || 0), 0);

  return {
    caMonth,
    expensesMonth,
    resultBeforeOtherCharges: caMonth - expensesMonth,
    awaitingPayout,
    arrivalsToday: activeReservations.filter((r) => r.start_date === today).length,
    departuresToday: activeReservations.filter((r) => r.end_date === today).length,
  };
}

export function crmSegment(contact) {
  const lifetime = Number(contact?.lifetime_value_cents || 0);
  const stays = Number(contact?.stays_count || 0);
  if (lifetime >= 200000) return "VIP";
  if (stays >= 2) return "Fidèle";
  return "Client";
}

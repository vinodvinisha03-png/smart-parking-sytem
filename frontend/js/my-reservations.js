requireAuth();

const errorEl = document.getElementById('error');
const reservationList = document.getElementById('reservationList');

document.getElementById('logoutLink').addEventListener('click', (e) => { e.preventDefault(); logout(); });

if (isAdmin()) {
  const adminLink = document.getElementById('adminLink');
  adminLink.style.display = 'inline';
  adminLink.href = 'admin.html';
}

function statusPill(status) {
  return `<span class="status-pill status-${status}">${status}</span>`;
}

function paymentTag(r) {
  return r.paymentStatus === 'refunded'
    ? `<span class="tag danger">Refunded \u20b9${r.amount.toFixed(2)}</span>`
    : `<span class="tag success">Paid \u20b9${r.amount.toFixed(2)}</span>`;
}

function renderReservations(reservations) {
  if (reservations.length === 0) {
    reservationList.innerHTML = '<div class="empty-state">You have no reservations yet. Go to Locations to reserve a slot.</div>';
    return;
  }
  reservationList.innerHTML = reservations.map(r => `
    <div class="card">
      <h3>${escapeHtml(r.location ? r.location.name : 'Location removed')} ${statusPill(r.status)}</h3>
      <p class="hint">${r.location ? escapeHtml(r.location.address) : ''}</p>
      <p>Vehicle: <strong>${escapeHtml(r.vehicleNumber)}</strong></p>
      <p>${formatDateTime(r.startTime)} \u2192 ${formatDateTime(r.endTime)}</p>
      <p>${paymentTag(r)} <span class="hint">\u00b7 Card \u2022\u2022\u2022\u2022 ${escapeHtml(r.cardLast4)} \u00b7 ${escapeHtml(r.transactionId)}</span></p>
      ${r.status === 'active' ? `<button class="btn btn-sm btn-danger" onclick="cancelReservation('${r._id}')">Cancel & refund</button>` : ''}
    </div>
  `).join('');
}

async function loadReservations() {
  try {
    const reservations = await apiRequest('/reservations/my');
    renderReservations(reservations);
  } catch (err) {
    showError(errorEl, err.message);
  }
}

async function cancelReservation(id) {
  if (!confirm('Cancel this reservation? The payment will be refunded (simulated).')) return;
  try {
    await apiRequest(`/reservations/${id}/cancel`, { method: 'PUT' });
    loadReservations();
  } catch (err) {
    showError(errorEl, err.message);
  }
}

loadReservations();

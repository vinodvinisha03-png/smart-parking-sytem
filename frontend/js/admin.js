requireAdminPage();

const errorEl = document.getElementById('error');
const locationList = document.getElementById('locationList');
const reservationTableWrap = document.getElementById('reservationTableWrap');

document.getElementById('logoutLink').addEventListener('click', (e) => { e.preventDefault(); logout(); });

// --- Add location ---
document.getElementById('addLocationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(errorEl);

  const name = document.getElementById('name').value.trim();
  const address = document.getElementById('address').value.trim();
  const totalSlots = Number(document.getElementById('totalSlots').value);
  const pricePerHour = Number(document.getElementById('pricePerHour').value);

  try {
    await apiRequest('/locations', { method: 'POST', body: { name, address, totalSlots, pricePerHour } });
    document.getElementById('addLocationForm').reset();
    loadLocations();
  } catch (err) {
    showError(errorEl, err.message);
  }
});

// --- Location list with inline edit/delete ---
function renderLocations(locations) {
  if (locations.length === 0) {
    locationList.innerHTML = '<div class="empty-state">No locations added yet. Add one above.</div>';
    return;
  }
  locationList.innerHTML = locations.map(loc => `
    <div class="card">
      <h3>${escapeHtml(loc.name)}</h3>
      <p class="hint">${escapeHtml(loc.address)}</p>
      <p>${loc.availableSlots} / ${loc.totalSlots} available &nbsp;\u00b7&nbsp; \u20b9${loc.pricePerHour}/hour</p>
      <button class="btn btn-sm btn-outline" onclick="editLocation('${loc._id}', ${loc.totalSlots}, ${loc.pricePerHour})">Edit</button>
      <button class="btn btn-sm btn-danger" onclick="deleteLocation('${loc._id}')">Delete</button>
    </div>
  `).join('');
}

async function loadLocations() {
  try {
    const locations = await apiRequest('/locations');
    renderLocations(locations);
    return locations;
  } catch (err) {
    showError(errorEl, err.message);
  }
}

async function editLocation(id, currentTotal, currentPrice) {
  const totalSlots = prompt('Total slots:', currentTotal);
  if (totalSlots === null) return;
  const pricePerHour = prompt('Price per hour (\u20b9):', currentPrice);
  if (pricePerHour === null) return;

  try {
    await apiRequest(`/locations/${id}`, {
      method: 'PUT',
      body: { totalSlots: Number(totalSlots), pricePerHour: Number(pricePerHour) }
    });
    loadLocations();
  } catch (err) {
    showError(errorEl, err.message);
  }
}

async function deleteLocation(id) {
  if (!confirm('Delete this location? This cannot be undone.')) return;
  try {
    await apiRequest(`/locations/${id}`, { method: 'DELETE' });
    loadLocations();
  } catch (err) {
    showError(errorEl, err.message);
  }
}

// --- All reservations table with revenue summary ---
function statusPill(status) {
  return `<span class="status-pill status-${status}">${status}</span>`;
}

function renderReservationTable(reservations) {
  const totalRevenue = reservations
    .filter(r => r.paymentStatus === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  if (reservations.length === 0) {
    reservationTableWrap.innerHTML = '<div class="empty-state">No reservations yet.</div>';
    return;
  }

  const rows = reservations.map(r => `
    <tr>
      <td>${escapeHtml(r.user ? r.user.name : 'Unknown')}</td>
      <td>${escapeHtml(r.location ? r.location.name : '\u2014')}</td>
      <td>${escapeHtml(r.vehicleNumber)}</td>
      <td>${formatDateTime(r.startTime)}</td>
      <td>${statusPill(r.status)}</td>
      <td>${r.paymentStatus === 'refunded' ? 'Refunded' : 'Paid'} \u2013 \u20b9${r.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  reservationTableWrap.innerHTML = `
    <div class="card">
      <p><strong>Total revenue (paid, non-refunded):</strong> \u20b9${totalRevenue.toFixed(2)}</p>
    </div>
    <div class="card" style="overflow-x:auto;">
      <table class="admin-table">
        <thead>
          <tr><th>User</th><th>Location</th><th>Vehicle</th><th>Start</th><th>Status</th><th>Payment</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

async function loadReservations() {
  try {
    const reservations = await apiRequest('/reservations');
    renderReservationTable(reservations);
  } catch (err) {
    showError(errorEl, err.message);
  }
}

loadLocations();
loadReservations();

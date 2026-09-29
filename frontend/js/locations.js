requireAuth();

const errorEl = document.getElementById('error');
const locationList = document.getElementById('locationList');

document.getElementById('logoutLink').addEventListener('click', (e) => { e.preventDefault(); logout(); });

if (isAdmin()) {
  const adminLink = document.getElementById('adminLink');
  adminLink.style.display = 'inline';
  adminLink.href = 'admin.html';
}

function renderLocations(locations) {
  if (locations.length === 0) {
    locationList.innerHTML = '<div class="empty-state">No parking locations available yet.</div>';
    return;
  }
  locationList.innerHTML = locations.map(loc => {
    const low = loc.availableSlots === 0;
    return `
    <div class="card">
      <h3>${escapeHtml(loc.name)}</h3>
      <p class="hint">${escapeHtml(loc.address)}</p>
      <p>
        <span class="slot-count ${low ? 'low' : 'ok'}">${loc.availableSlots} / ${loc.totalSlots}</span> slots available
        &nbsp;\u00b7&nbsp; \u20b9${loc.pricePerHour}/hour
      </p>
      ${low
        ? `<button class="btn btn-sm" disabled>Full</button>`
        : `<a class="btn btn-sm" href="checkout.html?locationId=${loc._id}">Reserve &amp; Pay</a>`
      }
    </div>
  `;
  }).join('');
}

async function loadLocations() {
  try {
    const locations = await apiRequest('/locations');
    renderLocations(locations);
  } catch (err) {
    showError(errorEl, err.message);
  }
}

loadLocations();

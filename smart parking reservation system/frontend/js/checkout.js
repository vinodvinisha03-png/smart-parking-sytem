requireAuth();

const params = new URLSearchParams(window.location.search);
const locationId = params.get('locationId');

const errorEl = document.getElementById('error');
const paymentError = document.getElementById('paymentError');
const checkoutContent = document.getElementById('checkoutContent');

document.getElementById('logoutLink').addEventListener('click', (e) => { e.preventDefault(); logout(); });

let currentLocation = null;

if (!locationId) {
  showError(errorEl, 'No location selected. Go back to Locations and pick one to reserve.');
}

async function loadLocation() {
  if (!locationId) return;
  try {
    currentLocation = await apiRequest(`/locations/${locationId}`);
    document.getElementById('locName').textContent = currentLocation.name;
    document.getElementById('locAddress').textContent = currentLocation.address;
    document.getElementById('sumRate').textContent = `\u20b9${currentLocation.pricePerHour} / hour`;
    checkoutContent.style.display = 'flex';

    // Default start = now (rounded to next 15 min), end = +2 hours
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    document.getElementById('startTime').value = toLocalInputValue(now);
    document.getElementById('endTime').value = toLocalInputValue(later);
    recalcAmount();
  } catch (err) {
    showError(errorEl, err.message);
  }
}

function toLocalInputValue(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function currentAmount() {
  if (!currentLocation) return 0;
  const start = new Date(document.getElementById('startTime').value);
  const end = new Date(document.getElementById('endTime').value);
  if (isNaN(start) || isNaN(end) || end <= start) return null;
  const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
  return { hours, amount: Math.round(hours * currentLocation.pricePerHour * 100) / 100 };
}

function recalcAmount() {
  const result = currentAmount();
  const payBtn = document.getElementById('payBtn');
  if (!result) {
    document.getElementById('sumDuration').textContent = '\u2014';
    document.getElementById('sumTotal').textContent = '\u2014';
    document.getElementById('payAmountLabel').textContent = '';
    payBtn.disabled = true;
    return;
  }
  document.getElementById('sumDuration').textContent = `${result.hours} hour${result.hours > 1 ? 's' : ''}`;
  document.getElementById('sumTotal').textContent = `\u20b9${result.amount.toFixed(2)}`;
  document.getElementById('payAmountLabel').textContent = `\u20b9${result.amount.toFixed(2)}`;
  payBtn.disabled = false;
}

document.getElementById('startTime').addEventListener('input', recalcAmount);
document.getElementById('endTime').addEventListener('input', recalcAmount);

// --- Card preview + input formatting ---
const cardNumberInput = document.getElementById('cardNumber');
cardNumberInput.addEventListener('input', () => {
  let digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);
  cardNumberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
  const display = digits.padEnd(16, '\u2022').replace(/(.{4})/g, '$1 ').trim();
  document.getElementById('previewNumber').textContent = display;
});

document.getElementById('cardName').addEventListener('input', (e) => {
  document.getElementById('previewName').textContent = e.target.value.toUpperCase() || 'CARDHOLDER NAME';
});

const expiryInput = document.getElementById('expiry');
expiryInput.addEventListener('input', () => {
  let v = expiryInput.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
  expiryInput.value = v;
  document.getElementById('previewExpiry').textContent = v || 'MM/YY';
});

document.getElementById('cvv').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

// --- Submit / simulated payment processing ---
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  hideError(paymentError);

  const result = currentAmount();
  if (!result) {
    showError(paymentError, 'End time must be after start time.');
    return;
  }

  const vehicleNumber = document.getElementById('vehicleNumber').value.trim();
  if (!vehicleNumber) {
    showError(paymentError, 'Vehicle number is required.');
    return;
  }

  const payBtn = document.getElementById('payBtn');
  const originalLabel = payBtn.innerHTML;
  payBtn.disabled = true;
  payBtn.innerHTML = '<span class="spinner"></span> Processing payment...';

  // Small artificial delay so the "processing" state is visible, like a real gateway
  await new Promise(r => setTimeout(r, 1400));

  try {
    const reservation = await apiRequest('/reservations', {
      method: 'POST',
      body: {
        locationId,
        vehicleNumber,
        startTime: new Date(document.getElementById('startTime').value).toISOString(),
        endTime: new Date(document.getElementById('endTime').value).toISOString(),
        cardNumber: document.getElementById('cardNumber').value,
        expiry: document.getElementById('expiry').value,
        cvv: document.getElementById('cvv').value
      }
    });

    // Show a receipt in place of the checkout form
    checkoutContent.innerHTML = `
      <div class="card" style="max-width:460px; margin:0 auto;">
        <h3 style="color:var(--success);">\u2713 Payment successful</h3>
        <p class="hint">Your parking slot is reserved.</p>
        <div class="summary-row"><span>Transaction ID</span><span>${escapeHtml(reservation.transactionId)}</span></div>
        <div class="summary-row"><span>Location</span><span>${escapeHtml(reservation.location.name)}</span></div>
        <div class="summary-row"><span>Vehicle</span><span>${escapeHtml(reservation.vehicleNumber)}</span></div>
        <div class="summary-row"><span>Card used</span><span>\u2022\u2022\u2022\u2022 ${escapeHtml(reservation.cardLast4)}</span></div>
        <div class="summary-row total"><span>Amount paid</span><span>\u20b9${reservation.amount.toFixed(2)}</span></div>
        <a href="my-reservations.html" class="btn btn-amber" style="margin-top:18px; width:100%; text-align:center;">View my reservations</a>
      </div>
    `;
  } catch (err) {
    showError(paymentError, err.message);
    payBtn.disabled = false;
    payBtn.innerHTML = originalLabel;
  }
});

loadLocation();

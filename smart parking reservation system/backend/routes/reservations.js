const express = require('express');
const Reservation = require('../models/Reservation');
const ParkingLocation = require('../models/ParkingLocation');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function generateTransactionId() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `TXN-${Date.now().toString().slice(-6)}-${rand}`;
}

// This is a SIMULATED payment step: no real card network is contacted.
// Card details are used only to compute a display "last 4 digits" and are
// never stored in full or forwarded anywhere. It exists purely so the
// booking flow looks and behaves like a real checkout for demo purposes.
function validateCard({ cardNumber, expiry, cvv }) {
  const digitsOnly = (cardNumber || '').replace(/\s+/g, '');
  if (!/^\d{16}$/.test(digitsOnly)) return 'Card number must be 16 digits.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry || '')) return 'Expiry must be in MM/YY format.';
  if (!/^\d{3,4}$/.test(cvv || '')) return 'CVV must be 3 or 4 digits.';
  return null;
}

// POST /api/reservations - reserve a slot AND pay for it in one step
router.post('/', auth, async (req, res) => {
  try {
    const { locationId, vehicleNumber, startTime, endTime, cardNumber, expiry, cvv } = req.body;
    if (!locationId || !vehicleNumber || !startTime || !endTime) {
      return res.status(400).json({ error: 'locationId, vehicleNumber, startTime, and endTime are required.' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({ error: 'endTime must be after startTime, and both must be valid dates.' });
    }

    const cardError = validateCard({ cardNumber, expiry, cvv });
    if (cardError) return res.status(400).json({ error: cardError });

    const location = await ParkingLocation.findById(locationId);
    if (!location) return res.status(404).json({ error: 'Parking location not found.' });
    if (location.availableSlots <= 0) {
      return res.status(409).json({ error: 'No available slots at this location right now.' });
    }

    const hours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const amount = Math.round(hours * location.pricePerHour * 100) / 100;

    location.availableSlots -= 1;
    await location.save();

    const digitsOnly = cardNumber.replace(/\s+/g, '');
    const reservation = await Reservation.create({
      user: req.userId,
      location: locationId,
      vehicleNumber,
      startTime: start,
      endTime: end,
      status: 'active',
      amount,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      cardLast4: digitsOnly.slice(-4),
      transactionId: generateTransactionId()
    });

    const populated = await reservation.populate('location', 'name address pricePerHour');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not complete the booking and payment.' });
  }
});

// GET /api/reservations/my - the logged-in user's own reservations
router.get('/my', auth, async (req, res) => {
  const reservations = await Reservation.find({ user: req.userId })
    .populate('location', 'name address pricePerHour')
    .sort({ createdAt: -1 });
  res.json(reservations);
});

// GET /api/reservations - admin only, all reservations
router.get('/', auth, requireAdmin, async (req, res) => {
  const reservations = await Reservation.find()
    .populate('location', 'name address pricePerHour')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
  res.json(reservations);
});

// PUT /api/reservations/:id/cancel - owner or admin can cancel
router.put('/:id/cancel', auth, async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return res.status(404).json({ error: 'Reservation not found.' });

  const isOwner = reservation.user.toString() === req.userId;
  if (!isOwner && req.userRole !== 'admin') {
    return res.status(403).json({ error: "This isn't your reservation to cancel." });
  }
  if (reservation.status !== 'active') {
    return res.status(400).json({ error: 'Only active reservations can be cancelled.' });
  }

  reservation.status = 'cancelled';
  reservation.paymentStatus = 'refunded';
  await reservation.save();

  // Free up the slot again
  const location = await ParkingLocation.findById(reservation.location);
  if (location) {
    location.availableSlots = Math.min(location.totalSlots, location.availableSlots + 1);
    await location.save();
  }

  res.json(reservation);
});

module.exports = router;

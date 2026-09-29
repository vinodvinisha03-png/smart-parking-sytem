const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLocation', required: true },
  vehicleNumber: { type: String, required: true, trim: true, uppercase: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ['card'], default: 'card' },
  paymentStatus: { type: String, enum: ['paid', 'refunded'], default: 'paid' },
  cardLast4: { type: String, required: true },
  transactionId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Reservation', reservationSchema);

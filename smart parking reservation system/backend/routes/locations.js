const express = require('express');
const ParkingLocation = require('../models/ParkingLocation');
const { auth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/locations - everyone logged in can browse
router.get('/', auth, async (req, res) => {
  const locations = await ParkingLocation.find().sort({ createdAt: -1 });
  res.json(locations);
});

// GET /api/locations/:id
router.get('/:id', auth, async (req, res) => {
  const location = await ParkingLocation.findById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Parking location not found.' });
  res.json(location);
});

// POST /api/locations - admin only
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { name, address, totalSlots, pricePerHour } = req.body;
    if (!name || !address || !totalSlots || pricePerHour === undefined) {
      return res.status(400).json({ error: 'name, address, totalSlots, and pricePerHour are required.' });
    }
    const location = await ParkingLocation.create({
      name, address,
      totalSlots, availableSlots: totalSlots,
      pricePerHour,
      createdBy: req.userId
    });
    res.status(201).json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create the parking location.' });
  }
});

// PUT /api/locations/:id - admin only
router.put('/:id', auth, requireAdmin, async (req, res) => {
  const location = await ParkingLocation.findById(req.params.id);
  if (!location) return res.status(404).json({ error: 'Parking location not found.' });

  const { name, address, totalSlots, pricePerHour } = req.body;
  if (name !== undefined) location.name = name;
  if (address !== undefined) location.address = address;
  if (pricePerHour !== undefined) location.pricePerHour = pricePerHour;

  if (totalSlots !== undefined && totalSlots !== location.totalSlots) {
    // Keep availableSlots in sync with any change to totalSlots
    const diff = totalSlots - location.totalSlots;
    location.totalSlots = totalSlots;
    location.availableSlots = Math.max(0, location.availableSlots + diff);
  }

  await location.save();
  res.json(location);
});

// DELETE /api/locations/:id - admin only
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  const location = await ParkingLocation.findByIdAndDelete(req.params.id);
  if (!location) return res.status(404).json({ error: 'Parking location not found.' });
  res.json({ message: 'Parking location deleted.' });
});

module.exports = router;

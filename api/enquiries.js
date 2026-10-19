import { db } from 'hatchable';

export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  const body = req.body || {};
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const pickup = typeof body.pickup === 'string' ? body.pickup.trim() : '';
  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  const tripType = ['One way', 'Round trip', 'Local rental', 'Airport transfer'].includes(body.tripType) ? body.tripType : 'One way';
  const passengers = Number.parseInt(body.passengers, 10);
  const travelDate = typeof body.travelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.travelDate) ? body.travelDate : null;
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';
  if (!fullName || fullName.length > 120 || !phone || phone.length > 30 || !pickup || pickup.length > 180 || !destination || destination.length > 180) {
    return res.status(400).json({ error: 'Please provide your name, phone number, pickup and destination.' });
  }
  if (!Number.isInteger(passengers) || passengers < 1 || passengers > 20) {
    return res.status(400).json({ error: 'Passengers must be between 1 and 20.' });
  }
  if (body.website) return res.status(200).json({ ok: true });
  try {
    const result = await db.query(
      'INSERT INTO trip_enquiries (full_name, phone, pickup, destination, travel_date, trip_type, passengers, message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, created_at',
      [fullName, phone, pickup, destination, travelDate, tripType, passengers, message]
    );
    return res.status(201).json({ ok: true, enquiryId: result.rows[0].id, message: 'Your trip request has been received. Our team will contact you to confirm availability and pricing.' });
  } catch (error) {
    return res.status(500).json({ error: 'We could not submit your request right now. Please try again shortly.' });
  }
}
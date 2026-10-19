import { db } from 'hatchable';

export const access = 'admin';
export const methods = ['GET', 'PATCH'];

const validStatuses = ['New', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'];

export default async function (req, res) {
  if (req.method === 'GET') {
    const result = await db.query(
      'SELECT id, full_name, phone, pickup, destination, travel_date, trip_type, passengers, message, status, created_at FROM trip_enquiries ORDER BY created_at DESC LIMIT 500'
    );
    return res.json({ enquiries: result.rows });
  }

  const body = req.body || {};
  const id = Number.parseInt(body.id, 10);
  const status = typeof body.status === 'string' ? body.status : '';
  if (!Number.isInteger(id) || id < 1 || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'A valid enquiry ID and status are required.' });
  }
  const result = await db.query(
    'UPDATE trip_enquiries SET status = $1 WHERE id = $2 RETURNING id, status',
    [status, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: 'Enquiry not found.' });
  return res.json({ ok: true, enquiry: result.rows[0] });
}
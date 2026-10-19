const RESEND_ENDPOINT = "https://api.resend.com/emails";
const RECIPIENT = "divinetravels751@gmail.com";
const MAX_BODY_BYTES = 12_000;
const MAX_FIELD_LENGTH = 1000;

function clean(value, max = 180) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      const parsedOrigin = new URL(origin);
      if (parsedOrigin.host !== host) {
        return res.status(403).json({ error: "Request origin not allowed." });
      }
    } catch {
      return res.status(403).json({ error: "Invalid request origin." });
    }
  }

  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (!contentType.includes("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json." });
  }

  let rawBody = "";
  try {
    if (typeof req.body === "string") rawBody = req.body;
    else if (req.body && typeof req.body === "object") rawBody = JSON.stringify(req.body);
    else rawBody = "";
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "Enquiry is too large." });
    }
  } catch {
    return res.status(400).json({ error: "Invalid request body." });
  }

  let input;
  try {
    input = typeof req.body === "object" && req.body !== null ? req.body : JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: "Invalid JSON." });
  }

  // Silently discard automated submissions that fill the hidden honeypot.
  if (clean(input.website, 200)) return res.status(200).json({ ok: true });

  const fullName = clean(input.fullName, 120);
  const phone = clean(input.phone, 30);
  const pickup = clean(input.pickup, 180);
  const destination = clean(input.destination, 180);
  const email = clean(input.email, 254);
  const tripType = clean(input.tripType, 50);
  const travelDate = clean(input.travelDate, 20);
  const pickupTime = clean(input.pickup_time, 30);
  const returnDate = clean(input.return_date, 20);
  const vehicle = clean(input.vehicle, 80);
  const estimatedKm = clean(input.estimated_km, 20);
  const passengers = clean(input.passengers, 3);
  const message = clean(input.message, MAX_FIELD_LENGTH);
  const packageStops = Array.isArray(input.package_stop)
    ? input.package_stop.slice(0, 20).map(value => clean(value, 120)).filter(Boolean)
    : input.package_stop ? [clean(input.package_stop, 120)] : [];

  if (!fullName || !phone || !pickup || !destination) {
    return res.status(400).json({ error: "Name, phone, pickup and destination are required." });
  }
  if (!/^[+0-9()\s.-]{7,30}$/.test(phone)) {
    return res.status(400).json({ error: "Enter a valid phone number." });
  }
  if (email && !/^[^\s@]+@[^\s@]+\\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (travelDate && !/^\d{4}-\d{2}-\d{2}$/.test(travelDate)) {
    return res.status(400).json({ error: "Travel date must use YYYY-MM-DD." });
  }

  const rows = [
    ["Customer name", fullName],
    ["Phone", phone],
    ["Customer email", email],
    ["Trip type", tripType],
    ["Pickup", pickup],
    ["Destination", destination],
    ["Travel date", travelDate],
    ["Pickup time", pickupTime],
    ["Return date", returnDate],
    ["Vehicle", vehicle],
    ["Estimated distance (km)", estimatedKm],
    ["Passengers", passengers],
    ["Package stops", packageStops.join(", ")],
    ["Additional details", message]
  ].filter(([, value]) => value);
  const text = [
    "A new trip enquiry was submitted on the Divine Travels website.",
    "",
    ...rows.map(([label, value]) => label + ": " + value),
    "",
    "This is an enquiry, not a confirmed booking."
  ].join("\n");
  const html = `<h2>New Divine Travels trip enquiry</h2><table cellpadding="6" cellspacing="0" border="0">${rows.map(([label, value]) => `<tr><th align="left" valign="top">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</table><p>This is an enquiry, not a confirmed booking.</p>`;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Divine Travels <onboarding@resend.dev>";
  if (!apiKey) {
    console.error("Booking email is not configured: RESEND_API_KEY is missing.");
    return res.status(503).json({ error: "Email service is not configured yet." });
  }

  try {
    const emailResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [RECIPIENT],
        subject: `New taxi enquiry: ${fullName} — ${pickup} to ${destination}`.slice(0, 180),
        text,
        html,
        ...(email ? { reply_to: email } : {})
      })
    });
    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      console.error("Resend rejected booking email:", emailResponse.status, details.slice(0, 500));
      return res.status(502).json({ error: "Email delivery failed. Please use WhatsApp to complete your enquiry." });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Booking email request failed:", error instanceof Error ? error.message : "Unknown error");
    return res.status(502).json({ error: "Email service is temporarily unavailable." });
  }
}

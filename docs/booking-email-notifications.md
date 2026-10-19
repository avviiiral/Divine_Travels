# Booking email notifications (Vercel + Resend)

The booking form keeps its existing fields and WhatsApp flow. It now also POSTs the form values to `/api/booking`, a Vercel serverless function that sends an email through Resend.

## Required setup

1. Create/sign in to a Resend account at https://resend.com/.
2. Add and verify a domain you control in Resend. Configure the DNS records Resend provides. A verified sender domain is needed to send to the booking inbox reliably; the Resend onboarding sender is for limited testing.
3. In Resend, create an API key with the minimum permissions needed to send email.
4. In Vercel, open the Divine Travels project → Settings → Environment Variables and add:
   - `RESEND_API_KEY`: the secret API key from Resend.
   - `RESEND_FROM_EMAIL`: a sender on your verified domain, e.g. `Divine Travels <bookings@your-verified-domain.example>`. Replace the example with a real verified sender address.
5. Enable the variables for Production (and Preview if you intend to test previews), save, then redeploy the latest deployment so the function receives them.
6. Test a booking using a real set of details. Confirm an email arrives at `divinetravels751@gmail.com` and that WhatsApp opens with the same trip details. Check Resend's email logs if delivery fails.

Do not put the Resend API key in `public/config.js`, frontend JavaScript, HTML, or Git. The API key is only read by the server-side function.

## Behaviour and validation

- Existing form fields and the current WhatsApp message are retained.
- The browser opens WhatsApp immediately, then sends the enquiry to the email endpoint.
- Email success and failure are reported separately; a failed email does not prevent the WhatsApp route from being used.
- The server validates required name, phone, pickup and destination fields, checks content type and payload size, limits field lengths, and ignores submissions that fill the honeypot.
- This endpoint does not store enquiries in a database. Because it is a public endpoint, add a managed rate limiter or Vercel Firewall rule before high-traffic production use.

## Local testing

The endpoint requires a Vercel-compatible runtime and the environment variables above. Use the Vercel CLI (for example, `vercel dev`) with local environment variables to test it; do not commit secrets to the repository.

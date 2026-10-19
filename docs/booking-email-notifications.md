# Booking email notifications (Vercel + Resend)

The booking form keeps its existing fields and WhatsApp flow. It also POSTs the form values to `/api/booking`, a Vercel serverless function that sends an email through Resend.

## Free setup (no custom domain required for initial testing)

1. Create a free Resend account at https://resend.com/ **using the notification inbox `divinetravels751@gmail.com`** and verify that email address.
2. Create an API key in Resend.
3. In Vercel, open the Divine Travels project → Settings → Environment Variables and add:
   - `RESEND_API_KEY`: the secret API key from Resend.
   - `RESEND_FROM_EMAIL`: optional for this initial test. If omitted, the function uses `Divine Travels <onboarding@resend.dev>`.
4. Enable `RESEND_API_KEY` for Production (and Preview if you intend to test previews), save, then redeploy so the function receives it.
5. Submit a real test enquiry. Confirm an email arrives at `divinetravels751@gmail.com` and that WhatsApp opens with the same trip details.

**Important Resend test-mode restriction:** the `onboarding@resend.dev` sender can send only to the email address associated with your Resend account. That is why the account should be registered to `divinetravels751@gmail.com` for this no-domain setup. If the recipient must differ from the Resend account email, or you want a branded sender for broader production use, add and verify a domain you control in Resend and set `RESEND_FROM_EMAIL` to an address on that verified domain.

Resend currently lists a free plan with up to 3,000 emails per month and a daily limit of 100; check its [current pricing](https://resend.com/pricing) for any changes or conditions.

Do not put the Resend API key in `public/config.js`, frontend JavaScript, HTML, or Git. The API key is only read by the server-side function.

## Behaviour and validation

- Existing form fields and the current WhatsApp message are retained.
- The browser opens WhatsApp immediately, then sends the enquiry to the email endpoint.
- Email success and failure are reported separately; a failed email does not prevent the WhatsApp route from being used.
- The server validates required name, phone, pickup and destination fields, checks content type and payload size, limits field lengths, and ignores submissions that fill the honeypot.
- This endpoint does not store enquiries in a database. Because it is a public endpoint, add a managed rate limiter or Vercel Firewall rule before high-traffic production use.

## Local testing

The endpoint requires a Vercel-compatible runtime and the environment variables above. Use the Vercel CLI (for example, `vercel dev`) with local environment variables to test it; do not commit secrets to the repository.

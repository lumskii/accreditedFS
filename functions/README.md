# Cloud Functions for accreditedFS

This folder contains Firebase Cloud Functions used to generate and email dispute letters when a user subscribes for a free dispute letter.

## Setup

1. Install dependencies:

```bash
cd functions
npm install
```

2. Add the `afs-min.png` logo to the functions folder so the PDF can include the logo:

```bash
# from project root
cp ../public/assets/afs-min.svg ./afs-min.png
# or add your own PNG logo directly into functions/
```

3. Configure Gmail credentials for Nodemailer (or use SendGrid/other SMTP service):

```bash
firebase functions:config:set gmail.user="your@gmail.com" gmail.pass="yourgmailpassword"
```

> For production, prefer using a transactional email service (SendGrid, Mailgun) and store API keys in `functions.config()`.

4. Build and deploy:

```bash
cd functions
npm run build
firebase deploy --only functions
```

## Trigger

The function listens to new children under `/disputeRequests/{pushId}` in the Realtime Database. When a new entry is added, the function generates a PDF and emails it to the supplied address.

## Notes

- Ensure `afs-min.png` is present in the `functions/` directory (packaged with the function) if you want the logo embedded in the PDF.
- The function writes a `status` child under the created node if an error occurs.
- For higher throughput, consider using a dedicated email API (SendGrid) instead of Gmail.

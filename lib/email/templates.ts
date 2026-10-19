// Transactional emails. Plain, light layout for readability in every mail
// client. All user-supplied values go through esc().

export const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type Email = { subject: string; html: string; text: string };

function layout(title: string, body: string, cta?: { label: string; url: string }, foot = "") {
  const button = cta
    ? `<p style="margin:28px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#141416;color:#faf8f4;text-decoration:none;padding:14px 26px;font:600 13px/1 Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#faf8f4;color:#141416">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0"><tr><td style="font:15px/1.6 Helvetica,Arial,sans-serif">
<p style="font:400 26px/1 Georgia,serif;letter-spacing:.14em;margin:0 0 32px">JOD-Z</p>
<h1 style="font:400 28px/1.2 Georgia,serif;margin:0 0 16px">${esc(title)}</h1>
${body}${button}
<p style="color:#6b675f;font-size:12px;margin-top:40px">${foot || "Jod-Z. Designed and tested by riders."}</p>
</td></tr></table></td></tr></table></body></html>`;
}

const p = (t: string) => `<p style="margin:0 0 14px">${t}</p>`;

export const templates = {
  signIn: (url: string): Email => ({
    subject: "Your Jod-Z sign-in link",
    html: layout("Sign in to Jod-Z", p("Use the button below to sign in. The link works once and expires in 15 minutes."), { label: "Sign in", url }, "If you did not ask for this, ignore this email. Nobody can sign in without the link."),
    text: `Sign in to Jod-Z: ${url}\n\nThe link works once and expires in 15 minutes.`,
  }),

  confirmSubscription: (url: string): Email => ({
    subject: "Confirm your Jod-Z subscription",
    html: layout("One more step", p("Confirm your email to get new colours, restocks and rider stories from Jod-Z. Unsubscribe any time."), { label: "Confirm subscription", url }),
    text: `Confirm your Jod-Z subscription: ${url}`,
  }),

  guardianConsent: (rider: string, url: string): Email => ({
    subject: `${rider} has applied to be a Jod-Z Ambassador`,
    html: layout(
      "Your permission is needed",
      p(`${esc(rider)} has applied to join the Jod-Z Ambassador programme. Because they are under 16, we need a parent or guardian to agree before we review the application or use their details. If you do not agree, we delete them within 30 days.`) +
        p("Ambassadors get a personal discount code to share with friends. We only use their name, email and social handle to run the programme. You can withdraw consent at any time by emailing hello@jod-z.com."),
      { label: "I give permission", url },
      "If you do not recognise this application, ignore this email and the details will be deleted within 30 days.",
    ),
    text: `${rider} has applied to be a Jod-Z Ambassador. As they are under 16 we need your permission: ${url}`,
  }),

  ambassadorReceived: (name: string): Email => ({
    subject: "Your Jod-Z Ambassador application",
    html: layout(`Thanks, ${esc(name.split(" ")[0])}.`, p("We have your application. We review every one by hand and will email you with your personal code once you are in.")),
    text: "We have your Jod-Z Ambassador application and will email you with your code once you are in.",
  }),

  ambassadorApproved: (name: string, code: string, pct: number, portalUrl: string): Email => ({
    subject: "You are a Jod-Z Ambassador",
    html: layout(
      `Welcome in, ${esc(name.split(" ")[0])}.`,
      p(`Your code is <strong style="font-size:20px;letter-spacing:.1em">${esc(code)}</strong>.`) + p(`Friends get ${pct}% off with it, and you can see every order it brings in from your partner portal.`),
      { label: "Open partner portal", url: portalUrl },
    ),
    text: `Welcome to Jod-Z Ambassadors. Your code is ${code}. Friends get ${pct}% off. Partner portal: ${portalUrl}`,
  }),

  retailerReceived: (store: string): Email => ({
    subject: "Your Jod-Z trade account application",
    html: layout("Application received.", p(`Thank you for applying to stock Jod-Z at ${esc(store)}. We review every account within five working days and will email your trade terms.`)),
    text: `Thank you for applying to stock Jod-Z at ${store}. We review every account within five working days.`,
  }),

  retailerApproved: (name: string, portalUrl: string): Email => ({
    subject: "Your Jod-Z trade account is open",
    html: layout(`You are in, ${esc(name.split(" ")[0])}.`, p("Your trade account is approved. Sign in with this email address to order stock, track orders and reorder in one tap."), { label: "Open trade portal", url: portalUrl }),
    text: `Your Jod-Z trade account is approved. Sign in at ${portalUrl}`,
  }),

  wholesaleOrder: (ref: string, store: string, totalLabel: string, portalUrl: string): Email => ({
    subject: `Trade order ${ref} received`,
    html: layout(`Order ${esc(ref)} is in.`, p(`We have the order for ${esc(store)}, ${esc(totalLabel)} including VAT. We will confirm stock and dispatch within two working days.`), { label: "View order", url: portalUrl }),
    text: `Trade order ${ref} for ${store}, ${totalLabel} including VAT, received.`,
  }),

  contactReceipt: (name: string): Email => ({
    subject: "We have your message",
    html: layout(`Thanks, ${esc(name.split(" ")[0])}.`, p("Your message is with the Jod-Z team. We reply within one working day, usually sooner.")),
    text: "Your message is with the Jod-Z team. We reply within one working day.",
  }),

  notify: (title: string, rows: [string, string][], url: string): Email => ({
    subject: `[Jod-Z] ${title}`,
    html: layout(title, `<table cellpadding="6" style="border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="color:#6b675f;vertical-align:top">${esc(k)}</td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`, { label: "Open dashboard", url }),
    text: `${title}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${url}`,
  }),
};

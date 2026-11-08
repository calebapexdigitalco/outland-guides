OUTLAND GUIDES — LOCAL STRIPE SANDBOX

Start: run start.ps1 in PowerShell, or run node stripe-sandbox/server.mjs
from the project folder. Keep that process running while testing.

Website with payment API: http://localhost:4184/payments.html
The existing preview at localhost:4183 also connects to this API.
The old sandbox form and its JavaScript are retained in this folder;
the local server serves them only on localhost. The public payment page
uses the separate SiteGround PHP connection and approved payment links.

PRIVATE KEY SETUP
The server prints a private setup link. Open it on this computer, then
enter the replacement Stripe sandbox key in that page's password field.
The server checks the key with Stripe and stores it in:
%LOCALAPPDATA%\OutlandGuides\stripe-sandbox.json

That folder is outside the website and repository. Never upload it.
Do not paste keys into chat or put keys in the website files.
No secret values are returned to the browser or written to server logs.
Restart the server if you need a fresh private setup link.

TEST PAYMENTS
Only sk_test_ and rk_test_ keys are accepted. Live keys are refused.
The server sets the amounts, ignoring any client-supplied amount:
Deposit $10; remaining balance $20; full payment $30.
These test amounts have no relationship to actual expedition prices.

Use Stripe test card 4242 4242 4242 4242, a future expiration, any
three-digit CVC, and fictional test details. Never use a real card.

A successful checkout returns to the payment page, which retrieves the
Checkout Session from Stripe and checks payment_status before displaying
success. This test integration does not reserve trips, automatically
fulfill bookings, send booking confirmations, or charge real money.
Review test transactions in your Stripe sandbox dashboard.

This Node server binds only to this computer. It is not a production
payment server and cannot simply be uploaded to static hosting.
Before live deployment, add approved booking amounts stored server-side,
private booking access links, verified Stripe webhook processing,
durable/idempotent payment records, and the production host configuration.
Keep the sandbox server and private setup page off your public website.

Checks: start the server, then run node --test stripe-sandbox/server.test.mjs

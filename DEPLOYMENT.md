# SiteGround connection

The website remains on its existing SiteGround hosting. GitHub Actions sends only `outputs/` over SFTP; it does not upload the repository, local Stripe server, or credentials. Files are uploaded under temporary names and renamed after each transfer. Assets go first and the homepage goes last. Existing files not managed by this source are preserved, including the current WordPress-upload media dependencies and `.htaccess`.

## 1. Correct GitHub account

The repository is `calebapexdigitalco/outland-guides`.

On this computer, `gh auth status` shows saved accounts. To select the website owner after signing in:

```
gh auth switch --hostname github.com --user calebapexdigitalco
```

To remove only the other account's command-line login, if desired:

```
gh auth logout --hostname github.com --user cmbennett07
```

This does not delete a GitHub account or its repositories. Browser logins and the GitHub connector are separate from this command-line login.

## 2. Allow the deployment key on SiteGround

Open SiteGround → Websites → Outland Guides → Site Tools → Devs → SSH Keys Manager → Import.

Import the supplied PUBLIC deployment key with a descriptive name such as `Outland GitHub deployment`. The private key stays outside the website and goes only into the GitHub Actions secret below. SiteGround SSH keys can access all files for the site, so keep the private half confidential.

From the key's Actions menu, open SSH Credentials. Record the host, username, and port. SiteGround normally uses port `18765`.

Confirm the full destination for this site in File Manager; it is normally `/home/customer/www/outlandguides.com/public_html`.

If SiteGround restricts this key by IP, the GitHub-hosted runner must be allowed to connect. Do not assume this computer's IP also covers GitHub Actions. A successful local connection and a successful Actions connection must both be tested.

## 3. GitHub Actions secrets

Repository → Settings → Secrets and variables → Actions → New repository secret.

| Name | Value |
| --- | --- |
| `SITEGROUND_HOST` | SSH hostname from SiteGround; no `https://` prefix |
| `SITEGROUND_USER` | SSH username from SiteGround |
| `SITEGROUND_PORT` | SSH port from SiteGround, normally `18765` |
| `SITEGROUND_PATH` | Exact absolute `public_html` path for outlandguides.com |
| `SITEGROUND_SSH_KEY` | Complete private deployment key; never paste into chat or a repository file |
| `SITEGROUND_KNOWN_HOSTS` | Verified SSH host-key entry for this hostname and port |

The connection uses `StrictHostKeyChecking=yes`. Verify the SSH server's fingerprint with SiteGround before storing its host-key entry; do not disable that check to get a deployment to pass.

Secrets can also be installed locally with `gh secret set` reading protected files through standard input. Never put a private key on the command line or in a commit.

## 4. Enable and test publishing

Deployment stays off while connection details are missing. In Settings → Secrets and variables → Actions → Variables, set repository variable `SITEGROUND_DEPLOY_ENABLED` to `true` after setup.

Run the workflow from the Actions tab on `main`. It must show both the file checks and SiteGround publishing as successful. The publishing job confirms a public `assets/deployment.json` release marker against the GitHub commit and checks that the homepage loads.

After this first successful run, a push to `main` affecting website files or deployment scripts publishes automatically. Editing files only on your computer does not publish them.

## 5. Future edits

Keep `outputs/` as the source of truth. Avoid editing SiteGround files directly; those edits would be replaced on a later deployment. Ask for the change, test it locally, commit it, and publish when ready. A manually uploaded release remains possible, but GitHub must be updated to match it.

## If a deployment fails

Open its Actions run and read the failed step. A missing-secret error requires the listed secret; a host-key error requires verification of the server key; permission denied requires checking the imported public key, credentials, and allowed IPs. Existing files are never recursively deleted by this workflow.

If a release needs undoing, revert that commit and publish again. Old renamed or removed files are intentionally preserved on the server until explicitly cleaned up; the workflow updates the tracked site files rather than deleting everything in `public_html`.

## Page addresses

Public links use extensionless addresses, such as `/gear-help` and `/kilimanjaro`. The root `.htaccess` maps these requests internally to the existing HTML files. It sends no redirects, and the HTML files remain directly accessible. Assets and navigation links use root-relative paths so they also work on these addresses. The deployment manages this routing file and uploads it last.

## Payments

The central `/payments` page uses a small PHP connection on SiteGround at `/api/stripe/`. No Node hosting is needed. Payment code is versioned and deployed; credentials and the SQLite payment ledger are stored in `/home/customer/www/outlandguides.com/private/outland-payments`, outside `public_html` and outside GitHub. Deployment preserves this private directory.

Run `python scripts/connect-stripe.py` locally and open the private localhost link it prints. Enter the live secret key in that page, never in chat or source files. Setup checks Stripe account activation and bank payouts, registers a signed Checkout webhook, and saves credentials privately on SiteGround. A protected recovery copy is kept under `%LOCALAPPDATA%/OutlandGuides/payments`. The setup page runs only on this computer, accepts a one-time token, and never charges anyone.

Only approved booking payment requests can reach Checkout. Each link fixes the expedition, reference, payment type, and exact amount due now. Public website prices are not used to calculate charges. The server verifies amounts, payment status, mode, and the booking identity before recording payment. Signed webhooks record payment even when a guest closes the browser. Repeated checkout clicks reuse the same session, paid links cannot charge again, and retry attempts use persistent idempotency keys. Credentials and card details never go to the browser; card collection happens on Stripe's hosted Checkout page.

After agreeing on the trip and amount with a guest, create a private link locally:

```
python scripts/create-payment-request.py --reference OG-2027-001 --amount 999.50 --expedition "Mount Kilimanjaro" --route "Machame 7-Day" --type "Deposit"
```

The command above is an example only: replace its amount with the actual approved amount due now. It creates a link, not a charge, and sends no email. Share the returned link only with the guest. Optional `--email` prefills Stripe's checkout email; `--valid-days` sets link validity (default seven days, maximum 90). Create a separate request for a later balance. Keep the booking's full proposal and cancellation agreement in your normal booking records. Payment confirmation alone does not automatically arrange guide logistics or reserve dates.

Manage payouts, refunds, disputes, and payment receipts in Stripe. Turn on successful-payment receipt emails in Stripe's customer email settings. Paid links stay paid after a refund; use a newly approved request if another payment is needed. Check Stripe before reissuing a request after an uncertain payment. No real card was charged during development tests.


## Customer accounts and group bookings

`/payments` is the public trip and group-size selector. `/account` is the customer and owner portal. The application uses PHP and a private SQLite database on the existing SiteGround account; no Supabase project was created. Guests sign in with an eight-digit email code (ten-minute expiry, five verification attempts, single use). Session cookies are Secure, HttpOnly, SameSite=Lax; state-changing actions require an origin check and CSRF token. SiteGround's PHP mail transport sends login codes from info@outlandguides.com. Actual inbox delivery must be checked with that mailbox before promoting the portal.

Owner addresses are configured in the private `portal.json` file beside the Stripe configuration. The initial owner is info@outlandguides.com. Roles cannot be changed from browser inputs. Customers can access only their own booking records and messages; owners can view requests and confirm dates. Date confirmation is required before either deposit or full payment.

Pricing is calculated in `outputs/api/booking/catalog.php`. The provided group tier applies to every traveler in the booking; the group total multiplies the tier's per-person amount by the actual traveler count. Kilimanjaro and Safari require at least two travelers. Fuego shared cabins cost $200/person for the one-night itinerary; the private two-person cabin costs $499 total. Private-cabin bookings contain exactly two travelers and one cabin charge. Deposits are 50%, rounded up to cents. Balances subtract verified payments and account for recorded refunds. Larger groups and custom arrangements can be handled through consultation.

Paid Checkout Sessions return to `/account` with the booking reference. Stripe webhook processing records successful payments and cumulative refunds. One active booking checkout is reused; changing payment options expires the previous open session. Refunds are managed in Stripe, not from the portal. Messages are read when the booking list loads or is refreshed; this version does not send email notifications for new messages or date approvals.

The older private payment-link flow remains available for previously issued links. The default public page uses the trip selector and account flow.
# Public URLs, search metadata, and shared policies

The public site uses `/kilimanjaro`, `/safari`, `/privacy-terms`, and the other clean page addresses. HTML files remain the source backing files in Git, but deployment places them outside public_html in the site-specific private/outland-pages folder. A small allowlisted PHP controller serves the clean addresses. The exact known public HTML duplicates are removed on deployment, and explicit browser requests for `*.html` return HTTP 404 without redirects. This also prevents SiteGround static delivery from bypassing rewrite-only protections. Do not block the old HTML URLs in robots.txt, because crawlers must be able to observe their 404 response.

Run `python scripts/build-seo.py` after adding or updating the metadata catalog. It writes unique titles/descriptions, canonical URLs, social metadata, organization/site/page structured data, robots.txt, and sitemap.xml. The sitemap contains public information pages only. Account and payments pages use `noindex,follow` and are intentionally crawlable so crawlers can read that instruction.

The shared footer source is `templates/site-footer.html`; synchronize it with `python scripts/sync-footer.py`. Policy body content is maintained in `templates/privacy-terms-main.html` and the published `outputs/privacy-terms.html`. Keep any policy changes consistent with accepted booking agreements and the actual data flow; a public policy does not replace a separately reviewed activity waiver or legal advice.

Responsive gallery assets are generated with Pillow by `python scripts/optimize-gallery.py`. Preserve the original files for lightbox expansion. Gallery cards and carousels use `image-assets.js`, responsive WebP variants, and lazy loading. Regenerate the variants if a source photo changes. The retired `assets/kilimanjaro-routes.js` is explicitly removed on deployment because it contained obsolete routes/prices and a booking demonstration.

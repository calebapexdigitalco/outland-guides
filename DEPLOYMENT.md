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

This deployment publishes the existing static site. The current payment page is sandbox-only and its API is not hosted. Production Stripe checkout, real booking amounts, and webhook handling are separate work; no live payment capability is enabled by this workflow.

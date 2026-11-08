# Outland Guides

Website source for https://outlandguides.com, hosted on SiteGround.

## Where changes belong

- `outputs/` contains the complete public website. Edit these files for page, layout, form, and pricing updates.
- `scripts/` contains website validation and publishing tools. These are not uploaded to the website.
- `.github/workflows/siteground.yml` checks changes and publishes `outputs/` to SiteGround.
- `stripe-sandbox/` is the separate local Stripe test server. Publishing the static website does not enable online Stripe payments.
- The original branding files in the repository root are retained from the existing repository.

No build step or Node.js hosting project is needed for the public pages.

## Editing and publishing

1. Edit the files in `outputs/`.
2. Run `python scripts/check-site.py` and `python -m unittest discover -s scripts -p "test_*.py"`.
3. Commit and push the finished changes to `main`.
4. Check the GitHub Actions run. Once deployment is enabled, a successful run confirms the uploaded release at the public domain.

Pull requests run checks without deploying. `Actions → Website checks and SiteGround deployment → Run workflow` republishes the selected branch; deployment only runs on `main`.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the initial connection and recovery steps.

The local `work/`, `tmp/`, and `deliverables/` folders are excluded from Git. Never commit passwords, private SSH keys, Stripe secrets, or `.env` files.

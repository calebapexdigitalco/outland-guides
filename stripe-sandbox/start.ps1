$stripeRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
try {
  $stripeStatus = Invoke-RestMethod 'http://127.0.0.1:4184/api/stripe/config' -TimeoutSec 2
  Write-Host 'Stripe sandbox is running: http://localhost:4184/payments.html'
  exit
} catch {}
$stripeNode = (Get-Command node -ErrorAction Stop).Source
& $stripeNode (Join-Path $stripeRoot 'server.mjs')

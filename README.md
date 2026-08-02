# FrontSeat Commercial Pilot v1.0

FrontSeat is a tablet-first restaurant host, waitlist, reservation, and seating-management product designed for independent restaurants.

## Operational features

- Visual touch-friendly floor plan
- Fast walk-in waitlist and one-tap seating
- Smart table recommendations
- Reservation conflict awareness
- Server workload tracking
- Table timers, cleaning queue, and status flow
- Undo for common actions
- Shift metrics and activity history
- Light, dark, high-contrast, and large-text modes
- Offline-capable PWA

## Commercial controls

- Guided restaurant onboarding
- Restaurant/location identity
- Owner and manager PIN access
- Host, manager, and owner device roles
- Local pilot license identifier
- Automatic daily device backup snapshot
- Full JSON backup export
- Audit-log CSV export
- Restore from daily backup
- Downloadable support package and client error log
- Privacy and pilot-terms templates

## Important product boundary

This repository is the **self-hosted commercial pilot edition**. Operational data is stored in the browser on the restaurant device. This makes it suitable for paid pilots and local installations, but it is not yet a centrally hosted multi-tenant SaaS.

Do not represent this edition as providing secure cloud accounts, cross-device synchronization, payment processing, POS integration, SMS delivery, or guaranteed remote backups. Those features require a production backend and vendor accounts.

## Before accepting customers

1. Replace the seller placeholders in `privacy.html` and `terms.html`.
2. Have a qualified attorney review the customer agreement and privacy notice.
3. Create a support email and written refund/cancellation policy.
4. Test the app on the exact iPad/Android devices used by the restaurant.
5. Export and restore a backup during customer onboarding.
6. Train the restaurant owner on device security and daily backups.
7. Use a written invoice/order that states this is the self-hosted pilot edition.

## GitHub Pages

The repository deploys through GitHub Actions. In repository settings, set Pages source to **GitHub Actions**.

Live URL: `https://zaspdragon.github.io/FrontSeat/`

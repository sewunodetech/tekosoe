# Landing images

`trip.jpg` and `invoice.jpg` are real screenshots of the app in demo mode (Japan Trip, and Jack's invoice) at a 375×812 viewport, 1.56x (585×1267). They are the same captures as `docs/assets/screens/trip.png` and `invoice.png`, saved as JPEG for the web, and are used on the landing page ("Try the demo") and on `/get-app`. If the app changes, retake them and convert to JPEG under the same names (the code loads `.jpg`).

The hero, "How it works", "Built with" and closing CTA panels no longer use images: they are 3D scenes in `src/components/landing/three/` (see ADR 0010).

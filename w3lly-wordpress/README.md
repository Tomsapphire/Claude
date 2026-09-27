# W3lly landing page — WordPress / Elementor export

`w3lly-landing-page.elementor.json` is an Elementor page template. It is built from native Elementor containers and widgets, so you can select and edit every section, heading, paragraph, button, icon, counter and testimonial in the Elementor editor.

## Requirements

- WordPress 6.x
- Elementor **3.16 or newer**, with the **Flexbox Container** and **Grid Container** features active. They are on by default in new installs; otherwise turn them on under *Elementor → Settings → Features*.
- Elementor Pro is optional. Without Pro:
  - The header doesn't stick to the top of the screen.
  - You use a form plugin for the contact form (see below).

## Import

1. In WordPress go to **Templates → Saved Templates → Import Templates**.
2. Choose `w3lly-landing-page.elementor.json` and click **Import Now**.
3. Create a new page (**Pages → Add New**) and click **Edit with Elementor**.
4. Click the folder icon (**Add Template**), open **My Templates** and insert **W3lly — Landing Page**.
5. In **Page Settings**, set the page layout to **Elementor Canvas** so the theme's own header and footer are hidden. Then publish.
6. Optional: make it the homepage under **Settings → Reading → A static page**.

## Page structure

| Section (in the Navigator) | What's inside |
|---|---|
| W3lly — styles & animations | One HTML widget holding the shared CSS and animations. **Keep it at the top of the page.** |
| Header | Logo heading, menu (Icon List), "Start a project" button. Sticky with Elementor Pro. |
| Hero | Label, H1 headline, paragraph, 2 buttons, 3 animated tiles, spinning badge, floating shapes |
| Scrolling services strip | A tilted strip of service names that scrolls sideways (HTML widget: edit the words there) |
| Services | Heading, intro text, 4 service cards (icon, number, title, text) |
| Process | Dark panel with 3 steps (number, icon, title, text) |
| Results | 4 animated Counter widgets and a Testimonial widget |
| Contact | Headline, text, contact details (Icon List), contact form |
| Footer | Logo, social links, copyright |

## Responsive layout

The page adapts to tablet and mobile widths. All of these values can be adjusted in Elementor's tablet and mobile views:

- **Grids:** the services go from 4 columns to 2 on tablet and 1 on mobile. The hero, results and contact go from 2 columns to 1.
- **Headlines, padding and gaps:** each has separate tablet and mobile values.
- **Menu:** the menu links are hidden on tablet and mobile. The logo and the "Start a project" button stay.

## Animations

- **Entrance animations:** sections and widgets fade up as they come into view. Change them under each element's *Advanced → Motion Effects*.
- **Continuous animations:** these are CSS classes set in *Advanced → CSS Classes* on each element:

  | Class | Effect |
  |---|---|
  | `w3-card` | Lifts on hover |
  | `w3-tile` | Tilts on hover |
  | `w3-btn` | Arrow slides on hover |
  | `w3-float` / `w3-float2` | Floating shapes |
  | `w3-spin` | Spinning badge and orbit |
  | `w3-bob` | Bobbing |
  | `w3-dots` / `w3-dots-dark` | Dotted background |
  | `w3-tilt` | Tilted strip |

- **Headline highlight:** the swipe behind "want" and the drawn squiggle under it are `<span class="w3-hl">` and `<span class="w3-sq">` inside the headline text.
- **Reduced motion:** all motion switches off for visitors whose device asks for less motion.

## Things to update

- **Contact form:** the form is an HTML widget and doesn't send anything yet. Replace it with the Elementor Pro **Form** widget, or with a WPForms or Contact Form 7 shortcode.
- **Contact details:** the email (`hello@w3lly.com`) and `[City, Country]` are placeholders.
- **Social links:** in the footer, they point to `#`.
- **Results and testimonial:** the figures and the Maya Okafor testimonial are sample content. Replace them with real results and a real client quote, used with the client's permission, before launch.
- **Accent colour:** it is set on each element, and also in the CSS widget at the top (`#FF6B3D`). To change it everywhere, edit `build_elementor.py` (`ACCENT = …`), run `python3 build_elementor.py` and import the new JSON.

# reachys landing page — WordPress / Elementor export

`reachys-landing-page.elementor.json` is an Elementor page template. It is built from native Elementor containers and widgets, so you can select and edit every section, heading, paragraph, button, icon, counter and testimonial in the Elementor editor.

## Requirements

- WordPress 6.x
- Elementor **3.16 or newer**, with the **Flexbox Container** and **Grid Container** features active. They are on by default in new installs; otherwise turn them on under *Elementor → Settings → Features*.
- Elementor Pro is optional. Without Pro:
  - The header doesn't stick to the top of the screen.
  - You use a form plugin for the contact form (see below).

## Import

1. In WordPress go to **Templates → Saved Templates → Import Templates**.
2. Choose `reachys-landing-page.elementor.json` and click **Import Now**.
3. Create a new page (**Pages → Add New**) and click **Edit with Elementor**.
4. Click the folder icon (**Add Template**), open **My Templates** and insert **reachys — Landing Page**.
5. In **Page Settings**, set the page layout to **Elementor Canvas** so the theme's own header and footer are hidden. Then publish.
6. Optional: make it the homepage under **Settings → Reading → A static page**.

## Page structure

| Section (in the Navigator) | What's inside |
|---|---|
| reachys — styles & animations | One HTML widget holding the shared CSS and animations. **Keep it at the top of the page.** |
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
  | `rx-card` | Lifts on hover |
  | `rx-tile` | Tilts on hover |
  | `rx-btn` | Arrow slides on hover |
  | `rx-float` / `rx-float2` | Floating shapes |
  | `rx-spin` | Spinning badge and orbit |
  | `rx-bob` | Bobbing |
  | `rx-dots` / `rx-dots-dark` | Dotted background |
  | `rx-tilt` | Tilted strip |

- **Headline highlight:** the swipe behind "want" and the drawn squiggle under it are `<span class="rx-hl">` and `<span class="rx-sq">` inside the headline text.
- **Reduced motion:** all motion switches off for visitors whose device asks for less motion.

## Things to update

- **Contact form:** see *Contact form submissions* below.
- **Contact details:** the email (`hello@reachys.com`) and `[City, Country]` are placeholders.
- **Social links:** in the footer, they point to `#`.
- **Results and testimonial:** the figures and the Maya Okafor testimonial are sample content. Replace them with real results and a real client quote, used with the client's permission, before launch.
- **Accent colour:** it is set on each element, and also in the CSS widget at the top (`#FF6B3D`). To change it everywhere, edit `build_elementor.py` (`ACCENT = …`), run `python3 build_elementor.py` and import the new JSON.

## Contact form submissions

The form on the page is connected to a small plugin, **reachys Enquiries**. It saves each message inside WordPress and emails you about it. The form keeps its design.

1. **Plugins → Add New → Upload Plugin**, choose `reachys-enquiries.zip`, then **Install Now** and **Activate**.
2. **Only if you imported the template before this update:** paste in the new form and style code.
   - Edit the page with Elementor and open the **Navigator**.
   - Click the **Contact form** HTML widget (under Contact → Contact panel) and replace its code with the contents of `contact-form-widget.html`.
   - Click the **Global CSS** HTML widget (at the very top) and replace its code with `global-styles-widget.html`.
   - Click **Update**.
3. Send a test message from the live page.

Where messages go:

- **Admin:** each one appears under **Enquiries** in the WordPress admin menu, with name, email, company, service, message and date.
- **Email:** each one is also emailed to the address in **Settings → General → Administration Email Address**. If the emails don't arrive, install **WP Mail SMTP**; many hosts block WordPress's default email sending.

Spam protection: the form has a hidden trap field and allows at most 5 messages per visitor every 10 minutes.

The form sends to the page it's on, so it doesn't depend on `/wp-admin` being reachable. It works with login-hiding or security plugins and with WordPress installed in a subfolder.

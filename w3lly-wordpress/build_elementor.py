import json, secrets, os

INK = "#16140F"
IVORY = "#F4F1EA"
ACCENT = "#FF6B3D"
BODY = "#3D3930"
MUTED = "#5A554B"
LINE = "#DDD7CA"
DISPLAY = "Bricolage Grotesque"
SANS = "Instrument Sans"

_ids = set()
def eid():
    while True:
        i = secrets.token_hex(4)[:7]
        if i not in _ids:
            _ids.add(i)
            return i

def px(v): return {"unit": "px", "size": v, "sizes": []}
def dims(t, r=None, b=None, l=None, unit="px"):
    r = t if r is None else r
    b = t if b is None else b
    l = r if l is None else l
    return {"unit": unit, "top": str(t), "right": str(r), "bottom": str(b), "left": str(l),
            "isLinked": t == r == b == l}
def gap(v): return {"column": str(v), "row": str(v), "isLinked": True, "unit": "px", "size": v}

def typo(prefix, family, size, weight="400", lh=None, ls=None, tablet=None, mobile=None, lh_unit="em"):
    d = {f"{prefix}_typography": "custom", f"{prefix}_font_family": family,
         f"{prefix}_font_size": px(size), f"{prefix}_font_weight": str(weight)}
    if tablet is not None: d[f"{prefix}_font_size_tablet"] = px(tablet)
    if mobile is not None: d[f"{prefix}_font_size_mobile"] = px(mobile)
    if lh is not None: d[f"{prefix}_line_height"] = {"unit": lh_unit, "size": lh, "sizes": []}
    if ls is not None: d[f"{prefix}_letter_spacing"] = px(ls)
    return d

def anim(d, delay=0, name="fadeInUp", widget=True):
    k = "_animation" if widget else "animation"
    d[k] = name
    d[k + "_delay"] = delay
    return d

def widget(wtype, settings):
    return {"id": eid(), "elType": "widget", "widgetType": wtype, "settings": settings, "elements": []}

def container(settings, children, inner=True):
    s = {"content_width": "full", "padding": dims(0)}
    s.update(settings)
    return {"id": eid(), "elType": "container", "settings": s, "elements": children, "isInner": inner}

def grid(cols, cols_t, cols_m, g, extra=None, children=()):
    s = {"container_type": "grid",
         "grid_columns_grid": {"unit": "fr", "size": cols, "sizes": []},
         "grid_columns_grid_tablet": {"unit": "fr", "size": cols_t, "sizes": []},
         "grid_columns_grid_mobile": {"unit": "fr", "size": cols_m, "sizes": []},
         "grid_rows_grid": {"unit": "fr", "size": 1, "sizes": []},
         "grid_auto_flow": "row",
         "grid_gaps": gap(g)}
    if extra: s.update(extra)
    return container(s, list(children))

def col(g, extra=None, children=()):
    s = {"flex_direction": "column", "flex_gap": gap(g)}
    if extra: s.update(extra)
    return container(s, list(children))

def row(g, extra=None, children=()):
    s = {"flex_direction": "row", "flex_gap": gap(g), "flex_align_items": "center", "flex_wrap": "wrap"}
    if extra: s.update(extra)
    return container(s, list(children))

def heading(text, tag="h2", color=INK, family=DISPLAY, size=72, weight="800", lh=1.0, ls=None,
            tablet=None, mobile=None, extra=None):
    s = {"title": text, "header_size": tag, "title_color": color}
    s.update(typo("typography", family, size, weight, lh, ls, tablet, mobile))
    if extra: s.update(extra)
    return widget("heading", s)

def label(text, color=MUTED, extra=None):
    s = {"title": text, "header_size": "div", "title_color": color}
    s.update(typo("typography", SANS, 14, "600", 1.4, 1.5))
    s["typography_text_transform"] = "uppercase"
    if extra: s.update(extra)
    return widget("heading", s)

def text(html, color=BODY, size=18, lh=1.55, tablet=None, mobile=None, extra=None):
    s = {"editor": html, "text_color": color}
    s.update(typo("typography", SANS, size, "400", lh, None, tablet, mobile))
    if extra: s.update(extra)
    return widget("text-editor", s)

ARROW = {"value": "fas fa-arrow-right", "library": "fa-solid"}

def button(label_, url, primary=True, size=17, pad=(20, 32), extra=None, icon=True):
    s = {"text": label_, "link": {"url": url, "is_external": "", "nofollow": ""},
         "border_radius": dims(999), "text_padding": dims(pad[0], pad[1], pad[0], pad[1]),
         "_css_classes": "w3-btn", "hover_animation": ""}
    s.update(typo("typography", SANS, size, "600", 1.2))
    if primary:
        s.update({"background_color": INK, "button_text_color": IVORY,
                  "button_background_hover_color": "#2B2820", "hover_color": IVORY})
    else:
        s.update({"background_color": "rgba(0,0,0,0)", "button_text_color": INK,
                  "button_background_hover_color": INK, "hover_color": IVORY,
                  "border_border": "solid", "border_width": dims(1.5), "border_color": INK})
    if icon:
        s.update({"selected_icon": ARROW, "icon_align": "right", "icon_indent": px(10)})
    if extra: s.update(extra)
    return widget("button", s)

def icon(fa, lib="fa-solid", bg=ACCENT, fg=INK, shape="square", radius=20, size=28, pad=18, extra=None):
    s = {"selected_icon": {"value": fa, "library": lib}, "view": "stacked", "shape": shape,
         "primary_color": bg, "secondary_color": fg, "size": px(size), "icon_padding": px(pad),
         "align": "left", "hover_animation": "rotate"}
    if shape == "square":
        s["border_radius"] = dims(radius)
    if extra: s.update(extra)
    return widget("icon", s)

def html(code, extra=None):
    s = {"html": code}
    if extra: s.update(extra)
    return widget("html", s)

def absolute(h="end", x=0, v="start", y=0, hide_mobile=False, z=None):
    d = {"_position": "absolute", "_offset_orientation_h": h, "_offset_orientation_v": v}
    d["_offset_x_end" if h == "end" else "_offset_x"] = px(x)
    d["_offset_y_end" if v == "end" else "_offset_y"] = px(y)
    if hide_mobile: d["hide_mobile"] = "hidden-mobile"
    if z is not None: d["_z_index"] = z
    return d

def section(settings, children):
    s = {"flex_direction": "column",
         "padding": dims(128, 80, 112, 80), "padding_tablet": dims(88, 40, 80, 40),
         "padding_mobile": dims(72, 20, 64, 20)}
    s.update(settings)
    return container(s, children, inner=False)

# ---------------------------------------------------------------- global CSS
STAR = "M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z"
SQUIGGLE = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 20' "
            "preserveAspectRatio='none'%3E%3Cpath d='M2 12 Q 20 2 38 12 T 74 12 T 110 12 T 146 12 T 198 10' "
            "fill='none' stroke='%2316140F' stroke-width='3.5' stroke-linecap='round'/%3E%3C/svg%3E")

GLOBAL_CSS = f"""<style>
/* W3lly — shared styles & animations. Edit colours here if you change the accent. */
body{{overflow-x:hidden;background:{IVORY}}}
.w3-accent{{color:{ACCENT}}}
@keyframes w3rise{{from{{opacity:0;transform:translateY(28px)}}to{{opacity:1;transform:none}}}}
@keyframes w3float{{0%,100%{{transform:translateY(0) rotate(0)}}50%{{transform:translateY(-18px) rotate(10deg)}}}}
@keyframes w3bob{{0%,100%{{transform:translateY(0)}}50%{{transform:translateY(8px)}}}}
@keyframes w3spin{{to{{transform:rotate(360deg)}}}}
@keyframes w3marquee{{to{{transform:translateX(-50%)}}}}
@keyframes w3draw{{0%{{stroke-dashoffset:320}}55%,100%{{stroke-dashoffset:0}}}}
@keyframes w3swipe{{from{{background-size:0% 100%}}to{{background-size:100% 100%}}}}
@keyframes w3reveal{{from{{clip-path:inset(0 100% 0 0)}}to{{clip-path:inset(0 0 0 0)}}}}
@keyframes w3bars{{0%,100%{{transform:scaleY(.35)}}50%{{transform:scaleY(1)}}}}
@keyframes w3ping{{0%{{transform:scale(1);opacity:.7}}100%{{transform:scale(2.8);opacity:0}}}}
.w3-bob{{display:inline-block;animation:w3bob 5s ease-in-out infinite}}
.w3-ping{{position:relative;display:inline-block;width:10px;height:10px;border-radius:50%;background:{ACCENT};margin-right:12px;vertical-align:middle}}
.w3-ping::after{{content:"";position:absolute;inset:0;border-radius:50%;background:{ACCENT};animation:w3ping 1.8s ease-out infinite}}
.w3-hl{{background-image:linear-gradient({ACCENT},{ACCENT});background-repeat:no-repeat;background-position:0 0;padding:0 .12em;border-radius:12px;animation:w3swipe .9s .7s cubic-bezier(.7,0,.2,1) both;-webkit-box-decoration-break:clone;box-decoration-break:clone}}
.w3-sq{{position:relative;display:inline-block}}
.w3-sq::after{{content:"";position:absolute;left:4%;bottom:-.2em;width:92%;height:.19em;background:url("{SQUIGGLE}") no-repeat center/100% 100%;animation:w3reveal 1s 1.1s ease-out both}}
.w3-dots{{background-image:radial-gradient(#D6CFBF 1.2px,transparent 1.2px) !important;background-size:28px 28px !important}}
.w3-dots-dark{{background-image:radial-gradient(#3A362E 1.2px,transparent 1.2px) !important;background-size:26px 26px !important}}
.w3-float{{animation:w3float 7s ease-in-out infinite}}
.w3-float2{{animation:w3float 9s ease-in-out -3s infinite}}
.w3-spin svg.w3-rot{{animation:w3spin 18s linear infinite}}
.w3-slow svg.w3-rot{{animation-duration:45s}}
.w3-card{{transition:transform .35s cubic-bezier(.2,.7,.2,1),box-shadow .35s}}
.w3-card:hover{{transform:translateY(-8px) rotate(-.6deg);box-shadow:0 24px 48px -24px rgba(22,20,15,.35)}}
.w3-tile{{transition:transform .4s cubic-bezier(.2,.7,.2,1)}}
.w3-tile:hover{{transform:scale(1.02) rotate(-1deg)}}
.w3-btn .elementor-button{{transition:transform .25s,background-color .25s,color .25s}}
.w3-btn .elementor-button:hover{{transform:translateY(-2px)}}
.w3-btn .elementor-button-icon{{transition:transform .25s}}
.w3-btn .elementor-button:hover .elementor-button-icon{{transform:translateX(5px)}}
.w3-nav .elementor-icon-list-text{{position:relative}}
.w3-nav .elementor-icon-list-text::after{{content:"";position:absolute;left:0;right:0;bottom:-6px;height:2px;background:{ACCENT};transform:scaleX(0);transform-origin:left;transition:transform .3s}}
.w3-nav .elementor-icon-list-item:hover .elementor-icon-list-text::after{{transform:scaleX(1)}}
.w3-tilt{{transform:rotate(-1.2deg);width:calc(100% + 40px) !important;max-width:none !important;margin-left:-20px !important;z-index:2}}
.w3-marquee{{overflow:hidden;padding:26px 0}}
.w3-marquee .w3-track{{display:flex;width:max-content;animation:w3marquee 28s linear infinite}}
.w3-marquee:hover .w3-track{{animation-play-state:paused}}
.w3-marquee .w3-group{{display:flex;align-items:center;gap:36px;padding-right:36px;font-family:'{DISPLAY}',serif;font-weight:600;font-size:clamp(22px,2.4vw,32px);letter-spacing:-.5px;white-space:nowrap;color:{IVORY}}}
.w3-draw{{stroke-dasharray:320;animation:w3draw 4s ease-in-out infinite}}
.w3-bars{{display:flex;align-items:flex-end;gap:8px;height:64px}}
.w3-bars span{{width:14px;height:100%;border-radius:6px;background:{INK};transform-origin:bottom;animation:w3bars 1.8s ease-in-out infinite}}
.w3-bars span:nth-child(even){{background:{ACCENT}}}
.w3-bars span:nth-child(2){{animation-delay:-.3s}}.w3-bars span:nth-child(3){{animation-delay:-.6s}}.w3-bars span:nth-child(4){{animation-delay:-.9s}}.w3-bars span:nth-child(5){{animation-delay:-1.2s}}
.w3-badge{{position:relative;width:148px;height:148px;border-radius:50%;background:{IVORY};border:1.5px solid {INK};display:flex;align-items:center;justify-content:center}}
.w3-badge svg.w3-rot{{position:absolute;inset:6px;width:calc(100% - 12px);height:calc(100% - 12px)}}
.w3-form{{display:flex;flex-direction:column;gap:20px;font-family:'{SANS}',sans-serif}}
.w3-form .w3-two{{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}}
.w3-form label{{display:block;font-size:14px;font-weight:600;margin-bottom:8px;color:{INK}}}
.w3-form input,.w3-form select,.w3-form textarea{{width:100%;box-sizing:border-box;padding:14px 16px;min-height:52px;border:1.5px solid #CFC8B8;border-radius:12px;font:inherit;font-size:16px;background:#F9F7F2;color:{INK};transition:border-color .2s,box-shadow .2s}}
.w3-form input:focus,.w3-form select:focus,.w3-form textarea:focus{{outline:none;border-color:{INK};box-shadow:0 0 0 4px rgba(22,20,15,.08)}}
.w3-form button{{height:60px;border:0;border-radius:999px;background:{INK};color:{IVORY};font:inherit;font-size:17px;font-weight:600;cursor:pointer;transition:transform .25s}}
.w3-form button:hover{{transform:translateY(-2px)}}
@media (max-width:1024px){{.w3-hide-tablet-deco{{display:none}}}}
@media (max-width:767px){{
.w3-form .w3-two{{grid-template-columns:1fr}}
.w3-badge{{width:112px;height:112px}}
}}
@media (prefers-reduced-motion: reduce){{
*,*::before,*::after{{animation:none !important;transition:none !important}}
.w3-hl{{background-size:100% 100%}}
}}
</style>"""

# ---------------------------------------------------------------- sections
content = []

# Global styles holder
content.append(container({"flex_direction": "column", "padding": dims(0), "min_height": px(0),
                          "_title": "W3lly — styles & animations (keep this)"},
                         [html(GLOBAL_CSS, {"_title": "Global CSS"})], inner=False))

# HEADER --------------------------------------------------------------------
logo = heading('W<span class="w3-accent w3-bob">3</span>lly', tag="div", size=34, weight="800", lh=1.0, ls=-1,
               mobile=28, extra={"link": {"url": "#top", "is_external": "", "nofollow": ""}})
nav_items = [{"_id": eid(), "text": t, "selected_icon": {"value": "", "library": ""},
              "link": {"url": u, "is_external": "", "nofollow": ""}}
             for t, u in [("Services", "#services"), ("Process", "#process"), ("Results", "#results"), ("Contact", "#contact")]]
nav = widget("icon-list", {"view": "inline", "icon_list": nav_items, "space_between": px(40),
                           "text_color": INK, "text_color_hover": INK, "_css_classes": "w3-nav",
                           "hide_mobile": "hidden-mobile", "hide_tablet": "hidden-tablet",
                           **typo("icon_typography", SANS, 16, "500", 1.4)})
header = container({
    "_title": "Header", "flex_direction": "row", "flex_justify_content": "space-between",
    "flex_align_items": "center", "flex_gap": gap(24), "flex_wrap": "nowrap",
    "padding": dims(22, 80), "padding_tablet": dims(20, 40), "padding_mobile": dims(16, 20),
    "background_background": "classic", "background_color": "rgba(244,241,234,0.9)",
    "border_border": "solid", "border_width": {"unit": "px", "top": "0", "right": "0", "bottom": "1", "left": "0", "isLinked": False},
    "border_color": LINE, "z_index": 20,
    "sticky": "top", "sticky_on": ["desktop", "tablet", "mobile"],  # Elementor Pro; ignored on free
}, [logo, nav, button("Start a project", "#contact", size=15, pad=(14, 24),
                      extra={"typography_font_size_mobile": px(14), "text_padding_mobile": dims(12, 18)})],
    inner=False)
content.append(header)

# HERO ----------------------------------------------------------------------
hero_left = col(32, {"_title": "Hero copy"}, [
    anim(label('<span class="w3-ping"></span>Full-service marketing studio'), 100),
    anim(heading('Marketing people actually <span class="w3-sq"><span class="w3-hl">want</span></span> to see.',
                 tag="h1", size=104, weight="800", lh=0.95, ls=-3.5, tablet=80, mobile=52), 200),
    anim(text("<p>W3lly builds brands, content and campaigns that earn attention instead of renting it — then measures every bit of it.</p>",
              size=21, lh=1.5, mobile=18, extra={"_element_width": "initial", "_element_custom_width": px(520),
                                                   "_element_custom_width_mobile": {"unit": "%", "size": 100, "sizes": []}}), 320),
    row(16, {"_title": "Hero buttons", "flex_direction_mobile": "column", "flex_align_items_mobile": "stretch"}, [
        anim(button("Book a strategy call", "#contact", extra={"align_mobile": "justify"}), 460),
        anim(button("See what we do", "#services", primary=False, icon=False, pad=(20, 28), extra={"align_mobile": "justify"}), 540),
    ]),
])

badge = html(f"""<div class="w3-badge" aria-hidden="true">
<svg class="w3-rot" viewBox="0 0 100 100"><defs><path id="w3circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0"/></defs>
<text font-family="{DISPLAY}, serif" font-weight="800" font-size="10.4" letter-spacing="2.2" fill="{INK}"><textPath href="#w3circ">MARKETING THAT MOVES • W3LLY • </textPath></text></svg>
<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="{INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
</div>""", {"_title": "Spinning badge", "_css_classes": "w3-spin",
            **absolute("end", -28, "start", -56, z=3),
            "_offset_x_end_mobile": px(-6), "_offset_y_mobile": px(-40)})

burst = html(f"""<svg class="w3-rot" viewBox="0 0 200 200" width="260" height="260" aria-hidden="true" style="opacity:.22"><path d="M100 0 L112 76 L185 45 L126 100 L185 155 L112 124 L100 200 L88 124 L15 155 L74 100 L15 45 L88 76 Z" fill="{INK}"/></svg>""",
             {"_title": "Starburst", "_css_classes": "w3-spin w3-slow", **absolute("end", -70, "end", -70)})
_ = burst["settings"].pop("_offset_y", None)
burst["settings"]["_offset_y_end"] = px(-70)

tile_big = container({
    "_title": "Tile — Get noticed", "flex_direction": "column", "flex_justify_content": "space-between",
    "width": {"unit": "%", "size": 50, "sizes": []}, "width_mobile": {"unit": "%", "size": 100, "sizes": []},
    "min_height_mobile": px(280),
    "padding": dims(32), "background_background": "classic", "background_color": ACCENT,
    "border_radius": dims(28), "overflow": "hidden", "css_classes": "w3-tile",
}, [
    burst,
    icon("far fa-paper-plane", "fa-regular", bg="rgba(0,0,0,0)", fg=INK, size=48, pad=0,
         extra={"_css_classes": "w3-bob", "hover_animation": ""}),
    heading("Get<br>noticed.", tag="div", size=66, weight="800", lh=0.95, ls=-2, tablet=60, mobile=52),
])

tile_pulse = container({
    "_title": "Tile — Campaign pulse", "flex_direction": "column", "flex_justify_content": "space-between",
    "flex_gap": gap(16), "_flex_size": "grow", "min_height": px(272), "min_height_mobile": px(220),
    "padding": dims(28), "background_background": "classic", "background_color": INK,
    "border_radius": dims(28), "css_classes": "w3-tile",
}, [
    label('Campaign pulse <span class="w3-ping" style="margin:0 0 0 10px;width:8px;height:8px"></span>', color="#B8B1A2"),
    html(f"""<svg width="100%" height="90" viewBox="0 0 200 90" fill="none" preserveAspectRatio="none" aria-hidden="true"><path class="w3-draw" d="M0 80 L30 70 L60 74 L90 50 L120 56 L150 28 L200 10" stroke="{ACCENT}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>""",
         {"_title": "Animated sparkline"}),
    heading("Always trending up", tag="div", color=IVORY, size=22, weight="600", lh=1.2),
])

tile_team = container({
    "_title": "Tile — One team", "flex_direction": "column", "flex_justify_content": "space-between",
    "flex_gap": gap(16), "_flex_size": "grow", "min_height": px(272), "min_height_mobile": px(220),
    "padding": dims(28), "background_background": "classic", "background_color": "#FFFFFF",
    "border_border": "solid", "border_width": dims(1), "border_color": LINE,
    "border_radius": dims(28), "css_classes": "w3-tile",
}, [
    html('<div class="w3-bars" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>',
         {"_title": "Animated bars"}),
    heading("One team.<br>Every channel.", tag="div", size=22, weight="600", lh=1.2),
])

tiles = container({
    "_title": "Hero tiles", "flex_direction": "row", "flex_direction_mobile": "column",
    "flex_gap": gap(16), "flex_wrap": "nowrap", "flex_align_items": "stretch",
    "min_height": px(560), "min_height_mobile": px(0),
}, [
    badge, tile_big,
    col(16, {"_title": "Tile column", "width": {"unit": "%", "size": 50, "sizes": []},
             "width_mobile": {"unit": "%", "size": 100, "sizes": []}, "flex_direction_mobile": "row",
             "flex_wrap_mobile": "nowrap"}, [tile_pulse, tile_team]),
])
anim(tiles["settings"], 600, widget=False)

hero_decor_star = html(f'<svg width="64" height="64" viewBox="0 0 24 24" aria-hidden="true"><path d="{STAR}" fill="{INK}"/></svg>',
                       {"_title": "Floating star", "_css_classes": "w3-float",
                        **absolute("start", 0, "start", 56, hide_mobile=True),
                        "_offset_x": {"unit": "%", "size": 44, "sizes": []}})
hero_decor_ring = html(f'<svg width="90" height="90" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="{INK}" stroke-width="3" stroke-dasharray="6 10"/></svg>',
                       {"_title": "Floating ring", "_css_classes": "w3-float2",
                        **absolute("start", 0, "end", 40, hide_mobile=True), "hide_tablet": "hidden-tablet",
                        "_offset_x": {"unit": "%", "size": 38, "sizes": []}})

hero = container({
    "_title": "Hero", "_element_id": "top", "css_classes": "w3-dots",
    "container_type": "grid",
    "grid_columns_grid": {"unit": "fr", "size": 2, "sizes": []},
    "grid_columns_grid_tablet": {"unit": "fr", "size": 1, "sizes": []},
    "grid_columns_grid_mobile": {"unit": "fr", "size": 1, "sizes": []},
    "grid_rows_grid": {"unit": "fr", "size": 1, "sizes": []}, "grid_auto_flow": "row",
    "grid_gaps": {"column": "64", "row": "56", "isLinked": False, "unit": "px"},
    "grid_align_items": "center",
    "padding": dims(88, 80, 104, 80), "padding_tablet": dims(72, 40, 88, 40), "padding_mobile": dims(56, 20, 72, 20),
}, [hero_decor_star, hero_decor_ring, hero_left, tiles], inner=False)
content.append(hero)

# MARQUEE -------------------------------------------------------------------
words = ["Strategy", "Branding", "Content", "Paid social", "SEO", "Analytics"]
star_svg = f'<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="{STAR}" fill="{ACCENT}"/></svg>'
group = "".join(f"<span>{w}</span>{star_svg}" for w in words)
marquee_html = (f'<div class="w3-marquee"><div class="w3-track">'
                f'<div class="w3-group">{group}</div><div class="w3-group" aria-hidden="true">{group}</div>'
                f'</div></div>')
content.append(container({"_title": "Scrolling services strip", "css_classes": "w3-tilt",
                          "background_background": "classic", "background_color": INK, "padding": dims(0)},
                         [html(marquee_html, {"_title": "Marquee (edit words here)"})], inner=False))

# SERVICES ------------------------------------------------------------------
services = [
    ("01", "fas fa-bullseye", ACCENT, INK, "square", "Strategy",
     "Market research, positioning and a go-to-market plan built around the customers you actually want."),
    ("02", "fas fa-star", INK, IVORY, "circle", "Brand &amp; identity",
     "Names, logos, voice and visual systems that make you instantly recognisable across every touchpoint."),
    ("03", "fas fa-play", ACCENT, INK, "square", "Content &amp; social",
     "Scroll-stopping video, photography and copy, plus the community management to keep conversations going."),
    ("04", "fas fa-chart-bar", INK, IVORY, "square", "Performance &amp; SEO",
     "Paid search, paid social and organic growth — optimised weekly against the numbers that matter to you."),
]
cards = []
for i, (num, fa, bg, fg, shape, title, body) in enumerate(services):
    card = container({
        "_title": f"Service card — {title.replace('&amp;', '&')}", "flex_direction": "column", "flex_gap": gap(20),
        "padding": dims(32), "min_height": px(340), "min_height_mobile": px(0),
        "background_background": "classic", "background_color": "#FFFFFF",
        "border_border": "solid", "border_width": dims(1), "border_color": LINE, "border_radius": dims(24),
        "css_classes": "w3-card",
    }, [
        row(12, {"flex_justify_content": "space-between", "flex_wrap": "nowrap"}, [
            icon(fa, bg=bg, fg=fg, shape=shape),
            heading(num, tag="div", color="#8A8374", size=20, weight="800", lh=1),
        ]),
        heading(title, tag="h3", size=28, weight="600", lh=1.15, ls=-0.5),
        text(f"<p>{body}</p>", size=16),
    ])
    anim(card["settings"], 100 * i, widget=False)
    cards.append(card)

content.append(section({"_title": "Services", "_element_id": "services", "flex_gap": gap(64),
                        "flex_gap_mobile": gap(40)}, [
    row(48, {"_title": "Services intro", "flex_justify_content": "space-between", "flex_align_items": "flex-end",
             "flex_wrap": "nowrap", "flex_direction_tablet": "column", "flex_align_items_tablet": "flex-start",
             "flex_gap_tablet": gap(20)}, [
        anim(heading("Everything your brand needs to grow — under one roof.", size=72, lh=1.0, ls=-2.5,
                     tablet=56, mobile=40, extra={"_element_width": "initial", "_element_custom_width": px(760),
                                                  "_element_custom_width_tablet": {"unit": "%", "size": 100, "sizes": []}})),
        anim(text("<p>Pick one service or the full stack. Either way you get senior people, clear reporting and zero fluff.</p>",
                  extra={"_element_width": "initial", "_element_custom_width": px(380),
                         "_element_custom_width_tablet": {"unit": "%", "size": 100, "sizes": []}}), 150),
    ]),
    grid(4, 2, 1, 20, {"_title": "Service cards"}, cards),
]))

# PROCESS -------------------------------------------------------------------
steps = [
    ("1", "fas fa-headphones", "Listen", "A deep-dive workshop on your business, audience and goals. We leave with a shared definition of success.", "w3-float"),
    ("2", "fas fa-rocket", "Launch", "We build the plan, make the work and go live fast — testing ideas in-market instead of in meeting rooms.", "w3-float2"),
    ("3", "fas fa-chart-line", "Level up", "Live dashboards and monthly reviews. What works gets more budget; what doesn't gets cut.", "w3-float"),
]
step_boxes = []
for i, (n, fa, title, body, fcls) in enumerate(steps):
    box = col(18, {"_title": f"Step {n} — {title}", "padding": {"unit": "px", "top": "28", "right": "0", "bottom": "0", "left": "0", "isLinked": False},
                   "border_border": "solid",
                   "border_width": {"unit": "px", "top": "2", "right": "0", "bottom": "0", "left": "0", "isLinked": False},
                   "border_color": ACCENT}, [
        row(12, {"flex_justify_content": "space-between", "flex_wrap": "nowrap"}, [
            heading(n, tag="div", color=ACCENT, size=56, weight="800", lh=1),
            icon(fa, bg="rgba(0,0,0,0)", fg=IVORY, size=34, pad=0, extra={"_css_classes": fcls, "hover_animation": ""}),
        ]),
        heading(title, tag="h3", color=IVORY, size=30, weight="600", lh=1.15),
        text(f"<p>{body}</p>", color="#D8D2C4", size=17, lh=1.6),
    ])
    anim(box["settings"], 150 * i, widget=False)
    step_boxes.append(box)

orbit = html(f"""<svg class="w3-rot" viewBox="0 0 200 200" width="320" height="320" aria-hidden="true"><circle cx="100" cy="100" r="92" fill="none" stroke="{ACCENT}" stroke-width="2" stroke-dasharray="4 12"/><circle cx="100" cy="100" r="62" fill="none" stroke="{IVORY}" stroke-opacity=".25" stroke-width="2"/><circle cx="100" cy="8" r="8" fill="{ACCENT}"/></svg>""",
             {"_title": "Orbit decoration", "_css_classes": "w3-spin w3-slow", **absolute("end", -90, "start", -90, hide_mobile=True)})

process_panel = container({
    "_title": "Process panel", "flex_direction": "column", "flex_gap": gap(64), "flex_gap_mobile": gap(40),
    "padding": dims(96, 80), "padding_tablet": dims(72, 48), "padding_mobile": dims(56, 24),
    "background_background": "classic", "background_color": INK, "border_radius": dims(36),
    "border_radius_mobile": dims(28), "overflow": "hidden", "css_classes": "w3-dots-dark",
}, [
    orbit,
    col(16, None, [
        label("How we work", color="#B8B1A2"),
        heading("Three steps. No black boxes.", color=IVORY, size=72, lh=1.0, ls=-2.5, tablet=56, mobile=40),
    ]),
    grid(3, 3, 1, 48, {"_title": "Steps", "grid_columns_grid_tablet": {"unit": "fr", "size": 1, "sizes": []},
                       "grid_gaps_mobile": gap(36)}, step_boxes),
])
anim(process_panel["settings"], 0, widget=False)
content.append(container({"_title": "Process", "_element_id": "process", "flex_direction": "column",
                          "padding": dims(0, 80), "padding_tablet": dims(0, 40), "padding_mobile": dims(0, 12)},
                         [process_panel], inner=False))

# RESULTS -------------------------------------------------------------------
stats = [(38, "%", "Average lift in qualified leads"), (4.2, "x", "Average return on ad spend"),
         (60, "+", "Brands launched and grown"), (92, "%", "Client retention rate")]
stat_cards = []
for end, suffix, title in stats:
    counter = widget("counter", {
        "starting_number": 0, "ending_number": end, "suffix": suffix, "duration": 2000,
        "thousand_separator": "", "title": title, "number_color": INK, "title_color": BODY,
        **typo("typography_number", DISPLAY, 52, "800", 1.0, -1.5, tablet=48, mobile=36),
        **typo("typography_title", SANS, 15, "400", 1.4),
        "number_alignment": "start", "title_horizontal_alignment": "start",
    })
    stat_cards.append(container({
        "_title": f"Stat — {title}", "flex_direction": "column", "padding": dims(28), "padding_mobile": dims(20),
        "flex_align_items": "flex-start",
        "background_background": "classic", "background_color": "#FFFFFF",
        "border_border": "solid", "border_width": dims(1), "border_color": LINE, "border_radius": dims(20),
        "css_classes": "w3-card",
    }, [counter]))

testimonial = widget("testimonial", {
    "testimonial_content": "“W3lly rebuilt our paid social from scratch. Within six months our cost per lead dropped by a third — and for the first time, our reports actually made sense.”",
    "testimonial_name": "Maya Okafor", "testimonial_job": "Marketing Director, Lumen &amp; Fern",
    "testimonial_image": {"url": "", "id": ""}, "testimonial_image_position": "aside",
    "testimonial_alignment": "left",
    "content_content_color": INK, "name_text_color": INK, "job_text_color": INK,
    **typo("content_typography", DISPLAY, 38, "600", 1.2, -0.8, tablet=32, mobile=26),
    **typo("name_typography", SANS, 17, "600", 1.4),
    **typo("job_typography", SANS, 15, "400", 1.4),
    "_margin": {"unit": "px", "top": "0", "right": "0", "bottom": "0", "left": "0", "isLinked": True},
})
quote_card = container({
    "_title": "Testimonial card", "flex_direction": "column", "flex_gap": gap(40),
    "padding": dims(56), "padding_tablet": dims(48), "padding_mobile": dims(32),
    "background_background": "classic", "background_color": ACCENT, "border_radius": dims(32),
    "overflow": "hidden",
}, [
    html(f'<svg width="180" height="180" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="{INK}" stroke-opacity=".18" stroke-width="10"/></svg>',
         {"_title": "Floating ring", "_css_classes": "w3-float2", **absolute("end", -30, "start", -30)}),
    icon("fas fa-quote-left", bg="rgba(0,0,0,0)", fg=INK, size=48, pad=0, extra={"hover_animation": ""}),
    testimonial,
])
anim(quote_card["settings"], 200, widget=False)

results_left = col(32, {"_title": "Results copy & stats"}, [
    label("Results"),
    heading("Proof over promises.", size=72, lh=1.0, ls=-2.5, tablet=56, mobile=40),
    grid(2, 2, 2, 16, {"_title": "Stats", "grid_gaps_mobile": gap(12)}, stat_cards),
])
anim(results_left["settings"], 0, widget=False)
content.append(section({"_title": "Results", "_element_id": "results",
                        "container_type": "grid",
                        "grid_columns_grid": {"unit": "fr", "size": 2, "sizes": []},
                        "grid_columns_grid_tablet": {"unit": "fr", "size": 1, "sizes": []},
                        "grid_columns_grid_mobile": {"unit": "fr", "size": 1, "sizes": []},
                        "grid_rows_grid": {"unit": "fr", "size": 1, "sizes": []}, "grid_auto_flow": "row",
                        "grid_gaps": gap(64), "grid_gaps_tablet": gap(48), "grid_align_items": "start"},
                       [results_left, quote_card]))

# CONTACT -------------------------------------------------------------------
FORM_HTML = """<!-- Replace this form with your form plugin (Elementor Pro Form, WPForms, Contact Form 7…) or set action="" to your endpoint. -->
<form class="w3-form" action="#" method="post" aria-label="Project enquiry">
<div class="w3-two">
<div><label for="w3-name">Name</label><input id="w3-name" name="name" type="text" placeholder="Your name" required></div>
<div><label for="w3-email">Email</label><input id="w3-email" name="email" type="email" placeholder="you@company.com" required></div>
</div>
<div><label for="w3-company">Company</label><input id="w3-company" name="company" type="text" placeholder="Company name"></div>
<div><label for="w3-service">What do you need?</label><select id="w3-service" name="service">
<option>Full-service marketing</option><option>Strategy</option><option>Brand &amp; identity</option><option>Content &amp; social</option><option>Performance &amp; SEO</option>
</select></div>
<div><label for="w3-msg">Tell us about your project</label><textarea id="w3-msg" name="message" rows="5" placeholder="Goals, timeline, budget range…"></textarea></div>
<button type="submit">Send enquiry →</button>
</form>"""

contact_items = [
    {"_id": eid(), "text": "hello@w3lly.com", "selected_icon": {"value": "far fa-envelope", "library": "fa-regular"},
     "link": {"url": "mailto:hello@w3lly.com", "is_external": "", "nofollow": ""}},
    {"_id": eid(), "text": "[City, Country]", "selected_icon": {"value": "fas fa-map-marker-alt", "library": "fa-solid"},
     "link": {"url": "", "is_external": "", "nofollow": ""}},
]
contact_panel = container({
    "_title": "Contact panel", "container_type": "grid",
    "grid_columns_grid": {"unit": "fr", "size": 2, "sizes": []},
    "grid_columns_grid_tablet": {"unit": "fr", "size": 1, "sizes": []},
    "grid_columns_grid_mobile": {"unit": "fr", "size": 1, "sizes": []},
    "grid_rows_grid": {"unit": "fr", "size": 1, "sizes": []}, "grid_auto_flow": "row",
    "grid_gaps": gap(80), "grid_gaps_tablet": gap(48),
    "padding": dims(88, 80), "padding_tablet": dims(72, 48), "padding_mobile": dims(56, 24),
    "background_background": "classic", "background_color": "#FFFFFF",
    "border_border": "solid", "border_width": dims(1), "border_color": LINE,
    "border_radius": dims(36), "border_radius_mobile": dims(28), "overflow": "hidden",
}, [
    html(f'<svg width="80" height="80" viewBox="0 0 24 24" aria-hidden="true"><path d="{STAR}" fill="{ACCENT}"/></svg>',
         {"_title": "Floating star", "_css_classes": "w3-float", **absolute("start", 0, "end", 48, hide_mobile=True),
          "hide_tablet": "hidden-tablet", "_offset_x": {"unit": "%", "size": 44, "sizes": []}}),
    col(28, {"_title": "Contact copy"}, [
        heading('Let\'s make you <span class="w3-hl">impossible</span> to ignore.', size=80, lh=0.95, ls=-3,
                tablet=64, mobile=44),
        text("<p>Tell us a little about what you're working on. We'll reply within one business day with next steps — no hard sell.</p>",
             size=19),
        widget("icon-list", {"view": "traditional", "icon_list": contact_items, "space_between": px(14),
                             "icon_color": INK, "text_color": INK, "icon_size": px(20), "text_indent": px(12),
                             **typo("icon_typography", SANS, 17, "500", 1.4)}),
    ]),
    html(FORM_HTML, {"_title": "Contact form (replace with your form plugin)"}),
])
anim(contact_panel["settings"], 0, widget=False)
content.append(container({"_title": "Contact", "_element_id": "contact", "flex_direction": "column",
                          "padding": dims(0, 80), "padding_tablet": dims(0, 40), "padding_mobile": dims(0, 12)},
                         [contact_panel], inner=False))

# FOOTER --------------------------------------------------------------------
social = [{"_id": eid(), "text": t, "selected_icon": {"value": "", "library": ""},
           "link": {"url": "#", "is_external": "on", "nofollow": ""}} for t in ["Instagram", "LinkedIn", "TikTok"]]
content.append(container({
    "_title": "Footer", "flex_direction": "row", "flex_direction_mobile": "column",
    "flex_justify_content": "space-between", "flex_align_items": "center", "flex_align_items_mobile": "flex-start",
    "flex_gap": gap(24), "flex_wrap": "nowrap",
    "margin": {"unit": "px", "top": "96", "right": "0", "bottom": "0", "left": "0", "isLinked": False},
    "padding": dims(48, 80), "padding_tablet": dims(48, 40), "padding_mobile": dims(40, 20),
    "border_border": "solid", "border_width": {"unit": "px", "top": "1", "right": "0", "bottom": "0", "left": "0", "isLinked": False},
    "border_color": LINE,
}, [
    heading('W<span class="w3-accent">3</span>lly', tag="div", size=28, weight="800", lh=1, ls=-1),
    widget("icon-list", {"view": "inline", "icon_list": social, "space_between": px(32), "text_color": INK,
                         "_css_classes": "w3-nav", **typo("icon_typography", SANS, 15, "500", 1.4)}),
    heading("© 2026 W3lly. All rights reserved.", tag="p", color=MUTED, family=SANS, size=14, weight="400", lh=1.4),
], inner=False))

template = {
    "version": "0.4",
    "title": "W3lly — Landing Page",
    "type": "page",
    "page_settings": {
        "template": "elementor_canvas",
        "hide_title": "yes",
        "background_background": "classic",
        "background_color": IVORY,
    },
    "content": content,
}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "w3lly-landing-page.elementor.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    json.dump(template, f, ensure_ascii=False, indent=1)

def count(els):
    n = 0
    for e in els:
        n += 1 + count(e.get("elements", []))
    return n
print("elements:", count(content), "ids unique:", len(_ids))

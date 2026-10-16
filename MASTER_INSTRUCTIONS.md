# GeoX Umbrella Pages — Master Instructions & Driftguide

Denna katalog (`/home/jupiter/Dokument/Projekt/GeoXUmbrellaPages`) är den **officiella mastern** för **GeoX-paraplyet** (`https://geox.dev`).

---

## 1. Repositorium & Identitet

* **Mapp:** `/home/jupiter/Dokument/Projekt/GeoXUmbrellaPages`
* **Officiell domän:** `https://geox.dev` (GitHub Pages)
* **Mars-applikation:** `https://mars.geox.dev` (Cloudflare Pages)
* **Git Remote:** `git@github.com:Exomoon/geox_pages.git`
* **Huvudgren:** `main`
* **Lokal utvecklingsport:** `8088` (`http://localhost:8088`)

---

## 2. Vad denna master hanterar

Denna master är portalen och landningssidan för hela GeoX-ekosystemet:

1. **Startsida & Språk:**
   * `index.html` — Internationell engelsk startsida.
   * `sv.html` — Svenskspråkig startsida.
   * `CNAME` — `geox.dev` (styr domänpeket för produktion).
2. **Produktkatalog & Datamodell:**
   * `products.js` — Den centrala datakällan som definierar alla appar i ekosystemet (Mars Explorer, KrisGIS, PalaeoCoast, Sentinel Lab, Valatlas, Områdesatlas, Restidsanalys, UtterIDE).
3. **Specifika Presentationssidor:**
   * `mars.html` — Fördjupad presentationssida och galleri för **GeoX Mars Explorer**.
   * `gis-etl-workflow.html` — Dokumentation av geospatial databehandling och pipelines.
4. **Resurser:**
   * `assets/` — Skärmdumpar, produktförhandsvisningar och ikoner.
   * `style.css` & `main.js` — Portalens designsystem och interaktiva produktfilter.
   * `sitemap.xml` & `robots.txt` — SEO och indexering.

---

## 3. Ekosystemets Mappstruktur

```
/home/jupiter/Dokument/Projekt/
│
├── GeoXUmbrellaPages/             <-- MASTER FÖR PARAPLYET (geox.dev)
│   ├── Git: Exomoon/geox_pages
│   ├── Port: 8088
│   └── Roll: Portal, landningssida och produktnav
│
├── mars explore/                  <-- MARS EXPLORER (3D WebGL / GIS Lab)
│   ├── Git: Exomoon/marsexplorer
│   ├── Port: 5173
│   └── Roll: Fristående 3D-applikation (Three.js, React, HiRISE)
│
└── [Övriga Raster Lab & Appar]/   <-- PalaeoCoast, Sentinel Lab, KrisGIS
```

---

## 4. Utvecklingsflöde & Kommandon

### Starta lokal utvecklingsserver:
Portalen körs via en lokal HTTP-server:
```bash
python3 -m http.server 8088 --directory /home/jupiter/Dokument/Projekt/GeoXUmbrellaPages
```
Öppna i webbläsaren: `http://localhost:8088`

### Göra ändringar & Driftsätta till `geox.dev`:
När du uppdaterar texter, lägger till en ny produkt i `products.js` eller uppdaterar skärmdumpar i `assets/`:
```bash
cd /home/jupiter/Dokument/Projekt/GeoXUmbrellaPages
git status
git add index.html sv.html mars.html products.js main.js style.css sitemap.xml assets/
git commit -m "feat(portal): uppdatera produktinformation eller länkar"
git push origin main
```
När du pushar till `origin main` uppdateras `https://geox.dev` via GitHub Pages. Mars Explorer deployas separat från `Exomoon/marsexplorer` till Cloudflare Pages och nås via `https://mars.geox.dev`.

---

## 5. Riktlinjer & Säkerhetsregler

1. **Rör inte `CNAME`:** Filen `CNAME` ska alltid innehålla exakt `geox.dev`.
2. **Håll sub-appar modulära:** Sub-applikationer (som Mars Explorer) utvecklas och versionshanteras i sina egna repon och har egna deployments. Paraplyet länkar till dem.
3. **Skärmdumpar och previews:** När Mars Explorer får nya stora funktioner (t.ex. 3D-panoraman, nya HiRISE-platser) uppdateras bilderna i `assets/` här i paraplyet så att startsidan alltid är aktuell och representativ.

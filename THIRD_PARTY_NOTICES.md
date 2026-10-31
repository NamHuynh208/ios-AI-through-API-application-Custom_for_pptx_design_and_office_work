# Third-party notices

Agenty Mobile uses these open-source packages. Exact installed versions and transitive dependencies are recorded in `package-lock.json`; retain upstream license notices when redistributing.

| Package | Purpose | License |
|---|---|---|
| fflate | ZIP read/write for Office Open XML | MIT |
| @xmldom/xmldom | XML parser/serializer (DTD/entity rejected by app) | MIT |
| pdfjs-dist (Mozilla PDF.js) | PDF text extraction in worker | Apache-2.0 |
| pdf-lib | PDF page operations and creation | MIT |
| @pdf-lib/fontkit | Embed Unicode fonts | MIT |
| pptxgenjs | Create simple editable PPTX slides | MIT |
| image-size (override 2.0.4) | Transitive PptxGenJS dependency, patched advisory range | MIT |
| Vite | Development/build tooling | MIT |
| Playwright | Automated Chromium/WebKit testing | Apache-2.0 |
| Roboto font | Vietnamese PDF text | Apache-2.0; full notice in public/fonts/LICENSE.txt |

Roboto Regular is downloaded from https://github.com/googlefonts/roboto-2/tree/main/src/hinted . It is embedded in generated PDFs as a subset. Icons and app artwork in `public/icon.svg` / app SVG paths are locally authored geometric assets, not screenshots or third-party logos.

No application API credential is bundled. No desktop application's proprietary binaries or skills are copied into the runtime.

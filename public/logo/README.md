# Official Logo

Place the official municipal seal here as:

    public/logo/alaminos-seal.png

Vite serves everything under `public/` from the site root, so the file is then
referenced at:

    /logo/alaminos-seal.png

## How it is used

The brand mark reads the logo path from configuration
(**Settings → General → Municipality Logo**, key `municipality_logo`).

- Leave the setting blank → the built-in mark (Building2 icon) is shown.
- Set it to `/logo/alaminos-seal.png` → the official seal is shown in the
  sidebar brand block.

The image is rendered with `object-contain` at its natural aspect ratio — it is
never stretched, cropped, recolored, or given effects.

> The binary image cannot be committed automatically from the design hand-off;
> drop the provided file at the path above, then set the config value.

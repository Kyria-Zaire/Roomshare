/**
 * Configuration de la carte (MapLibre GL).
 * Par défaut : Carto Positron (gratuit, sans clé).
 * Optionnel dans .env : NEXT_PUBLIC_MAP_STYLE_URL, NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
 */
const DEFAULT_MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || DEFAULT_MAP_STYLE;

export const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

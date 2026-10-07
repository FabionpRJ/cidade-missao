// Estilo JSON do pacote A (seção 3), para mapa raster sem mapId. Complemento aplicado a partir do zoom 14.
type Estilo = google.maps.MapTypeStyle[];

export const ESTILO_BASE: Estilo = [
  { elementType: 'geometry', stylers: [{ color: '#111916' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#BFB9A4' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B1210' }, { weight: 3 }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#7F7A69' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#15241C' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#111916' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#111916' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#3A4A40' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#3A3A2E' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#3A3A2E' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0B1210' }] },
  { featureType: 'road.highway', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B1A24' }] },
  { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export const ESTILO_PERTO: Estilo = [
  { featureType: 'road.arterial', elementType: 'labels.text', stylers: [{ visibility: 'on' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
];

/** "Papel e tinta": a mesma estrutura com os tokens claros (papel no lugar da madeira, sépia no lugar do latão). */
const CLARO: Record<string, string> = {
  '#111916': '#EDE4CF', '#BFB9A4': '#43372A', '#0B1210': '#F6EFE1', '#7F7A69': '#6E6250', '#15241C': '#DCE3CC',
  '#3A4A40': '#D6C9AC', '#3A3A2E': '#C9B999', '#0B1A24': '#BCD0D6',
};
export function estiloClaro(e: Estilo): Estilo {
  return e.map((r) => ({ ...r, stylers: r.stylers.map((s) => ('color' in s && typeof s.color === 'string' && CLARO[s.color] ? { color: CLARO[s.color] } : s)) }));
}

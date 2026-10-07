// Motor com Google Maps: raster sem mapId (para `styles` funcionar), coropleta no Data layer e
// rótulos/marcadores/rotas/destaques numa OverlayView própria (SVG) que reaproveita OverlayLayer.
// Não usa Advanced Markers. A chave vem de VITE_GOOGLE_MAPS_API_KEY.
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import type { Dados, LngLat } from '../data/types';
import { ESTILO_BASE, ESTILO_PERTO, estiloClaro } from './googleStyles';
import { CENA_VAZIA, Emissor, nivelDoZoom, type Bounds, type EventosMapa, type MapEngine, type NivelZoom, type Ouvinte, type Padding, type Scene, type View } from './MapEngine';
import { renderOverlay } from './OverlayLayer';

const OP: Record<NivelZoom, number> = { far: 0.82, mid: 0.72, near: 0.24 };
const BORDA: Record<NivelZoom, number> = { far: 0.6, mid: 1, near: 1.4 };
const BORDA_SUB: Record<NivelZoom, number> = { far: 1.4, mid: 1.6, near: 2 };

let opcoesDefinidas = false;

export class GoogleMapEngine implements MapEngine {
  readonly tipo = 'google' as const;
  private ev = new Emissor();
  private map!: google.maps.Map;
  private subs!: google.maps.Data;
  private mascara!: google.maps.Data;
  private ov!: google.maps.OverlayView;
  private svg!: SVGSVGElement;
  private g!: SVGGElement;
  private dados!: Dados;
  private scene: Scene = CENA_VAZIA;
  private nivel: NivelZoom = 'far';
  private origem: [number, number] = [0, 0];
  private ouvintes: google.maps.MapsEventListener[] = [];
  private claro = false;

  constructor(private chave: string, private tempoLimite = 8000) {}

  async mount(host: HTMLElement, dados: Dados, view: View) {
    this.dados = dados;
    if (!opcoesDefinidas) { setOptions({ key: this.chave, v: 'weekly', language: 'pt-BR', region: 'BR' }); opcoesDefinidas = true; }
    const falhaAuth = new Promise<never>((_, rej) => { (window as unknown as { gm_authFailure: () => void }).gm_authFailure = () => rej(new Error('chave do Google recusada')); });
    const limite = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('tempo-limite ao carregar o Google Maps')), this.tempoLimite));
    const { Map, OverlayView, Data } = await Promise.race([importLibrary('maps'), limite, falhaAuth]);

    const div = document.createElement('div');
    div.className = 'gm-map';
    host.appendChild(div);
    this.claro = document.documentElement.dataset.theme === 'light';
    this.map = new Map(div, {
      center: { lng: view.center[0], lat: view.center[1] }, zoom: Math.round(view.zoom),
      styles: this.estilo(view.zoom), disableDefaultUI: true, zoomControl: false, gestureHandling: 'greedy', clickableIcons: false,
      backgroundColor: this.claro ? '#EDE4CF' : '#111916', keyboardShortcuts: true,
    });

    // coropleta de distritos
    this.map.data.addGeoJson({ type: 'FeatureCollection', features: dados.distritos.map((d) => ({ type: 'Feature', id: d.id, properties: { id: d.id, nome: d.nome }, geometry: d.geometry })) });
    this.map.data.setStyle((f) => this.estiloDistrito(String(f.getId())));
    // bordas de subprefeitura e máscara fora do município
    this.subs = new Data({ map: this.map });
    this.subs.addGeoJson({ type: 'FeatureCollection', features: dados.subprefeituras.map((s) => ({ type: 'Feature', properties: { nome: s.nome }, geometry: s.geometry })) });
    this.mascara = new Data({ map: this.map });
    const mundo: LngLat[] = [[-179, -85], [179, -85], [179, 85], [-179, 85], [-179, -85]];
    this.mascara.addGeoJson({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [mundo, ...dados.fundo.cidade.map((r) => [...r].reverse())] } });
    this.estilizarFixos();

    // eventos
    const L = (o: google.maps.Data | google.maps.Map, ev: string, f: (e: any) => void) => this.ouvintes.push(o.addListener(ev, f));
    const cli = (e: google.maps.Data.MouseEvent | google.maps.MapMouseEvent, id: string | null) => {
      const de = e.domEvent as MouseEvent | undefined;
      this.ev.emit('click', { id, lngLat: [e.latLng!.lng(), e.latLng!.lat()], x: de?.clientX ?? 0, y: de?.clientY ?? 0 });
    };
    L(this.map.data, 'click', (e: google.maps.Data.MouseEvent) => cli(e, String(e.feature.getId())));
    L(this.map, 'click', (e: google.maps.MapMouseEvent) => cli(e, null));
    L(this.map.data, 'mouseover', (e: google.maps.Data.MouseEvent) => { const de = e.domEvent as MouseEvent; this.ev.emit('hover', { id: String(e.feature.getId()), x: de.clientX, y: de.clientY }); });
    L(this.map.data, 'mousemove', (e: google.maps.Data.MouseEvent) => { const de = e.domEvent as MouseEvent; this.ev.emit('hover', { id: String(e.feature.getId()), x: de.clientX, y: de.clientY }); });
    L(this.map.data, 'mouseout', () => this.ev.emit('hover', { id: null, x: 0, y: 0 }));
    L(this.map, 'zoom_changed', () => {
      const z = this.map.getZoom() ?? 11;
      this.map.setOptions({ styles: this.estilo(z) }); // complemento "perto" a partir do zoom 14
      const nv = nivelDoZoom(z);
      if (nv !== this.nivel) { this.nivel = nv; this.estilizarFixos(); this.map.data.setStyle((f) => this.estiloDistrito(String(f.getId()))); this.ev.emit('nivel', nv); }
    });
    L(this.map, 'bounds_changed', () => { this.ov?.draw(); this.ev.emit('view', this.getView()); });
    L(this.map, 'idle', () => this.ov?.draw());

    // overlay próprio
    const self = this;
    class Overlay extends OverlayView {
      onAdd() {
        self.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        self.svg.setAttribute('class', 'gm-overlay');
        self.svg.innerHTML = '<defs><filter id="ovglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5"/></filter></defs>';
        self.g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        self.g.setAttribute('class', 'ov');
        self.svg.appendChild(self.g);
        this.getPanes()!.overlayMouseTarget.appendChild(self.svg);
        self.svg.addEventListener('click', (e) => {
          const mk = (e.target as Element).closest('[data-mk]');
          if (!mk) return;
          e.stopPropagation();
          self.ev.emit('marker', { tipo: mk.getAttribute('data-mk')!, id: mk.getAttribute('data-id')!, x: e.clientX, y: e.clientY });
        });
        google.maps.OverlayView.preventMapHitsAndGesturesFrom(self.svg);
      }
      draw() { self.desenharOverlay(this); }
      onRemove() { self.svg?.remove(); }
    }
    this.ov = new Overlay();
    this.ov.setMap(this.map);
    this.nivel = nivelDoZoom(view.zoom);
  }

  private estilo(z: number) {
    const e = Math.round(z) >= 14 ? [...ESTILO_BASE, ...ESTILO_PERTO] : ESTILO_BASE;
    return this.claro ? estiloClaro(e) : e;
  }
  private estiloDistrito(id: string): google.maps.Data.StyleOptions {
    const s = this.scene, nv = this.nivel;
    const sel = id === s.sel || id === s.selB;
    const dim = s.esmaecer && !s.destaque.includes(id) && !sel;
    const op = OP[nv] * (dim ? 0.55 : 1) + (sel ? (nv === 'near' ? 0.06 : 0.18) : 0);
    return {
      fillColor: s.cores[id] ?? '#2C3D35', fillOpacity: Math.min(1, op), strokeColor: this.claro ? '#F6EFE1' : '#0B1210', strokeOpacity: 0.85,
      strokeWeight: s.economia ? 0 : BORDA[nv], clickable: true, zIndex: 1,
    };
  }
  private estilizarFixos() {
    const nv = this.nivel;
    this.subs.setStyle({ fillOpacity: 0, strokeColor: this.claro ? '#5A4220' : '#D8B978', strokeOpacity: 0.55, strokeWeight: BORDA_SUB[nv], clickable: false, zIndex: 2 });
    this.mascara.setStyle({ fillColor: this.claro ? '#F6EFE1' : '#060A09', fillOpacity: 0.55, strokeColor: this.claro ? '#7A5A2A' : '#B8955A', strokeWeight: 1.6, clickable: false, zIndex: 3 });
  }

  private desenharOverlay(ov: google.maps.OverlayView) {
    const proj = ov.getProjection();
    const b = this.map.getBounds();
    if (!proj || !b || !this.svg) return;
    const ne = proj.fromLatLngToDivPixel(b.getNorthEast())!, sw = proj.fromLatLngToDivPixel(b.getSouthWest())!;
    const w = Math.round(ne.x - sw.x), h = Math.round(sw.y - ne.y);
    this.origem = [sw.x, ne.y];
    Object.assign(this.svg.style, { position: 'absolute', left: `${sw.x}px`, top: `${ne.y}px`, width: `${w}px`, height: `${h}px`, overflow: 'visible', pointerEvents: 'none' });
    this.svg.setAttribute('width', String(w)); this.svg.setAttribute('height', String(h));
    const project = (ll: LngLat): [number, number] => {
      const p = proj.fromLatLngToDivPixel(new google.maps.LatLng(ll[1], ll[0]))!;
      return [p.x - this.origem[0], p.y - this.origem[1]];
    };
    this.g.innerHTML = renderOverlay({ project, w, h, zoom: this.map.getZoom() ?? 11, nivel: this.nivel, scene: this.scene, dados: this.dados, motor: 'google' });
  }

  destroy() { this.ouvintes.forEach((l) => l.remove()); this.ov?.setMap(null); this.map?.getDiv().remove(); }
  on<K extends keyof EventosMapa>(ev: K, cb: Ouvinte<K>) { return this.ev.on(ev, cb); }
  setScene(s: Scene) {
    this.scene = s;
    this.map.data.setStyle((f) => this.estiloDistrito(String(f.getId())));
    this.ov?.draw();
  }
  getView(): View { const c = this.map.getCenter(); return { center: [c?.lng() ?? -46.6, c?.lat() ?? -23.65], zoom: this.map.getZoom() ?? 11 }; }
  setView(v: Partial<View>, animar = false) {
    if (v.zoom !== undefined) this.map.setZoom(Math.round(v.zoom));
    if (v.center) { const ll = { lng: v.center[0], lat: v.center[1] }; if (animar) this.map.panTo(ll); else this.map.setCenter(ll); }
  }
  fitBounds(b: Bounds, padding: number | Padding = 40) { this.map.fitBounds({ west: b[0], south: b[1], east: b[2], north: b[3] }, padding); }
  panBy(dx: number, dy: number) { this.map.panBy(dx, dy); }
  zoomBy(d: number) { this.map.setZoom(Math.round((this.map.getZoom() ?? 11) + d)); }
  project(ll: LngLat): [number, number] {
    const p = this.ov?.getProjection()?.fromLatLngToContainerPixel(new google.maps.LatLng(ll[1], ll[0]));
    return p ? [p.x, p.y] : [0, 0];
  }
  getBounds(): Bounds {
    const b = this.map.getBounds();
    if (!b) return [-46.83, -24.01, -46.36, -23.36];
    return [b.getSouthWest().lng(), b.getSouthWest().lat(), b.getNorthEast().lng(), b.getNorthEast().lat()];
  }
  resize() { google.maps.event.trigger(this.map, 'resize'); this.ov?.draw(); }
}

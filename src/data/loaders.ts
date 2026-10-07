import type { Dados, DadosBrutos, Distrito, Fundo, Missao, Subprefeitura, TrilhaId } from './types';
import { MISSOES_COMPLEMENTO } from '../content/textos';
import { acoesCidadania, gerarMissoesCidadania } from '../content/missoesCidadania';

interface FeatureCollectionLike {
  features: { properties: Record<string, unknown>; geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon }[];
}

function bbox(geom: GeoJSON.Polygon | GeoJSON.MultiPolygon): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  for (const p of polys) for (const ring of p) for (const [x, y] of ring) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

/** Monta o modelo de dados a partir dos quatro arquivos (função pura: usada no app e nos testes). */
export function montarDados(raw: DadosBrutos, distGeo: FeatureCollectionLike, subGeo: FeatureCollectionLike, fundo: Fundo): Dados {
  const distritos: Distrito[] = distGeo.features.map((f) => {
    const p = f.properties as Record<string, any>;
    const b = bbox(f.geometry);
    const rot = fundo.rotulos.distritos[p.id] ?? { lng: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2, r_m: 600 };
    return {
      id: p.id, cod: p.cod, nome: p.nome, sub: p.subprefeitura,
      ind: { ...p.indicadores }, lacComp: { ...p.lac_componentes }, serie: p.serie_mensal,
      geometry: f.geometry, bbox: b, rotulo: rot,
    };
  });
  const subprefeituras: Subprefeitura[] = subGeo.features.map((f) => {
    const p = f.properties as Record<string, any>;
    const b = bbox(f.geometry);
    const rot = fundo.rotulos.subprefeituras[p.nome] ?? { lng: (b[0] + b[2]) / 2, lat: (b[1] + b[3]) / 2, r_m: 2000, curto: p.nome };
    return {
      id: p.id, nome: p.nome, curto: rot.curto ?? p.nome, geometry: f.geometry,
      rotulo: { lng: rot.lng, lat: rot.lat, r_m: rot.r_m },
      distritos: distritos.filter((d) => d.sub === p.nome).map((d) => d.id),
    };
  });
  const bueiro = (t: string) => t.replace(/Bocas de lobo/g, 'Bueiros').replace(/bocas de lobo/g, 'bueiros').replace(/Boca de lobo/g, 'Bueiro').replace(/boca de lobo/g, 'bueiro');
  const distritoPorId = Object.fromEntries(distritos.map((d) => [d.id, d]));
  const campanhas = raw.campanhas.map((c) => ({ ...c, nome: bueiro(c.nome), meta: bueiro(c.meta) }));
  // Missões de cidadania (MISSOES_CIDADANIA.md): novas ações no catálogo de cada trilha e missões nos núcleos.
  const trilhas = Object.fromEntries(Object.entries(raw.trilhas).map(([id, t]) => [id, { ...t, acoes: [...t.acoes, ...acoesCidadania(id as TrilhaId)] }])) as DadosBrutos['trilhas'];
  return {
    ...raw,
    trilhas,
    campanhas,
    missoes: [...raw.missoes, ...gerarMissoesCidadania({ nucleos: raw.nucleos, distritoPorId, campanhas })],
    distritos,
    distritoPorId,
    subprefeituras,
    subPorNome: Object.fromEntries(subprefeituras.map((s) => [s.nome, s])),
    fundo,
    nucleoPorId: Object.fromEntries(raw.nucleos.map((n) => [n.id, n])),
    militantePorId: Object.fromEntries(raw.militantes.map((m) => [m.id, m])),
  };
}

let cache: Promise<Dados> | null = null;
/** Carrega uma vez só (o StrictMode do React executa efeitos duas vezes em desenvolvimento). */
export function carregarDados(base = `${import.meta.env.BASE_URL}dados/`): Promise<Dados> {
  return (cache ??= carregar(base));
}
async function carregar(base: string): Promise<Dados> {
  const get = async <T,>(f: string): Promise<T> => {
    const r = await fetch(base + f);
    if (!r.ok) throw new Error(`Falha ao carregar ${f} (${r.status})`);
    return r.json() as Promise<T>;
  };
  const [raw, dist, sub, fundo] = await Promise.all([
    get<DadosBrutos>('cidade_missao_ficticio.json'),
    get<FeatureCollectionLike>('sp_distritos_ficticio.geojson'),
    get<FeatureCollectionLike>('sp_subprefeituras.geojson'),
    get<Fundo>('fundo_esquematico.json'),
  ]);
  performance.mark('cm:baixado');
  const dados = montarDados(raw, dist, sub, fundo);
  dados.missoes = [...(MISSOES_COMPLEMENTO as unknown as Missao[]), ...dados.missoes];
  return dados;
}

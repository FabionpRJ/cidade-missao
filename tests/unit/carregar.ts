import { readFileSync } from 'node:fs';
import { montarDados } from '../../src/data/loaders';

const ler = (f: string) => JSON.parse(readFileSync(new URL(`../../public/dados/${f}`, import.meta.url), 'utf8'));
export const dados = montarDados(
  ler('cidade_missao_ficticio.json'),
  ler('sp_distritos_ficticio.geojson'),
  ler('sp_subprefeituras.geojson'),
  ler('fundo_esquematico.json'),
);

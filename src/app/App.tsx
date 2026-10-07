import { useEffect, useState } from 'react';
import { carregarDados } from '../data/loaders';
import { aplicarURL } from './urlState';
import { useShortcuts } from './useShortcuts';
import { useReproducao } from '../components/Timeline';
import { DesktopShell } from './DesktopShell';
import { MobileShell } from './MobileShell';
import { st, useStore } from '../state/store';
import { Fict } from '../ui/common';
import { Monograma } from '../ui/icons';
import { useLayout } from './layout';


export function App() {
  const dados = useStore((s) => s.dados);
  const tema = useStore((s) => s.tema);
  const [erro, setErro] = useState<string | null>(null);
  const layout = useLayout();
  useShortcuts();
  useReproducao();
  useEffect(() => {
    performance.mark('cm:inicio');
    carregarDados().then((d) => { performance.mark('cm:dados'); st().set({ dados: d }); aplicarURL(); }).catch((e: Error) => setErro(e.message));
  }, []);
  useEffect(() => {
    if (tema === 'claro') document.documentElement.dataset.theme = 'light'; else delete document.documentElement.dataset.theme;
  }, [tema]);
  if (erro) return <div className="carregando" role="alert"><Monograma /><p>Não foi possível carregar os dados: {erro}</p></div>;
  if (!dados) return <div className="carregando" aria-busy="true"><Monograma /><p>Carregando o mapa estratégico…</p><Fict /></div>;
  return layout.tipo === 'mob' ? <MobileShell layout={layout} /> : <DesktopShell layout={layout} />;
}

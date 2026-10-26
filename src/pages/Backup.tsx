import { Cloud, Download, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { exportFile, ImportError, merge, parseBackup } from '../services/backup';
import { useLibrary } from '../store/useLibrary';

export function Backup() {
  const { items, setItems, resetSample, toast, sb: saved, setSupabase, sync, syncNow } = useLibrary();
  const [raw, setRaw] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [sb, setSb] = useState(saved);
  const configured = !!(saved.url && saved.key);
  const syncing = sync.status === 'syncing';
  const hhmm = (t?: number) => t ? new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  const stateText = !configured ? 'Desconectado · apenas local'
    : sync.status === 'syncing' ? 'Sincronizando…'
    : sync.status === 'error' ? `Erro: ${sync.error || 'falha na sincronização'}`
    : sync.at ? `Sincronizado às ${hhmm(sync.at)} · automático` : 'Configurado · sincroniza automaticamente';
  const dot = !configured ? 'var(--faint)' : sync.status === 'error' ? 'var(--rose)' : sync.status === 'syncing' ? 'var(--warn)' : 'var(--ok)';

  const doExport = async () => {
    try { const how = await exportFile(items); toast(how === 'share' ? 'Escolha onde salvar o backup' : 'Backup baixado'); }
    catch (e: any) { toast('Não foi possível exportar: ' + (e?.message || 'erro desconhecido')); }
  };
  const doImport = (mode: 'merge' | 'replace') => {
    try {
      const valid = parseBackup(raw);
      setItems(prev => mode === 'replace' ? valid : merge(prev, valid));
      setMsg(''); setRaw(''); toast(`${valid.length} itens importados`);
    } catch (e) { setMsg(e instanceof ImportError ? e.message : 'Falha ao importar.'); }
  };
  const onFile = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => setRaw(String(r.result || '')); r.readAsText(f); };
  const saveSb = () => {
    const url = sb.url.trim().replace(/\/+$/, ''), key = sb.key.trim();
    if ((url || key) && !/^https:\/\/.+\.supabase\.co$/.test(url)) { toast('A URL deve ser como https://xxxx.supabase.co'); return; }
    const ok = setSupabase({ url, key });
    toast(!ok ? 'Não foi possível salvar' : url && key ? 'Conectado · sincronizando' : 'Sincronização desligada');
  };
  const disconnect = () => { setSb({ url: '', key: '' }); setSupabase({ url: '', key: '' }); toast('Sincronização desligada'); };

  return (
    <>
      <h1 className="h1">Backup e sincronização</h1>
      <p className="lede">Os dados ficam salvos neste aparelho e funcionam offline. Exporte um .json para guardar uma cópia ou levar para outro dispositivo.</p>
      <div className="panels">
        <section className="panel glass">
          <h3><Download className="i" aria-hidden />Exportar</h3>
          <p>{items.length} itens. No celular abre o menu de compartilhar para salvar no Drive, enviar por e-mail etc.</p>
          <div className="row"><button className="btn primary" onClick={doExport}><Download className="i" aria-hidden />Exportar .json</button></div>
        </section>
        <section className="panel glass">
          <h3><Upload className="i" aria-hidden />Importar</h3>
          <p>Escolha um arquivo .json exportado pelo Acervo ou cole o conteúdo. “Mesclar” mantém a versão mais recente de cada item.</p>
          <input className="in" type="file" accept="application/json,.json" aria-label="Arquivo JSON" onChange={e => onFile(e.target.files?.[0])} />
          <textarea className="in code" placeholder='{ "items": [ … ] }' aria-label="JSON para importar" style={{ minHeight: 120 }} value={raw} onChange={e => setRaw(e.target.value)} />
          <div className="row"><button className="btn primary" onClick={() => doImport('merge')}>Mesclar</button><button className="btn" onClick={() => doImport('replace')}>Substituir tudo</button></div>
          {msg && <p className="err">{msg}</p>}
        </section>
        <section className="panel glass">
          <h3><Cloud className="i" aria-hidden />Supabase</h3>
          <p>Com a URL do projeto e a chave anônima, o app sincroniza sozinho entre PC e celular: ao abrir, ao voltar para o app e logo depois de cada alteração.</p>
          <span className="state" style={{ ['--dot' as any]: dot }}>{stateText}</span>
          <label className="fld"><span>URL do projeto</span><input className="in" placeholder="https://xxxx.supabase.co" value={sb.url} onChange={e => setSb({ ...sb, url: e.target.value })} autoComplete="off" /></label>
          <label className="fld"><span>Chave pública (publishable / anon key)</span><input className="in" type="password" placeholder="sb_publishable_… ou eyJhbGciOi…" value={sb.key} onChange={e => setSb({ ...sb, key: e.target.value })} autoComplete="off" /></label>
          <div className="row">
            <button className="btn" onClick={saveSb}>Salvar e conectar</button>
            <button className="btn primary" disabled={!configured || syncing} onClick={syncNow}><RefreshCw className="i" aria-hidden />{syncing ? 'Sincronizando…' : 'Sincronizar agora'}</button>
            {configured && <button className="btn ghost" onClick={disconnect}>Desconectar</button>}
          </div>
        </section>
        <section className="panel glass">
          <h3><RefreshCw className="i" aria-hidden />Dados de exemplo</h3>
          <p>Apaga tudo o que está salvo neste aparelho e recarrega os itens de exemplo. Para começar do zero, use “Apagar tudo”.</p>
          <div className="row">
            {confirmReset
              ? <><button className="btn danger" onClick={() => { resetSample(); setConfirmReset(false); toast('Dados de exemplo restaurados'); }}>Restaurar exemplos</button>
                  <button className="btn danger" onClick={() => { setItems(() => []); setConfirmReset(false); toast('Acervo vazio'); }}><Trash2 className="i" aria-hidden />Apagar tudo</button>
                  <button className="btn ghost" onClick={() => setConfirmReset(false)}>Cancelar</button></>
              : <button className="btn" onClick={() => setConfirmReset(true)}>Restaurar ou limpar…</button>}
          </div>
        </section>
      </div>
    </>
  );
}

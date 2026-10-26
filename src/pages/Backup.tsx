import { Bell, Download, LogOut, RefreshCw, Trash2, Upload, UserRound } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../services/auth';
import { exportFile, ImportError, merge, parseBackup } from '../services/backup';
import { importCSV } from '../services/importers';
import { canNotify, ensurePermission } from '../services/notify';
import { useLibrary } from '../store/useLibrary';

function Conta() {
  const { session, sync, syncNow, toast } = useLibrary();
  const [mode, setMode] = useState<'entrar' | 'criar'>('entrar');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const hhmm = (t?: number) => t ? new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

  if (session) {
    const txt = sync.status === 'syncing' ? 'Sincronizando…' : sync.status === 'error' ? `Erro: ${sync.error}` : sync.at ? `Sincronizado às ${hhmm(sync.at)}` : 'Conectado';
    const dot = sync.status === 'error' ? 'var(--rose)' : sync.status === 'syncing' ? 'var(--warn)' : 'var(--ok)';
    return (
      <section className="panel">
        <h3><UserRound className="i" aria-hidden />Conta</h3>
        <p>Conectado como <b>{session.user.email}</b>. Seus dados sincronizam sozinhos entre todos os aparelhos em que você entrar.</p>
        <span className="state" style={{ ['--dot' as any]: dot }}>{txt}</span>
        <div className="row">
          <button className="btn primary" disabled={sync.status === 'syncing'} onClick={syncNow}><RefreshCw className="i" aria-hidden />Sincronizar agora</button>
          <button className="btn ghost" onClick={() => { auth.signOut(); toast('Você saiu da conta. Os dados continuam neste aparelho.'); }}><LogOut className="i" aria-hidden />Sair</button>
        </div>
      </section>
    );
  }
  const submit = async () => {
    setMsg(''); setBusy(true);
    try {
      if (mode === 'criar') {
        const r = await auth.signUp(email.trim(), pass);
        if (r === 'confirm') { setMsg('Conta criada. Abra o e-mail de confirmação que enviamos e depois volte aqui para entrar.'); setMode('entrar'); }
        else toast('Conta criada · sincronizando');
      } else { await auth.signIn(email.trim(), pass); toast('Conectado · sincronizando'); }
    } catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const recover = async () => {
    if (!email.trim()) { setMsg('Digite seu e-mail para receber o link de nova senha.'); return; }
    try { await auth.recover(email.trim()); setMsg('Enviamos um link para criar uma nova senha.'); } catch (e: any) { setMsg(e.message); }
  };
  return (
    <section className="panel">
      <h3><UserRound className="i" aria-hidden />Conta</h3>
      <p>Entre para sincronizar com segurança entre o celular e o PC. Sem conta, tudo continua funcionando só neste aparelho.</p>
      <div className="seg2" role="tablist">
        <button role="tab" aria-selected={mode === 'entrar'} className={mode === 'entrar' ? 'on' : ''} onClick={() => setMode('entrar')}>Entrar</button>
        <button role="tab" aria-selected={mode === 'criar'} className={mode === 'criar' ? 'on' : ''} onClick={() => setMode('criar')}>Criar conta</button>
      </div>
      <form className="auth" onSubmit={e => { e.preventDefault(); submit(); }}>
        <label className="fld"><span>E-mail</span><input className="in" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label className="fld"><span>Senha</span><input className="in" type="password" autoComplete={mode === 'criar' ? 'new-password' : 'current-password'} minLength={6} value={pass} onChange={e => setPass(e.target.value)} required /></label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={busy || !email || pass.length < 6}>{busy ? 'Aguarde…' : mode === 'criar' ? 'Criar conta' : 'Entrar'}</button>
          {mode === 'entrar' && <button className="btn ghost" type="button" onClick={recover}>Esqueci a senha</button>}
        </div>
        {msg && <p className="err" style={{ color: 'var(--ink-soft)' }}>{msg}</p>}
      </form>
    </section>
  );
}

function Notificacoes() {
  const { prefs, setPrefs, toast } = useLibrary();
  if (!canNotify()) return (
    <section className="panel">
      <h3><Bell className="i" aria-hidden />Notificações</h3>
      <p>Avisos de episódios novos e lembrete de leitura funcionam no app Android.</p>
    </section>
  );
  const toggle = async (k: 'notifLancamentos' | 'notifLeitura', v: boolean) => {
    if (v && !(await ensurePermission())) { toast('Permita as notificações do Acervo nas configurações do Android.'); return; }
    setPrefs({ [k]: v });
  };
  return (
    <section className="panel">
      <h3><Bell className="i" aria-hidden />Notificações</h3>
      <label className="sw"><input type="checkbox" checked={prefs.notifLancamentos} onChange={e => toggle('notifLancamentos', e.target.checked)} /><i /><em>Episódio novo de séries e animes que acompanho</em></label>
      <label className="sw"><input type="checkbox" checked={prefs.notifLeitura} onChange={e => toggle('notifLeitura', e.target.checked)} /><i /><em>Lembrete diário de leitura</em></label>
      {prefs.notifLeitura && <label className="fld" style={{ maxWidth: 160 }}><span>Horário</span><input className="in" type="time" value={prefs.horaLeitura} onChange={e => setPrefs({ horaLeitura: e.target.value })} /></label>}
    </section>
  );
}

export function Backup() {
  const { items, setItems, resetSample, toast } = useLibrary();
  const [raw, setRaw] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

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
  const onFile = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const text = String(r.result || '');
      if (/\.csv$/i.test(f.name)) {
        try { const { origem, items: imp } = importCSV(f.name, text); setItems(prev => merge(prev, imp)); setMsg(''); toast(`${imp.length} itens importados do ${origem}`); }
        catch (e: any) { setMsg(e.message); }
      } else setRaw(text);
    };
    r.readAsText(f);
  };

  return (
    <>
      <header className="u-top"><h1 className="u-title">Conta e dados</h1></header>
      <div className="panels">
        <Conta />
        <Notificacoes />
        <section className="panel">
          <h3><Upload className="i" aria-hidden />Importar</h3>
          <p>Traga sua lista de outros apps: <b>Letterboxd</b> (Configurações → Data → Export: diary.csv, watched.csv, ratings.csv ou watchlist.csv), <b>Goodreads</b> (My Books → Import and export) ou um backup .json do Acervo. Itens repetidos são mesclados.</p>
          <input className="in" type="file" accept=".csv,.json,text/csv,application/json" aria-label="Arquivo para importar" onChange={e => { onFile(e.target.files?.[0]); e.currentTarget.value = ''; }} />
          {raw && <>
            <textarea className="in code" aria-label="JSON para importar" style={{ minHeight: 100 }} value={raw} onChange={e => setRaw(e.target.value)} />
            <div className="row"><button className="btn primary" onClick={() => doImport('merge')}>Mesclar</button><button className="btn" onClick={() => doImport('replace')}>Substituir tudo</button></div>
          </>}
          {msg && <p className="err">{msg}</p>}
        </section>
        <section className="panel">
          <h3><Download className="i" aria-hidden />Exportar</h3>
          <p>{items.length} itens. No celular abre o menu de compartilhar para salvar no Drive, enviar por e-mail etc.</p>
          <div className="row"><button className="btn primary" onClick={doExport}><Download className="i" aria-hidden />Exportar .json</button></div>
        </section>
        <section className="panel">
          <h3><RefreshCw className="i" aria-hidden />Dados de exemplo</h3>
          <p>Recarrega os itens de exemplo ou apaga tudo para começar do zero. Com conta conectada, a mudança vale para todos os aparelhos.</p>
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

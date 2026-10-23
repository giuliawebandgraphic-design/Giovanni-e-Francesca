import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

type SessionResponse = { configured?: boolean; authenticated?: boolean };

export const DashboardPasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/dashboard/session', { cache: 'no-store', credentials: 'same-origin' });
        const session = await response.json() as SessionResponse;
        if (active) setLocked(Boolean(session.configured) && !session.authenticated);
      } catch {
        if (active) setError('Impossibile verificare l’accesso protetto. Riprova.');
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!checking && locked) passwordInputRef.current?.focus();
  }, [checking, locked]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/dashboard/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(response.status === 503 ? 'La password non è configurata sul server.' : 'Password non corretta. Riprova.');
        return;
      }
      setPassword('');
      setLocked(false);
    } catch {
      setError('Connessione non disponibile. Riprova tra poco.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!checking && !locked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#FAF9F5] px-4 py-12 sm:flex sm:items-center sm:justify-center">
      <form onSubmit={submit} className="mx-auto w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#636842] text-white"><LockKeyhole className="h-5 w-5" /></div>
        <h1 className="font-editorial text-2xl font-bold text-stone-900">Area riservata agli sposi</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">Inserisci la password per accedere alla dashboard e gestire la lista nozze.</p>
        {checking ? <p className="mt-6 text-sm text-stone-500">Verifica dell’accesso in corso…</p> : <>
          <label className="mt-6 block text-xs font-bold text-stone-800" htmlFor="dashboard-password">Password</label>
          <input ref={passwordInputRef} id="dashboard-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm text-stone-900 outline-none transition focus:border-[#636842] focus:ring-2 focus:ring-[#BCBF97]/50" />
          {error && <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}
          <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#636842] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#525636] disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck className="h-4 w-4" />{submitting ? 'Verifica in corso…' : 'Accedi alla dashboard'}</button>
        </>}
      </form>
    </div>
  );
};

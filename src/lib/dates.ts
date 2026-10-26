export const today = (): string => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const yearNow = () => today().slice(0, 4);
export const asDate = (iso: string) => new Date(iso + 'T12:00:00');
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const norm = (s: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

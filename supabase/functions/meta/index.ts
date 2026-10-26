// Edge Function "meta": busca de metadados para o Acervo.
// Segredos: TMDB_TOKEN (Read Access Token ou API key v3), TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const IMG = "https://image.tmdb.org/t/p/";

/* ---------------- TMDB ---------------- */
async function tmdb(path: string, params: Record<string, string> = {}) {
  const token = Deno.env.get("TMDB_TOKEN");
  if (!token) throw new Error("TMDB_TOKEN não configurado no Supabase.");
  const url = new URL("https://api.themoviedb.org/3" + path);
  url.searchParams.set("language", "pt-BR");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const headers: Record<string, string> = { accept: "application/json" };
  if (token.startsWith("eyJ")) headers.Authorization = `Bearer ${token}`;
  else url.searchParams.set("api_key", token);
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}
function providersBR(wp: any) {
  const br = wp?.results?.BR;
  if (!br) return { link: "", lista: [] as any[] };
  const map = (arr: any[] = [], tipo: string) =>
    arr.map((p) => ({ nome: p.provider_name, logo: p.logo_path ? IMG + "w92" + p.logo_path : "", tipo }));
  return { link: br.link || "", lista: [...map(br.flatrate, "assinatura"), ...map(br.free, "grátis"), ...map(br.ads, "com anúncios"), ...map(br.rent, "aluguel"), ...map(br.buy, "compra")] };
}
async function tmdbSearch(q: string, type: "movie" | "tv") {
  const d = await tmdb(`/search/${type}`, { query: q, include_adult: "false" });
  return (d.results || []).slice(0, 10).map((r: any) => ({
    fonte: "tmdb", tipo: type, extId: String(r.id),
    titulo: type === "movie" ? r.title : r.name,
    original: type === "movie" ? r.original_title : r.original_name,
    ano: ((type === "movie" ? r.release_date : r.first_air_date) || "").slice(0, 4),
    capa: r.poster_path ? IMG + "w342" + r.poster_path : "",
    resumo: r.overview || "",
  }));
}
async function tmdbDetails(id: string, type: "movie" | "tv") {
  const d = await tmdb(`/${type}/${id}`, { append_to_response: "credits,watch/providers" });
  const generos = (d.genres || []).map((g: any) => g.name);
  const onde = providersBR(d["watch/providers"]);
  if (type === "movie") {
    const diretor = (d.credits?.crew || []).filter((c: any) => c.job === "Director").map((c: any) => c.name).join(", ");
    return { fonte: "tmdb", tipo: "movie", extId: String(d.id), titulo: d.title, ano: Number((d.release_date || "").slice(0, 4)) || null, duracaoMin: d.runtime || null, diretor, generos, capa: d.poster_path ? IMG + "w500" + d.poster_path : "", onde };
  }
  const temporadas = (d.seasons || []).filter((s: any) => s.season_number > 0).sort((a: any, b: any) => a.season_number - b.season_number).map((s: any) => s.episode_count || 0);
  const nx = d.next_episode_to_air;
  const anime = (d.origin_country || []).includes("JP") && (d.genres || []).some((g: any) => g.id === 16);
  return {
    fonte: "tmdb", tipo: "tv", extId: String(d.id), titulo: d.name, ano: Number((d.first_air_date || "").slice(0, 4)) || null,
    generos, capa: d.poster_path ? IMG + "w500" + d.poster_path : "", onde, anime,
    totalTemporadas: temporadas.length || d.number_of_seasons || null, temporadas,
    streaming: onde.lista.find((p: any) => p.tipo === "assinatura")?.nome || (d.networks || [])[0]?.name || "",
    emExibicao: d.status === "Returning Series" || d.in_production === true,
    proximoEp: nx ? { data: nx.air_date, temporada: nx.season_number, episodio: nx.episode_number, nome: nx.name || "" } : null,
  };
}

/* ---------------- IGDB ---------------- */
let twitch: { token: string; exp: number } | null = null;
async function igdb(endpoint: string, body: string) {
  const id = Deno.env.get("TWITCH_CLIENT_ID"), secret = Deno.env.get("TWITCH_CLIENT_SECRET");
  if (!id || !secret) throw new Error("TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET não configurados no Supabase.");
  if (!twitch || Date.now() > twitch.exp) {
    const r = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`, { method: "POST" });
    if (!r.ok) throw new Error(`Twitch ${r.status}`);
    const t = await r.json();
    twitch = { token: t.access_token, exp: Date.now() + (t.expires_in - 600) * 1000 };
  }
  const r = await fetch(`https://api.igdb.com/v4/${endpoint}`, { method: "POST", headers: { "Client-ID": id, Authorization: `Bearer ${twitch.token}`, accept: "application/json" }, body });
  if (!r.ok) throw new Error(`IGDB ${r.status}`);
  return r.json();
}
const PLAT_MAP: Record<string, string> = { "PlayStation 5": "PS5", "PlayStation 4": "PS4", "Xbox Series X|S": "Xbox Series", "Nintendo Switch": "Switch", "Nintendo Switch 2": "Switch 2", "PC (Microsoft Windows)": "PC", "Android": "Mobile", "iOS": "Mobile", "Xbox One": "Xbox One", "Mac": "PC", "Linux": "PC" };
async function igdbSearch(q: string) {
  const safe = q.replace(/"/g, "");
  const games = await igdb("games", `search "${safe}"; fields name,first_release_date,cover.image_id,platforms.name,genres.name,summary; where version_parent = null; limit 10;`);
  const ids = games.map((g: any) => g.id);
  let ttb: any[] = [];
  if (ids.length) { try { ttb = await igdb("game_time_to_beats", `fields game_id,hastily,normally,completely; where game_id = (${ids.join(",")}); limit 10;`); } catch { ttb = []; } }
  return games.map((g: any) => {
    const t = ttb.find((x: any) => x.game_id === g.id);
    const plats = [...new Set((g.platforms || []).map((p: any) => PLAT_MAP[p.name] || p.name))];
    return {
      fonte: "igdb", tipo: "game", extId: String(g.id), titulo: g.name,
      ano: g.first_release_date ? new Date(g.first_release_date * 1000).getUTCFullYear() : null,
      capa: g.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg` : "",
      plataformas: plats, generos: (g.genres || []).map((x: any) => x.name), resumo: g.summary || "",
      tempo: t ? { rapido: t.hastily ? Math.round(t.hastily / 3600) : null, normal: t.normally ? Math.round(t.normally / 3600) : null, completo: t.completely ? Math.round(t.completely / 3600) : null } : null,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { action, q, id, type } = await req.json();
    switch (action) {
      case "status": return json({ tmdb: !!Deno.env.get("TMDB_TOKEN"), igdb: !!(Deno.env.get("TWITCH_CLIENT_ID") && Deno.env.get("TWITCH_CLIENT_SECRET")) });
      case "tmdb.search": return json(await tmdbSearch(String(q || ""), type === "tv" ? "tv" : "movie"));
      case "tmdb.details": return json(await tmdbDetails(String(id), type === "tv" ? "tv" : "movie"));
      case "igdb.search": return json(await igdbSearch(String(q || "")));
      default: return json({ error: "ação desconhecida" }, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});

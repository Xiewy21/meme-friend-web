type Trend = {
  id: string;
  phrase: string;
  context: string;
  category: "人物" | "口头禅" | "事件";
  source: string;
  sourceUrl: string;
  heat: number;
};

const fallback: Trend[] = [
  { id: "classic-1", phrase: "张雪峰老师", context: "人物相关二创语境，可搭配点评、劝学和犀利反问", category: "人物", source: "经典备用池", sourceUrl: "https://www.bilibili.com/v/popular/all", heat: 88 },
  { id: "classic-2", phrase: "东北雨姐", context: "人物相关二创语境，适合豪爽、直给、反差画面", category: "人物", source: "经典备用池", sourceUrl: "https://top.baidu.com/board?tab=realtime", heat: 85 },
  { id: "classic-3", phrase: "我最讨厌事后道歉！", context: "情绪爆发式口头禅，适合严肃表情和戏剧化字幕", category: "口头禅", source: "经典备用池", sourceUrl: "https://www.bilibili.com/v/popular/all", heat: 82 },
  { id: "classic-4", phrase: "杀杀杀！", context: "节奏型口头禅，适合连续动作和高能表情", category: "口头禅", source: "经典备用池", sourceUrl: "https://www.bilibili.com/v/popular/all", heat: 80 },
];

function cleanPhrase(value: string) {
  return value.replace(/【[^】]*】/g, "").replace(/#[^#]+#/g, "").replace(/\s+/g, " ").trim().slice(0, 28);
}

function classify(value: string): Trend["category"] {
  if ((/^(我|你|谁|这|那|不是|怎么|真|太|别|又).{2,18}$/.test(value) || /(我|你|谁|这|那|不是|怎么|真|太|别|又).{0,18}[！!？?]$/.test(value)) && value.length <= 26) return "口头禅";
  if (/(老师|雨姐|哥|姐|叔|爷|酱|本人|回应|说)/.test(value) && value.length <= 26) return "人物";
  return "事件";
}

function contextFor(phrase: string, category: Trend["category"]) {
  if (category === "人物") return `围绕「${phrase.slice(0, 12)}」的当日人物讨论，适合表情反差与态度点评`;
  if (category === "口头禅") return "短句感强、容易复读，适合做大字爆发或连续动作字幕";
  return "今天正在发酵的事件语境，适合做反应型和围观型表情包";
}

async function bilibiliTrends(): Promise<Trend[]> {
  const response = await fetch("https://api.bilibili.com/x/web-interface/popular?pn=1&ps=30", { headers: { "User-Agent": "Mozilla/5.0 meme-radar/1.0" } });
  if (!response.ok) return [];
  const payload = await response.json() as { data?: { list?: Array<{ aid?: number; title?: string; stat?: { view?: number } }> } };
  return (payload.data?.list ?? []).map((item, index) => {
    const phrase = cleanPhrase(item.title ?? "");
    const category = classify(phrase);
    return { id: `bili-${item.aid ?? index}`, phrase, context: contextFor(phrase, category), category, source: "Bilibili 热门", sourceUrl: "https://www.bilibili.com/v/popular/all", heat: Math.max(56, 98 - index * 2) };
  }).filter((item) => item.phrase.length >= 4);
}

function decodeJsonString(value: string) {
  try { return JSON.parse(`"${value}"`) as string; } catch { return value; }
}

async function baiduTrends(): Promise<Trend[]> {
  const response = await fetch("https://top.baidu.com/board?tab=realtime", { headers: { "User-Agent": "Mozilla/5.0 meme-radar/1.0" } });
  if (!response.ok) return [];
  const html = await response.text();
  const matches = [...html.matchAll(/"query":"((?:\\.|[^"\\])+)"/g)].slice(0, 30);
  return matches.map((match, index) => {
    const phrase = cleanPhrase(decodeJsonString(match[1]));
    const category = classify(phrase);
    return { id: `baidu-${index}-${phrase}`, phrase, context: contextFor(phrase, category), category, source: "百度热搜", sourceUrl: "https://top.baidu.com/board?tab=realtime", heat: Math.max(54, 96 - index * 2) };
  }).filter((item) => item.phrase.length >= 4);
}

export async function GET() {
  const results = await Promise.allSettled([bilibiliTrends(), baiduTrends()]);
  const liveItems = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const seen = new Set<string>();
  const unique = liveItems.filter((item) => {
    const key = item.phrase.replace(/[\s，。！？!?,.]/g, "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const expressive = unique.filter((item) => item.category !== "事件" || /[我你他她谁这那太真又被说回应首个全网]/.test(item.phrase));
  const trends = [...expressive.slice(0, 12), ...fallback].slice(0, 16);
  return Response.json({ trends, updatedAt: new Date().toISOString(), live: liveItems.length > 0 }, { headers: { "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=3600" } });
}

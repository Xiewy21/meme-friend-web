"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Trend = {
  id: string;
  phrase: string;
  context: string;
  category: "人物" | "口头禅" | "事件";
  source: string;
  sourceUrl: string;
  heat: number;
};

type Mode = "text" | "image" | "combo" | "empty";

const fallbackTrends: Trend[] = [
  { id: "classic-1", phrase: "张雪峰老师", context: "人物相关二创语境，可搭配点评、劝学和犀利反问", category: "人物", source: "经典备用池", sourceUrl: "https://www.bilibili.com/v/popular/all", heat: 88 },
  { id: "classic-2", phrase: "东北雨姐", context: "人物相关二创语境，适合豪爽、直给、反差画面", category: "人物", source: "经典备用池", sourceUrl: "https://top.baidu.com/board?tab=realtime", heat: 85 },
  { id: "classic-3", phrase: "我最讨厌事后道歉！", context: "情绪爆发式口头禅，适合严肃表情和戏剧化字幕", category: "口头禅", source: "经典备用池", sourceUrl: "https://www.bilibili.com/v/popular/all", heat: 82 },
  { id: "classic-4", phrase: "杀杀杀！", context: "节奏型口头禅，适合连续动作和高能表情", category: "口头禅", source: "经典备用池", sourceUrl: "https://www.bilibili.com/v/popular/all", heat: 80 },
];

const vibes = ["互联网嘴替", "阴阳怪气", "可爱发疯", "职场求生", "高级冷幽默"];
const filters = [
  { id: "none", name: "原味", color: "#f5f3ed" },
  { id: "pink", name: "浅粉暧昧", color: "#ffb9d0" },
  { id: "yellow", name: "暖黄心动", color: "#ffd86b" },
  { id: "green", name: "亮绿上头", color: "#b9ff55" },
];
const emojiSets = [
  { id: "none", name: "不加", icon: "—", chars: [] },
  { id: "heart", name: "迷你爱心", icon: "♥", chars: ["💗", "♡", "💕", "♥"] },
  { id: "eyes", name: "偷看", icon: "👀", chars: ["👀", "♡", "👀", "✦"] },
  { id: "spark", name: "闪闪", icon: "✦", chars: ["✦", "✨", "⋆", "✧"] },
];
const artStyles = [
  { id: "jojo", name: "漫画冲击", note: "JOJO 感" },
  { id: "ace", name: "法庭宣言", note: "逆转裁判感" },
  { id: "shake", name: "抖动故障", note: "动态特效" },
  { id: "clean", name: "粗黑贴纸", note: "经典表情包" },
];
const bubbles = [
  { id: "round", name: "圆角气泡" },
  { id: "cloud", name: "软糯云朵" },
  { id: "sharp", name: "大声公" },
];

function modeFor(quote: string, imageUrl: string | null): Mode {
  if (quote.trim() && imageUrl) return "combo";
  if (imageUrl) return "image";
  if (quote.trim()) return "text";
  return "empty";
}

function modeCopy(mode: Mode) {
  if (mode === "text") return { label: "仅文字", detail: "对话框＋滤镜＋emoji 装饰" };
  if (mode === "image") return { label: "仅图片", detail: "可以融合今天的网络热梗" };
  if (mode === "combo") return { label: "图片＋文字", detail: "保留朋友原话，叠加艺术字" };
  return { label: "等待素材", detail: "输入文字、上传图片，或两样都来" };
}

export default function Home() {
  const [quote, setQuote] = useState("我真的没生气，我只是有点无语。");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState(vibes[0]);
  const [selectedFilter, setSelectedFilter] = useState("pink");
  const [selectedEmoji, setSelectedEmoji] = useState("heart");
  const [selectedArt, setSelectedArt] = useState("jojo");
  const [selectedBubble, setSelectedBubble] = useState("round");
  const [trends, setTrends] = useState<Trend[]>(fallbackTrends);
  const [trendUpdatedAt, setTrendUpdatedAt] = useState<string>("正在读取今日热榜…");
  const [trendStatus, setTrendStatus] = useState<"loading" | "live" | "fallback">("loading");
  const [trendCategory, setTrendCategory] = useState<"全部" | Trend["category"]>("全部");
  const [selectedTrendId, setSelectedTrendId] = useState(fallbackTrends[0].id);
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const mode = modeFor(quote, imageUrl);
  const currentMode = modeCopy(mode);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/trends", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("trend request failed")))
      .then((data: { trends?: Trend[]; updatedAt?: string; live?: boolean }) => {
        if (data.trends?.length) {
          setTrends(data.trends);
          setSelectedTrendId(data.trends[0].id);
        }
        setTrendUpdatedAt(data.updatedAt ? new Date(data.updatedAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "今日");
        setTrendStatus(data.live ? "live" : "fallback");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setTrendUpdatedAt("今日备用梗池");
          setTrendStatus("fallback");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const filteredTrends = useMemo(() => trends.filter((trend) => trendCategory === "全部" || trend.category === trendCategory).slice(0, 8), [trends, trendCategory]);
  const selectedTrend = trends.find((trend) => trend.id === selectedTrendId) ?? trends[0];
  const selectedEmojiChars = emojiSets.find((item) => item.id === selectedEmoji)?.chars ?? [];
  const resultTexts = useMemo(() => {
    if (mode === "image") {
      const phrase = selectedTrend?.phrase ?? "今天也很有梗";
      return [phrase, `不是吧，${phrase.slice(0, 10)}`, `${phrase.slice(0, 12)} · ${selectedVibe}`];
    }
    return [quote.trim(), quote.trim(), quote.trim()];
  }, [mode, quote, selectedTrend, selectedVibe]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setGenerated(false);
  }

  function clearImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    if (fileRef.current) fileRef.current.value = "";
    setGenerated(false);
  }

  function generate() {
    if (mode === "empty") return;
    setIsGenerating(true);
    setGenerated(false);
    window.setTimeout(() => {
      setGenerated(true);
      setIsGenerating(false);
      setActiveResult(0);
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }, 700);
  }

  async function loadCanvasImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function downloadCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f7f5ef";
    ctx.fillRect(0, 0, 1080, 1080);
    if (imageUrl) {
      try {
        const source = await loadCanvasImage(imageUrl);
        const scale = Math.max(1080 / source.width, 1080 / source.height);
        const width = source.width * scale;
        const height = source.height * scale;
        ctx.drawImage(source, (1080 - width) / 2, (1080 - height) / 2, width, height);
      } catch { /* keep background */ }
    }
    const overlay: Record<string, string> = { none: "rgba(255,255,255,0)", pink: "rgba(255,137,181,.34)", yellow: "rgba(255,201,72,.3)", green: "rgba(163,255,54,.28)" };
    ctx.fillStyle = overlay[selectedFilter];
    ctx.fillRect(0, 0, 1080, 1080);
    selectedEmojiChars.forEach((emoji, index) => {
      ctx.font = `${40 + (index % 3) * 12}px Arial`;
      ctx.fillText(emoji, 80 + ((index * 227) % 900), 100 + ((index * 193) % 820));
      ctx.fillText(emoji, 930 - ((index * 137) % 800), 220 + ((index * 271) % 700));
    });
    const text = resultTexts[activeResult] || "梗友制造";
    if (mode === "text") {
      ctx.fillStyle = "rgba(255,255,255,.92)";
      ctx.beginPath();
      ctx.roundRect(110, 310, 860, 420, selectedBubble === "round" ? 70 : 24);
      ctx.fill();
      ctx.strokeStyle = "#191a18";
      ctx.lineWidth = 8;
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${mode === "text" ? 68 : 76}px Arial`;
    ctx.lineWidth = selectedArt === "ace" ? 18 : 12;
    ctx.strokeStyle = selectedArt === "jojo" ? "#7125a8" : selectedArt === "ace" ? "#9d1717" : "#ffffff";
    ctx.fillStyle = selectedArt === "jojo" ? "#fff12d" : "#111111";
    const chunks = text.match(/.{1,12}/g) ?? [text];
    chunks.slice(0, 4).forEach((line, index) => {
      const y = 465 + (index - (Math.min(chunks.length, 4) - 1) / 2) * 92;
      ctx.strokeText(line, 540, y, 870);
      ctx.fillText(line, 540, y, 870);
    });
    ctx.font = "700 26px Arial";
    ctx.fillStyle = "#191a18";
    ctx.fillText("梗友 · 今日有梗", 540, 1030);
    const link = document.createElement("a");
    link.download = `梗友-${currentMode.label}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="梗友首页"><span>梗</span>友</a>
        <div className="navLinks"><a href="#studio">制作台</a><a href="#hot">今日热梗</a><a href="#results">作品</a></div>
        <a className="statusPill" href="#hot"><i></i> 每日更新</a>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>V2</span> 朋友原话 × 今日互联网语境</div>
        <h1>一句话，一张图，<br />做成你们的<span className="marker">专属梗</span>。</h1>
        <p>文字就装进对话框，照片就配上今天真正流行的梗。<br className="desktop" />两样都来，再用艺术字把朋友的原话钉在名场面上。</p>
        <div className="modeLegend"><span>只传文字 <b>气泡＋滤镜</b></span><i>→</i><span>只传图片 <b>网络热梗</b></span><i>→</i><span>图片＋文字 <b>艺术字</b></span></div>
      </section>

      <section className="studio shell" id="studio">
        <div className="modeBar"><div><small>当前生成模式</small><strong>{currentMode.label}</strong></div><p>{currentMode.detail}</p><span className={`modeDot ${mode}`}></span></div>
        <div className="workspace">
          <div className="panel inputPanel">
            <div className="panelTitle"><span>01</span><div><h2>投喂素材</h2><p>文字和图片可以单独用，也可以一起用</p></div></div>
            <label className="fieldLabel" htmlFor="quote">朋友说了什么？</label>
            <div className="textareaWrap">
              <textarea id="quote" value={quote} maxLength={120} onChange={(event) => { setQuote(event.target.value); setGenerated(false); }} placeholder="粘贴一句让人忘不掉的话……" />
              <span>{quote.length}/120</span>
            </div>
            <div className="and"><span>还可以加一张图</span></div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
            <div className={`upload ${imageUrl ? "hasImage" : ""}`}>
              {imageUrl ? <img src={imageUrl} alt="已上传的朋友照片" /> : <span className="uploadIcon">↥</span>}
              <strong>{imageUrl ? "照片已就位" : "上传朋友的照片"}</strong>
              <small>{imageUrl ? "可以换图或删除" : "JPG、PNG、WebP · 最大 10MB"}</small>
              <div className="uploadActions"><button onClick={() => fileRef.current?.click()}>{imageUrl ? "换一张" : "选择照片"}</button>{imageUrl && <button onClick={clearImage}>删除</button>}</div>
            </div>
            <div className="privacy">⌁ 图片只在当前浏览器内预览，不上传保存</div>
          </div>

          <div className="panel stylePanel">
            <div className="panelTitle"><span>02</span><div><h2>设计表情包</h2><p>系统已按素材组合推荐可用效果</p></div></div>
            <label className="fieldLabel">整体滤镜</label>
            <div className="filterGrid">{filters.map((filter) => <button key={filter.id} className={selectedFilter === filter.id ? "selected" : ""} onClick={() => setSelectedFilter(filter.id)}><i style={{ background: filter.color }}></i><span>{filter.name}</span></button>)}</div>
            <label className="fieldLabel optionLabel">装饰 emoji</label>
            <div className="emojiGrid">{emojiSets.map((emoji) => <button key={emoji.id} className={selectedEmoji === emoji.id ? "selected" : ""} onClick={() => setSelectedEmoji(emoji.id)}><i>{emoji.icon}</i>{emoji.name}</button>)}</div>
            {mode === "text" && <><label className="fieldLabel optionLabel">对话框形状</label><div className="choiceRow">{bubbles.map((bubble) => <button key={bubble.id} className={selectedBubble === bubble.id ? "selected" : ""} onClick={() => setSelectedBubble(bubble.id)}>{bubble.name}</button>)}</div></>}
            {mode === "combo" && <><label className="fieldLabel optionLabel">艺术字风格</label><div className="artGrid">{artStyles.map((art) => <button key={art.id} className={selectedArt === art.id ? "selected" : ""} onClick={() => setSelectedArt(art.id)}><strong className={`artSample ${art.id}`}>啊!</strong><span>{art.name}<small>{art.note}</small></span></button>)}</div></>}
            <label className="fieldLabel optionLabel">文案语气</label>
            <div className="vibeRow">{vibes.map((vibe) => <button key={vibe} className={selectedVibe === vibe ? "selected" : ""} onClick={() => setSelectedVibe(vibe)}>{vibe}</button>)}</div>
          </div>
        </div>
      </section>

      <section className={`hotSection ${mode === "image" ? "enabled" : "disabled"}`} id="hot">
        <div className="shell">
          <div className="hotHead"><div><span className="sectionNo">03</span><div><p>DAILY MEME RADAR</p><h2>今天大家真正在玩什么？</h2></div></div><div className="updateStamp"><i className={trendStatus}></i><span>{trendStatus === "live" ? "公开热榜已同步" : trendStatus === "loading" ? "正在同步" : "使用备用梗池"}<small>{trendUpdatedAt} · 每日刷新</small></span></div></div>
          {mode !== "image" && <div className="modeNotice"><span>🔒</span><div><strong>网络热梗仅作用于“单独图片”</strong><p>{mode === "combo" ? "你同时输入了朋友原话，所以本次会尊重原话，不自动套用外部热梗。删除文字即可开启。" : "上传一张图片并清空文字，就能从今日梗池选择。"}</p></div></div>}
          <div className="hotControls"><div>{(["全部", "人物", "口头禅", "事件"] as const).map((category) => <button key={category} className={trendCategory === category ? "selected" : ""} onClick={() => setTrendCategory(category)}>{category}</button>)}</div><p>面向 20–30 岁语境的候选池 · 来源为公开热榜，生成前由你确认</p></div>
          <div className="trendGrid">{filteredTrends.map((trend, index) => <button key={trend.id} disabled={mode !== "image"} className={selectedTrendId === trend.id && mode === "image" ? "selected" : ""} onClick={() => setSelectedTrendId(trend.id)}>
            <div className="trendTop"><span>{String(index + 1).padStart(2, "0")}</span><em>{trend.category}</em><i style={{ width: `${Math.max(35, trend.heat)}%` }}></i></div>
            <h3>{trend.phrase}</h3><p>{trend.context}</p><small>来自 {trend.source} ↗</small>
          </button>)}</div>
          <div className="sourceNote">每天首次访问时聚合 <a href="https://www.bilibili.com/v/popular/all" target="_blank" rel="noreferrer">Bilibili 热门</a> 与 <a href="https://top.baidu.com/board?tab=realtime" target="_blank" rel="noreferrer">百度热搜</a>，24 小时缓存；“年轻语境”由娱乐性、口语化和二创潜力规则筛选，不代表平台提供年龄数据。</div>
        </div>
      </section>

      <section className="actionSection shell">
        <div><span>04</span><div><h2>准备出锅</h2><p>{mode === "image" ? `将图片与「${selectedTrend?.phrase ?? "今日热梗"}」融合` : currentMode.detail}</p></div></div>
        <button className="generate" onClick={generate} disabled={isGenerating || mode === "empty"}>{isGenerating ? "正在造梗…" : "生成 3 张表情包  ✦"}</button>
      </section>

      <section className="results shell" id="results">
        <div className="resultsHead"><div><span>05</span><h2>{generated ? "新鲜出炉" : "作品会出现在这里"}</h2></div><p>{generated ? `当前模式：${currentMode.label}` : "先在上方完成素材与效果设置"}</p></div>
        {generated ? <>
          <div className="memeGrid">{resultTexts.map((text, index) => <button key={`${text}-${index}`} className={`memeCard card${index} mode-${mode} filter-${selectedFilter} bubble-${selectedBubble} ${activeResult === index ? "active" : ""}`} onClick={() => setActiveResult(index)}>
            {imageUrl && <img src={imageUrl} alt="" />}
            <div className="colorWash"></div>
            <div className="emojiRain" aria-hidden="true">{selectedEmojiChars.flatMap((emoji, emojiIndex) => [0, 1].map((repeat) => <i key={`${emojiIndex}-${repeat}`} style={{ left: `${8 + ((emojiIndex * 29 + repeat * 43) % 84)}%`, top: `${8 + ((emojiIndex * 37 + repeat * 23) % 78)}%`, transform: `rotate(${emojiIndex % 2 ? 14 : -12}deg)` }}>{emoji}</i>))}</div>
            {mode === "text" ? <div className="speechBubble"><span>{text}</span></div> : <span className={`memeText ${mode === "combo" ? selectedArt : index === 0 ? "clean" : index === 1 ? "ace" : "shake"}`}>{text}</span>}
            <small>梗友制造 · {currentMode.label}</small>
          </button>)}</div>
          <div className="resultActions"><button onClick={generate}>↻ 再来一批</button><button className="download" onClick={downloadCard}>↓ 保存选中的表情包</button></div>
        </> : <div className="emptyResult"><span>✦</span><p>好梗正在等一个契机</p></div>}
      </section>

      <footer><div className="shell"><b><span>梗</span>友</b><p>认真对待每一次不正经。</p><small>请在获得朋友同意后使用照片 · 热梗会标注公开来源</small></div></footer>
    </main>
  );
}

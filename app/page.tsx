"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

const styles = [
  { name: "互联网嘴替", icon: "◉" },
  { name: "阴阳怪气", icon: "☯" },
  { name: "可爱发疯", icon: "✿" },
  { name: "职场求生", icon: "▣" },
  { name: "高级冷幽默", icon: "❄" },
];

const hotTopics = ["# 已读乱回", "# 情绪价值", "# 淡人浓人", "# 电子布洛芬"];

const copyByStyle: Record<string, string[]> = {
  "互联网嘴替": ["听懂了，但决定不改", "道理我都懂，先让我缓缓", "这福气给你，你要不要"],
  "阴阳怪气": ["哇，原来还可以这样呢", "没关系，你开心就好", "懂了，又是我的问题"],
  "可爱发疯": ["今天也在努力保持情绪稳定", "小小脑袋，大大问号", "不嘻嘻，我要开始发疯了"],
  "职场求生": ["收到，不理解，但执行", "这个需求很有想法", "下班之后，消息免打扰"],
  "高级冷幽默": ["沉默，是今晚的康桥", "情绪稳定，主要靠没反应过来", "人生建议：保持离线"],
};

export default function Home() {
  const [quote, setQuote] = useState("我真的没生气，我只是有点无语。");
  const [selectedStyle, setSelectedStyle] = useState("互联网嘴替");
  const [selectedTopic, setSelectedTopic] = useState(hotTopics[0]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeResult, setActiveResult] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const results = useMemo(() => {
    const base = copyByStyle[selectedStyle];
    const quoteHint = quote.trim().replace(/[。！!？?]/g, "").slice(0, 10);
    return [
      `${quoteHint || base[0]}\n但我选择${selectedTopic.replace("# ", "")}`,
      base[1],
      base[2],
    ];
  }, [quote, selectedStyle, selectedTopic]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setGenerated(false);
  }

  function generate() {
    setIsGenerating(true);
    setGenerated(false);
    window.setTimeout(() => {
      setGenerated(true);
      setIsGenerating(false);
      setActiveResult(0);
    }, 900);
  }

  function downloadCard() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f2ff5c";
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.fillStyle = "#171817";
    ctx.font = "900 72px Arial";
    ctx.textAlign = "center";
    const lines = results[activeResult].split("\n");
    lines.forEach((line, i) => ctx.fillText(line, 540, 470 + i * 100, 900));
    ctx.font = "600 30px Arial";
    ctx.fillText("梗友 · AI 表情包", 540, 1015);
    const link = document.createElement("a");
    link.download = "梗友表情包.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="梗友首页"><span>梗</span>友</a>
        <div className="navLinks"><a href="#studio">制作台</a><a href="#ideas">玩法灵感</a><a href="#about">关于</a></div>
        <button className="historyBtn" onClick={() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" })}>作品夹 <span>0</span></button>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span>NEW</span> 你的朋友，值得拥有专属表情包</div>
        <h1>把朋友的<span className="marker">名场面</span><br />变成今天最好笑的表情包。</h1>
        <p>丢进一句话，或者一张照片。AI 读懂语气、接上热梗，<br className="desktop" />几秒钟生成只属于你们的聊天核武器。</p>
        <div className="trendStrip"><b>↗ 今日梗感</b><span>已读乱回</span><span>情绪价值</span><span>淡人浓人</span><i>每日更新</i></div>
      </section>

      <section className="studio shell" id="studio">
        <div className="stepRail" aria-label="制作步骤"><span className="active"><b>1</b>投喂素材</span><i></i><span><b>2</b>选择口味</span><i></i><span><b>3</b>出锅</span></div>
        <div className="workspace">
          <div className="panel inputPanel">
            <div className="panelTitle"><span>01</span><div><h2>先来点素材</h2><p>一句话或一张图，都可以</p></div></div>
            <label className="fieldLabel" htmlFor="quote">朋友说了什么？</label>
            <div className="textareaWrap">
              <textarea id="quote" value={quote} maxLength={120} onChange={(e) => { setQuote(e.target.value); setGenerated(false); }} placeholder="例如：我真的没生气，我只是有点无语……" />
              <span>{quote.length}/120</span>
            </div>
            <div className="or"><span>或者</span></div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
            <button className={`upload ${imageUrl ? "hasImage" : ""}`} onClick={() => fileRef.current?.click()}>
              {imageUrl ? <img src={imageUrl} alt="已上传的朋友照片" /> : <span className="uploadIcon">↥</span>}
              <strong>{imageUrl ? "照片已就位" : "上传一张朋友的照片"}</strong>
              <small>{imageUrl ? "点击可以换一张" : "JPG、PNG，最大 10MB"}</small>
            </button>
            <div className="privacy">⌁ 图片仅用于本次生成，不会用于训练</div>
          </div>

          <div className="panel flavorPanel">
            <div className="panelTitle"><span>02</span><div><h2>选个口味</h2><p>想让它有多损？</p></div></div>
            <div className="styleGrid">
              {styles.map((item) => <button key={item.name} className={selectedStyle === item.name ? "selected" : ""} onClick={() => { setSelectedStyle(item.name); setGenerated(false); }}><i>{item.icon}</i>{item.name}{selectedStyle === item.name && <em>✓</em>}</button>)}
            </div>
            <label className="fieldLabel topicLabel">蹭点今天的热度 <span>实时</span></label>
            <div className="topics">{hotTopics.map((topic) => <button key={topic} onClick={() => setSelectedTopic(topic)} className={selectedTopic === topic ? "on" : ""}>{topic}</button>)}</div>
            <button className="generate" onClick={generate} disabled={isGenerating}>{isGenerating ? "正在理解这位朋友…" : "开始造梗  ✦"}</button>
            <p className="generateHint">预计需要 3 秒 · 每次生成 3 张</p>
          </div>
        </div>
      </section>

      <section className={`results shell ${generated ? "show" : ""}`} id="results">
        <div className="resultsHead"><div><span>03</span><h2>{generated ? "新鲜出炉" : "等你来造梗"}</h2></div><p>{generated ? "挑一个最懂你们的" : "选择素材和口味，结果会出现在这里"}</p></div>
        {generated ? <>
          <div className="memeGrid">
            {results.map((text, index) => <button key={text} className={`memeCard card${index} ${activeResult === index ? "active" : ""}`} onClick={() => setActiveResult(index)}>
              {imageUrl && <img src={imageUrl} alt="" />}
              <span>{text.split("\n").map((line) => <b key={line}>{line}</b>)}</span>
              <small>梗友制造</small>
            </button>)}
          </div>
          <div className="resultActions"><button onClick={generate}>↻ 再来一批</button><button className="download" onClick={downloadCard}>↓ 保存选中的表情包</button></div>
        </> : <div className="emptyResult"><span>✦</span><p>好梗正在等一个契机</p></div>}
      </section>

      <section className="ideas shell" id="ideas"><p>不只会接梗</p><h2>每一种友情，都有自己的语言。</h2><div><article><span>01</span><h3>聊天截图变梗</h3><p>读懂上下文，把那句平平无奇的话变成绝杀。</p></article><article><span>02</span><h3>照片自动加戏</h3><p>识别表情和情绪，找到最精准的字幕。</p></article><article><span>03</span><h3>热点每天刷新</h3><p>跟上此刻流行的语气，但保留你们自己的梗。</p></article></div></section>
      <footer id="about"><div className="shell"><b><span>梗</span>友</b><p>认真对待每一次不正经。</p><small>请在获得朋友同意后使用照片 · 原图默认不留存</small></div></footer>
    </main>
  );
}

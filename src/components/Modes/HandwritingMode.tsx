import { useState } from "react";
import { HeaderBar } from "../Layout/HeaderBar";
import { TracingCanvas } from "../Handwriting/TracingCanvas";
import { regions } from "../../data/regions";
import type { HandwritingKind, InkStroke } from "../../types/handwriting";
import { getHandwritingWords, loadHandwritingProgress, markHandwritingPracticed } from "../../utils/handwriting";
import "../../styles/handwriting.css";

export function HandwritingMode({ onHome }: { onHome: () => void }) {
  const [kind, setKind] = useState<HandwritingKind>("prefecture");
  const [regionId, setRegionId] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [ink, setInk] = useState<InkStroke[][]>([]);
  const [finishedCharacters, setFinishedCharacters] = useState<number[]>([]);
  const [showGuide, setShowGuide] = useState(true);
  const [penWidth, setPenWidth] = useState(0.017);
  const [progress, setProgress] = useState(loadHandwritingProgress);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const words = getHandwritingWords(kind, regionId || undefined);
  const word = words[wordIndex];
  const characters = [...word.text];
  const strokes = ink[characterIndex] ?? [];
  const practiced = words.filter(w => progress[kind].includes(w.prefectureId)).length;

  const resetWord = (index: number) => {
    setWordIndex(index);
    setCharacterIndex(0);
    setInk([]);
    setFinishedCharacters([]);
    setMessage("");
    setComplete(false);
  };

  const updateInk = (next: InkStroke[]) => {
    setInk(previous => {
      const updated = [...previous];
      updated[characterIndex] = next;
      return updated;
    });
    setComplete(false);
    setMessage("");
    setFinishedCharacters(previous => previous.filter(index => index !== characterIndex));
  };

  const finishCharacter = () => {
    if (!strokes.length) return;
    const done = [...new Set([...finishedCharacters, characterIndex])];
    setFinishedCharacters(done);
    if (done.length === characters.length) {
      const result = markHandwritingPracticed(kind, word.prefectureId);
      setProgress(previous => result.saved ? result.progress : {
        prefecture: [...new Set([...previous.prefecture, ...result.progress.prefecture])],
        capital: [...new Set([...previous.capital, ...result.progress.capital])]
      });
      setComplete(true);
      setMessage(result.saved ? "ぜんぶ書けたね！ 練習のきろくをのこしたよ。" : "ぜんぶ書けたね！ このブラウザではきろくをのこせないよ。");
    } else {
      const next = characters.findIndex((_, index) => !done.includes(index));
      setCharacterIndex(next);
      setMessage("いいね！ 次の文字も書いてみよう。");
    }
  };

  return <main className="handwriting-screen">
    <HeaderBar onHome={onHome}>
      <button type="button" className="secondary-button compact-button" onClick={onHome}>モードを選ぶ</button>
    </HeaderBar>
    <div className="handwriting-content">
      <section className="handwriting-choices" aria-label="練習する名前を選ぶ">
        <div className="handwriting-heading"><h1>なぞりがき</h1><span>書いた名前 {practiced} / {words.length}</span></div>
        <div className="handwriting-kind" role="group" aria-label="名前のしゅるい">
          <button type="button" aria-pressed={kind === "prefecture"} onClick={() => { if (kind !== "prefecture") { setKind("prefecture"); resetWord(0); } }}>都道府県名</button>
          <button type="button" aria-label="県庁所在地の市名" aria-pressed={kind === "capital"} onClick={() => { if (kind !== "capital") { setKind("capital"); resetWord(0); } }}>
            市名
          </button>
        </div>
        <div className="handwriting-selects">
          <label>地方<select aria-label="地方" value={regionId} onChange={event => { setRegionId(event.target.value); resetWord(0); }}>
            <option value="">全国</option>{regions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
          </select></label>
          <label>名前<select aria-label="練習する名前" value={wordIndex} onChange={event => resetWord(Number(event.target.value))}>
            {words.map((item, index) => <option key={item.prefectureId} value={index}>
              {progress[kind].includes(item.prefectureId) ? "✓ " : ""}{item.text}（{item.kana}）
            </option>)}
          </select></label>
        </div>
      </section>

      <section className="handwriting-workspace" aria-label="書き取りの練習">
        <div className="handwriting-word">
          <h2><ruby>{word.text}<rt>{word.kana}</rt></ruby></h2>
          <p className={kind === "capital" ? "capital-context" : undefined}>{kind === "capital" ? <><ruby>{word.prefectureName}<rt>{word.prefectureKana}</rt></ruby>の<ruby>県庁所在地<rt>けんちょうしょざいち</rt></ruby></> : "名前を1文字ずつ書こう"}</p>
        </div>
        <div className="handwriting-characters" role="group" aria-label="文字を選ぶ">
          {characters.map((character, index) => <button type="button" key={index}
            className={index === characterIndex ? "is-current" : ""}
            aria-label={`${index + 1}文字目 ${character}${finishedCharacters.includes(index) ? " 書けた" : ""}`}
            aria-pressed={index === characterIndex}
            onClick={() => { setCharacterIndex(index); setMessage(""); }}>
            {character}<span className="character-done" aria-hidden="true">{finishedCharacters.includes(index) ? "✓" : ""}</span>
          </button>)}
        </div>
        <div className="handwriting-paper">
          <TracingCanvas key={`${kind}:${word.prefectureId}:${characterIndex}`}
            character={characters[characterIndex]} strokes={strokes} showGuide={showGuide} penWidth={penWidth} onChange={updateInk} />
        </div>
        <div className="handwriting-tools">
          <label className="handwriting-guide"><input type="checkbox" checked={showGuide} onChange={event => setShowGuide(event.target.checked)} />お手本</label>
          <label className="handwriting-width">太さ<input aria-label="線の太さ" type="range" min="10" max="25" step="1" value={Math.round(penWidth * 1000)} onChange={event => setPenWidth(Number(event.target.value) / 1000)} /></label>
          <button type="button" className="secondary-button" disabled={!strokes.length} aria-label="1画もどす" title="1画もどす" onClick={() => updateInk(strokes.slice(0, -1))}><span aria-hidden="true">↶</span></button>
          <button type="button" className="secondary-button handwriting-clear" disabled={!strokes.length} onClick={() => updateInk([])}>書き直す</button>
        </div>
        <div className="handwriting-bottom">
          <p className="handwriting-feedback" role="status">{message || `${characterIndex + 1} / ${characters.length}文字`}</p>
          {complete ? <div className="handwriting-next-actions">
            <button type="button" className="secondary-button" onClick={() => resetWord(wordIndex)}>もう一回</button>
            <button type="button" className="primary-button" onClick={() => resetWord((wordIndex + 1) % words.length)}>次の名前へ →</button>
          </div> : <button type="button" className="primary-button handwriting-done" disabled={!strokes.length} onClick={finishCharacter}>書けた！ {characterIndex + 1 < characters.length ? "→" : "✓"}</button>}
        </div>
      </section>
    </div>
  </main>;
}

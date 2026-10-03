# パズルでおぼえる「都道府県」

小学校4年生向けに、日本の47都道府県の名称・形・位置をパズル形式で学ぶWebアプリです。

## 起動方法

```bash
npm install
npm run dev
```

ビルド確認:

```bash
npm run build
```

GitHub Pages用ビルド:

```bash
npm run build:pages
```

テスト:

```bash
npm test
```

都道府県SVGパスの再生成:

```bash
npm run generate:prefectures
```

## 実装内容

- 全国ハードモード: 地方色・赤いガイドなしで47ピースに挑戦。既存の全国ベスト記録と称号に対応
- 全国カラーモード: 地方色をヒントに47ピースへ挑戦。ベスト記録はハードと別に保存、称号なし
- 全国 覚えるモード: 赤いガイドを見ながら形と場所を練習
- 地方別タイムアタック: 6地方ごとにガイドなしで挑戦
- 地方別 覚えるモード: 6地方ごとに赤いガイドつきで練習
- 県庁所在地モード: 県名から市名、市名から県名を選ぶ4択クイズ
- 県名と所在地名が違う県だけを練習する6択とっくん
- タイムアタック、カウントダウン、ミス回数、自己ベスト保存
- 全国ハードモードのクリア時のみ称号・次の称号までの秒数表示
- `100dvh` レイアウト、ページ全体の縦スクロール防止
- SVG `viewBox` による全国表示・地方表示・都道府県フォーカス
- ピース選択時の対象地方への自動フォーカス
- 下部ピーストレイの横スクロール
- localStorage によるモード別・地方別ベストタイム保存
- 初回のみの遊び方、音ON/OFF、主要陸地を基準にした形ベースの吸着
- PWA・ホーム画面追加・初回ロード後のオフライン起動

## 公開とオフライン対応

公開入口は https://kou-no1.github.io/todofuken/ です。GitHub Pagesの独自ドメイン設定で転送されても、`/todofuken/` から `docs/index.html` を開けます。

`build` / `build:pages` は現在のHTML・JS・CSS・アイコンからキャッシュのバージョンと事前保存リストを生成します。Pagesではルートの `sw.js` を登録し、`/todofuken/` をスコープにします。manifestは `docs/manifest.webmanifest`、アイコンは `docs/icons/` を参照します。新バージョンの全ファイルの保存が成功してから旧キャッシュを削除し、プレイ中の強制リロードはしません。開発サーバーではService Workerを登録しません。

## ブラウザ検証と紹介動画

- 全体監査: `AUDIT-2026-10-03.md`
- 実描画SVGのドラッグ回帰: `node scripts/audit-browser.mjs`
- モード・クイズ・保存不能環境・キーボード: `node scripts/audit-ui.mjs`
- Pagesと同じサブパスでのオフライン検証: `node scripts/audit-pwa.mjs`（先に `npm run build:pages`）
- 公開版確認: `node --use-system-ca scripts/audit-public.mjs`
- Shortsの構成・投稿文: `SHORTS-PLAN.md`

ブラウザ検証・録画にはPlaywrightとChromiumを使用します。通常は別途Playwrightをインストールし、必要なら `BROWSER_NODE_MODULES` / `CHROME_PATH` で実行環境を指定してください。ドラッグ検証と録画は `npm run dev -- --port 5174` に対して実行します。結果・スクリーンショット・動画は `artifacts/` に保存し、Gitには含めません。

動画は `node scripts/record-short.mjs` で実際に操作を録画し、Pillow・imageio-ffmpegを用意したPythonで `scripts/edit-short.py` を実行して編集します。日本語フォントは `VIDEO_FONT`、FFmpegは `FFMPEG_PATH` で指定できます。

## 地図データ

都道府県の形状は、国土数値情報由来の高解像度GeoJSONをもとに、アプリ用の軽量SVGパスへ変換しています。

- 変換スクリプト: `scripts/generate-prefecture-paths.cjs`
- 生成先: `src/data/prefectures.ts`
- 出典とライセンス: `THIRD_PARTY_NOTICES.md`

ブラウザ上で扱いやすくするため、細かすぎる点列と一部の小離島は学習用に簡略化しています。四角いタイル型のデフォルメではなく、実際の都道府県境界に近い輪郭を使っています。

## データ構成

- `src/data/prefectures.ts`: 47都道府県のSVGパス、中心点、県庁所在地
- `src/data/regions.ts`: 指定された6地方区分と自動計算bbox
- `src/data/capitals.ts`: 県庁所在地クイズ用データ
- `src/utils/capitalQuiz.ts`: 同地方中心の選択肢生成、逆向き出題、とっくん判定
- `src/data/timeTitles.ts`: タイム称号データ

## 地方区分

- 北海道・東北地方: 7
- 関東地方: 7
- 中部地方: 9
- 近畿地方: 7
- 中国・四国地方: 9
- 九州・沖縄地方: 8

北陸地方は単独モードにせず、新潟県・富山県・石川県・福井県は中部地方に含めています。中国地方と四国地方は「中国・四国地方」として統合しています。

## 残タスク

- TODO: 県庁所在地ラベルを県に置くフェーズ2の完成
- TODO: 県庁所在地付近にピンを置くフェーズ3の完成
- TODO: 県名の読み上げ、キーボードだけでのピース配置
- TODO: 地図の再生成時にdragBbox・琵琶湖の個別調整を保持する仕組み
- TODO: iOS実機のセーフエリア・学校のChromebook実機の操作確認

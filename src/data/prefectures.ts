import type { Prefecture } from "../types/puzzle";

type PrefectureRow = {
  id: string;
  name: string;
  kana: string;
  regionId: string;
  capital: string;
  capitalKana: string;
  x: number;
  y: number;
  width: number;
  height: number;
  variant: number;
};

function makeTilePath(x: number, y: number, width: number, height: number, variant: number): string {
  const v = variant % 5;

  if (v === 1) {
    return `M ${x + 10} ${y} L ${x + width - 2} ${y + 8} L ${x + width - 10} ${y + height} L ${x + 2} ${y + height - 6} L ${x} ${y + 14} Z`;
  }

  if (v === 2) {
    return `M ${x + 6} ${y + 5} L ${x + width - 12} ${y} L ${x + width} ${y + height * 0.45} L ${x + width - 7} ${y + height} L ${x + 9} ${y + height - 2} L ${x} ${y + height * 0.36} Z`;
  }

  if (v === 3) {
    return `M ${x} ${y + 10} L ${x + width * 0.72} ${y} L ${x + width} ${y + 13} L ${x + width - 4} ${y + height - 8} L ${x + width * 0.32} ${y + height} L ${x + 4} ${y + height - 15} Z`;
  }

  if (v === 4) {
    return `M ${x + 12} ${y + 3} L ${x + width - 4} ${y} L ${x + width} ${y + height - 14} L ${x + width - 18} ${y + height} L ${x + 3} ${y + height - 4} L ${x} ${y + 8} Z`;
  }

  return `M ${x + 8} ${y} L ${x + width - 6} ${y + 3} L ${x + width} ${y + height - 10} L ${x + width - 11} ${y + height} L ${x + 4} ${y + height - 4} L ${x} ${y + 11} Z`;
}

const rows: PrefectureRow[] = [
  { id: "hokkaido", name: "北海道", kana: "ほっかいどう", regionId: "hokkaido-tohoku", capital: "札幌市", capitalKana: "さっぽろし", x: 940, y: 40, width: 190, height: 110, variant: 0 },
  { id: "aomori", name: "青森県", kana: "あおもりけん", regionId: "hokkaido-tohoku", capital: "青森市", capitalKana: "あおもりし", x: 885, y: 180, width: 90, height: 50, variant: 1 },
  { id: "iwate", name: "岩手県", kana: "いわてけん", regionId: "hokkaido-tohoku", capital: "盛岡市", capitalKana: "もりおかし", x: 940, y: 230, width: 75, height: 70, variant: 2 },
  { id: "miyagi", name: "宮城県", kana: "みやぎけん", regionId: "hokkaido-tohoku", capital: "仙台市", capitalKana: "せんだいし", x: 920, y: 305, width: 70, height: 55, variant: 3 },
  { id: "akita", name: "秋田県", kana: "あきたけん", regionId: "hokkaido-tohoku", capital: "秋田市", capitalKana: "あきたし", x: 860, y: 235, width: 70, height: 70, variant: 4 },
  { id: "yamagata", name: "山形県", kana: "やまがたけん", regionId: "hokkaido-tohoku", capital: "山形市", capitalKana: "やまがたし", x: 855, y: 310, width: 65, height: 55, variant: 0 },
  { id: "fukushima", name: "福島県", kana: "ふくしまけん", regionId: "hokkaido-tohoku", capital: "福島市", capitalKana: "ふくしまし", x: 845, y: 370, width: 95, height: 60, variant: 1 },
  { id: "ibaraki", name: "茨城県", kana: "いばらきけん", regionId: "kanto", capital: "水戸市", capitalKana: "みとし", x: 870, y: 440, width: 65, height: 70, variant: 2 },
  { id: "tochigi", name: "栃木県", kana: "とちぎけん", regionId: "kanto", capital: "宇都宮市", capitalKana: "うつのみやし", x: 805, y: 430, width: 70, height: 60, variant: 3 },
  { id: "gunma", name: "群馬県", kana: "ぐんまけん", regionId: "kanto", capital: "前橋市", capitalKana: "まえばしし", x: 735, y: 435, width: 70, height: 60, variant: 4 },
  { id: "saitama", name: "埼玉県", kana: "さいたまけん", regionId: "kanto", capital: "さいたま市", capitalKana: "さいたまし", x: 775, y: 495, width: 80, height: 42, variant: 0 },
  { id: "chiba", name: "千葉県", kana: "ちばけん", regionId: "kanto", capital: "千葉市", capitalKana: "ちばし", x: 865, y: 510, width: 55, height: 80, variant: 1 },
  { id: "tokyo", name: "東京都", kana: "とうきょうと", regionId: "kanto", capital: "新宿区", capitalKana: "しんじゅくく", x: 800, y: 540, width: 50, height: 35, variant: 2 },
  { id: "kanagawa", name: "神奈川県", kana: "かながわけん", regionId: "kanto", capital: "横浜市", capitalKana: "よこはまし", x: 755, y: 565, width: 70, height: 40, variant: 3 },
  { id: "niigata", name: "新潟県", kana: "にいがたけん", regionId: "chubu", capital: "新潟市", capitalKana: "にいがたし", x: 680, y: 360, width: 150, height: 55, variant: 4 },
  { id: "toyama", name: "富山県", kana: "とやまけん", regionId: "chubu", capital: "富山市", capitalKana: "とやまし", x: 615, y: 425, width: 70, height: 45, variant: 0 },
  { id: "ishikawa", name: "石川県", kana: "いしかわけん", regionId: "chubu", capital: "金沢市", capitalKana: "かなざわし", x: 550, y: 415, width: 65, height: 75, variant: 1 },
  { id: "fukui", name: "福井県", kana: "ふくいけん", regionId: "chubu", capital: "福井市", capitalKana: "ふくいし", x: 525, y: 495, width: 70, height: 50, variant: 2 },
  { id: "yamanashi", name: "山梨県", kana: "やまなしけん", regionId: "chubu", capital: "甲府市", capitalKana: "こうふし", x: 690, y: 515, width: 70, height: 55, variant: 3 },
  { id: "nagano", name: "長野県", kana: "ながのけん", regionId: "chubu", capital: "長野市", capitalKana: "ながのし", x: 680, y: 435, width: 90, height: 80, variant: 4 },
  { id: "gifu", name: "岐阜県", kana: "ぎふけん", regionId: "chubu", capital: "岐阜市", capitalKana: "ぎふし", x: 595, y: 510, width: 85, height: 75, variant: 0 },
  { id: "shizuoka", name: "静岡県", kana: "しずおかけん", regionId: "chubu", capital: "静岡市", capitalKana: "しずおかし", x: 665, y: 585, width: 120, height: 45, variant: 1 },
  { id: "aichi", name: "愛知県", kana: "あいちけん", regionId: "chubu", capital: "名古屋市", capitalKana: "なごやし", x: 585, y: 590, width: 80, height: 55, variant: 2 },
  { id: "mie", name: "三重県", kana: "みえけん", regionId: "kinki", capital: "津市", capitalKana: "つし", x: 565, y: 645, width: 70, height: 90, variant: 3 },
  { id: "shiga", name: "滋賀県", kana: "しがけん", regionId: "kinki", capital: "大津市", capitalKana: "おおつし", x: 515, y: 565, width: 60, height: 60, variant: 4 },
  { id: "kyoto", name: "京都府", kana: "きょうとふ", regionId: "kinki", capital: "京都市", capitalKana: "きょうとし", x: 460, y: 555, width: 65, height: 60, variant: 0 },
  { id: "osaka", name: "大阪府", kana: "おおさかふ", regionId: "kinki", capital: "大阪市", capitalKana: "おおさかし", x: 465, y: 625, width: 50, height: 50, variant: 1 },
  { id: "hyogo", name: "兵庫県", kana: "ひょうごけん", regionId: "kinki", capital: "神戸市", capitalKana: "こうべし", x: 390, y: 555, width: 75, height: 80, variant: 2 },
  { id: "nara", name: "奈良県", kana: "ならけん", regionId: "kinki", capital: "奈良市", capitalKana: "ならし", x: 520, y: 625, width: 50, height: 70, variant: 3 },
  { id: "wakayama", name: "和歌山県", kana: "わかやまけん", regionId: "kinki", capital: "和歌山市", capitalKana: "わかやまし", x: 480, y: 700, width: 85, height: 55, variant: 4 },
  { id: "tottori", name: "鳥取県", kana: "とっとりけん", regionId: "chugoku-shikoku", capital: "鳥取市", capitalKana: "とっとりし", x: 310, y: 535, width: 90, height: 45, variant: 0 },
  { id: "shimane", name: "島根県", kana: "しまねけん", regionId: "chugoku-shikoku", capital: "松江市", capitalKana: "まつえし", x: 210, y: 535, width: 100, height: 50, variant: 1 },
  { id: "okayama", name: "岡山県", kana: "おかやまけん", regionId: "chugoku-shikoku", capital: "岡山市", capitalKana: "おかやまし", x: 325, y: 585, width: 75, height: 55, variant: 2 },
  { id: "hiroshima", name: "広島県", kana: "ひろしまけん", regionId: "chugoku-shikoku", capital: "広島市", capitalKana: "ひろしまし", x: 245, y: 590, width: 85, height: 60, variant: 3 },
  { id: "yamaguchi", name: "山口県", kana: "やまぐちけん", regionId: "chugoku-shikoku", capital: "山口市", capitalKana: "やまぐちし", x: 160, y: 610, width: 85, height: 65, variant: 4 },
  { id: "tokushima", name: "徳島県", kana: "とくしまけん", regionId: "chugoku-shikoku", capital: "徳島市", capitalKana: "とくしまし", x: 385, y: 690, width: 70, height: 50, variant: 0 },
  { id: "kagawa", name: "香川県", kana: "かがわけん", regionId: "chugoku-shikoku", capital: "高松市", capitalKana: "たかまつし", x: 370, y: 645, width: 65, height: 35, variant: 1 },
  { id: "ehime", name: "愛媛県", kana: "えひめけん", regionId: "chugoku-shikoku", capital: "松山市", capitalKana: "まつやまし", x: 285, y: 685, width: 85, height: 55, variant: 2 },
  { id: "kochi", name: "高知県", kana: "こうちけん", regionId: "chugoku-shikoku", capital: "高知市", capitalKana: "こうちし", x: 310, y: 740, width: 110, height: 50, variant: 3 },
  { id: "fukuoka", name: "福岡県", kana: "ふくおかけん", regionId: "kyushu-okinawa", capital: "福岡市", capitalKana: "ふくおかし", x: 185, y: 700, width: 80, height: 55, variant: 4 },
  { id: "saga", name: "佐賀県", kana: "さがけん", regionId: "kyushu-okinawa", capital: "佐賀市", capitalKana: "さがし", x: 120, y: 725, width: 65, height: 50, variant: 0 },
  { id: "nagasaki", name: "長崎県", kana: "ながさきけん", regionId: "kyushu-okinawa", capital: "長崎市", capitalKana: "ながさきし", x: 80, y: 775, width: 70, height: 60, variant: 1 },
  { id: "kumamoto", name: "熊本県", kana: "くまもとけん", regionId: "kyushu-okinawa", capital: "熊本市", capitalKana: "くまもとし", x: 160, y: 790, width: 80, height: 75, variant: 2 },
  { id: "oita", name: "大分県", kana: "おおいたけん", regionId: "kyushu-okinawa", capital: "大分市", capitalKana: "おおいたし", x: 245, y: 760, width: 70, height: 60, variant: 3 },
  { id: "miyazaki", name: "宮崎県", kana: "みやざきけん", regionId: "kyushu-okinawa", capital: "宮崎市", capitalKana: "みやざきし", x: 215, y: 835, width: 70, height: 80, variant: 4 },
  { id: "kagoshima", name: "鹿児島県", kana: "かごしまけん", regionId: "kyushu-okinawa", capital: "鹿児島市", capitalKana: "かごしまし", x: 135, y: 870, width: 90, height: 75, variant: 0 },
  { id: "okinawa", name: "沖縄県", kana: "おきなわけん", regionId: "kyushu-okinawa", capital: "那覇市", capitalKana: "なはし", x: 20, y: 880, width: 75, height: 38, variant: 1 }
];

export const prefectures: Prefecture[] = rows.map((row) => {
  const bbox = { x: row.x, y: row.y, width: row.width, height: row.height };
  const centroid = { x: row.x + row.width / 2, y: row.y + row.height / 2 };

  return {
    id: row.id,
    name: row.name,
    kana: row.kana,
    regionId: row.regionId,
    capital: row.capital,
    capitalKana: row.capitalKana,
    path: makeTilePath(row.x, row.y, row.width, row.height, row.variant),
    centroid,
    capitalPoint: { x: centroid.x + row.width * 0.08, y: centroid.y - row.height * 0.08 },
    bbox
  };
});

export const prefectureById = new Map(prefectures.map((prefecture) => [prefecture.id, prefecture]));

export const JAPAN_BBOX = { x: 0, y: 20, width: 1160, height: 950 };

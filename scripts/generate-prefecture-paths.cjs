const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");

const SOURCE_URL =
  "https://raw.githubusercontent.com/piuccio/open-data-jp-prefectures-geojson/master/output/prefectures.geojson";
const SOURCE_PATH = path.join(process.cwd(), "prefectures.source.geojson");
const OUTPUT_PATH = path.join(process.cwd(), "src", "data", "prefectures.ts");

const CANVAS = { width: 1160, height: 950, padding: 30 };
const KEEP_POLYGON_RATIO = 0.02;
const SIMPLIFY_TOLERANCE = 1.25;
const PRECISION = 1;

const PREFECTURE_META = [
  ["hokkaido", "北海道", "ほっかいどう", "hokkaido-tohoku", "札幌市", "さっぽろし"],
  ["aomori", "青森県", "あおもりけん", "hokkaido-tohoku", "青森市", "あおもりし"],
  ["iwate", "岩手県", "いわてけん", "hokkaido-tohoku", "盛岡市", "もりおかし"],
  ["miyagi", "宮城県", "みやぎけん", "hokkaido-tohoku", "仙台市", "せんだいし"],
  ["akita", "秋田県", "あきたけん", "hokkaido-tohoku", "秋田市", "あきたし"],
  ["yamagata", "山形県", "やまがたけん", "hokkaido-tohoku", "山形市", "やまがたし"],
  ["fukushima", "福島県", "ふくしまけん", "hokkaido-tohoku", "福島市", "ふくしまし"],
  ["ibaraki", "茨城県", "いばらきけん", "kanto", "水戸市", "みとし"],
  ["tochigi", "栃木県", "とちぎけん", "kanto", "宇都宮市", "うつのみやし"],
  ["gunma", "群馬県", "ぐんまけん", "kanto", "前橋市", "まえばしし"],
  ["saitama", "埼玉県", "さいたまけん", "kanto", "さいたま市", "さいたまし"],
  ["chiba", "千葉県", "ちばけん", "kanto", "千葉市", "ちばし"],
  ["tokyo", "東京都", "とうきょうと", "kanto", "新宿区", "しんじゅくく"],
  ["kanagawa", "神奈川県", "かながわけん", "kanto", "横浜市", "よこはまし"],
  ["niigata", "新潟県", "にいがたけん", "chubu", "新潟市", "にいがたし"],
  ["toyama", "富山県", "とやまけん", "chubu", "富山市", "とやまし"],
  ["ishikawa", "石川県", "いしかわけん", "chubu", "金沢市", "かなざわし"],
  ["fukui", "福井県", "ふくいけん", "chubu", "福井市", "ふくいし"],
  ["yamanashi", "山梨県", "やまなしけん", "chubu", "甲府市", "こうふし"],
  ["nagano", "長野県", "ながのけん", "chubu", "長野市", "ながのし"],
  ["gifu", "岐阜県", "ぎふけん", "chubu", "岐阜市", "ぎふし"],
  ["shizuoka", "静岡県", "しずおかけん", "chubu", "静岡市", "しずおかし"],
  ["aichi", "愛知県", "あいちけん", "chubu", "名古屋市", "なごやし"],
  ["mie", "三重県", "みえけん", "kinki", "津市", "つし"],
  ["shiga", "滋賀県", "しがけん", "kinki", "大津市", "おおつし"],
  ["kyoto", "京都府", "きょうとふ", "kinki", "京都市", "きょうとし"],
  ["osaka", "大阪府", "おおさかふ", "kinki", "大阪市", "おおさかし"],
  ["hyogo", "兵庫県", "ひょうごけん", "kinki", "神戸市", "こうべし"],
  ["nara", "奈良県", "ならけん", "kinki", "奈良市", "ならし"],
  ["wakayama", "和歌山県", "わかやまけん", "kinki", "和歌山市", "わかやまし"],
  ["tottori", "鳥取県", "とっとりけん", "chugoku-shikoku", "鳥取市", "とっとりし"],
  ["shimane", "島根県", "しまねけん", "chugoku-shikoku", "松江市", "まつえし"],
  ["okayama", "岡山県", "おかやまけん", "chugoku-shikoku", "岡山市", "おかやまし"],
  ["hiroshima", "広島県", "ひろしまけん", "chugoku-shikoku", "広島市", "ひろしまし"],
  ["yamaguchi", "山口県", "やまぐちけん", "chugoku-shikoku", "山口市", "やまぐちし"],
  ["tokushima", "徳島県", "とくしまけん", "chugoku-shikoku", "徳島市", "とくしまし"],
  ["kagawa", "香川県", "かがわけん", "chugoku-shikoku", "高松市", "たかまつし"],
  ["ehime", "愛媛県", "えひめけん", "chugoku-shikoku", "松山市", "まつやまし"],
  ["kochi", "高知県", "こうちけん", "chugoku-shikoku", "高知市", "こうちし"],
  ["fukuoka", "福岡県", "ふくおかけん", "kyushu-okinawa", "福岡市", "ふくおかし"],
  ["saga", "佐賀県", "さがけん", "kyushu-okinawa", "佐賀市", "さがし"],
  ["nagasaki", "長崎県", "ながさきけん", "kyushu-okinawa", "長崎市", "ながさきし"],
  ["kumamoto", "熊本県", "くまもとけん", "kyushu-okinawa", "熊本市", "くまもとし"],
  ["oita", "大分県", "おおいたけん", "kyushu-okinawa", "大分市", "おおいたし"],
  ["miyazaki", "宮崎県", "みやざきけん", "kyushu-okinawa", "宮崎市", "みやざきし"],
  ["kagoshima", "鹿児島県", "かごしまけん", "kyushu-okinawa", "鹿児島市", "かごしまし"],
  ["okinawa", "沖縄県", "おきなわけん", "kyushu-okinawa", "那覇市", "なはし"]
];

async function downloadSource() {
  if (fs.existsSync(SOURCE_PATH)) {
    return;
  }

  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(SOURCE_PATH);
    https
      .get(SOURCE_URL, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode}`));
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", reject);
  });
}

function polygonsOfGeometry(geometry) {
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }

  return [];
}

function ringArea(ring) {
  let area = 0;

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [x1, y1] = ring[previous];
    const [x2, y2] = ring[index];
    area += x1 * y2 - x2 * y1;
  }

  return Math.abs(area) / 2;
}

function choosePolygons(feature) {
  const polygons = polygonsOfGeometry(feature.geometry).map((polygon) => ({
    polygon,
    area: ringArea(polygon[0])
  }));
  const maxArea = Math.max(...polygons.map((item) => item.area));

  return polygons
    .filter((item, index) => index === 0 || item.area >= maxArea * KEEP_POLYGON_RATIO)
    .map((item) => item.polygon);
}

function collectBounds(featuresByName) {
  const bounds = { minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity };

  for (const [, name] of PREFECTURE_META) {
    const feature = featuresByName.get(name);
    const polygons = choosePolygons(feature);

    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          bounds.minLon = Math.min(bounds.minLon, lon);
          bounds.maxLon = Math.max(bounds.maxLon, lon);
          bounds.minLat = Math.min(bounds.minLat, lat);
          bounds.maxLat = Math.max(bounds.maxLat, lat);
        }
      }
    }
  }

  return bounds;
}

function createProjector(bounds) {
  const drawableWidth = CANVAS.width - CANVAS.padding * 2;
  const drawableHeight = CANVAS.height - CANVAS.padding * 2;
  const xScale = drawableWidth / (bounds.maxLon - bounds.minLon);
  const yScale = drawableHeight / (bounds.maxLat - bounds.minLat);
  const scale = Math.min(xScale, yScale);
  const usedWidth = (bounds.maxLon - bounds.minLon) * scale;
  const usedHeight = (bounds.maxLat - bounds.minLat) * scale;
  const xOffset = CANVAS.padding + (drawableWidth - usedWidth) / 2;
  const yOffset = CANVAS.padding + (drawableHeight - usedHeight) / 2;

  return ([lon, lat]) => ({
    x: xOffset + (lon - bounds.minLon) * scale,
    y: yOffset + (bounds.maxLat - lat) * scale
  });
}

function getSqDistance(pointA, pointB) {
  const dx = pointA.x - pointB.x;
  const dy = pointA.y - pointB.y;
  return dx * dx + dy * dy;
}

function getSqSegmentDistance(point, pointA, pointB) {
  let x = pointA.x;
  let y = pointA.y;
  let dx = pointB.x - x;
  let dy = pointB.y - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((point.x - x) * dx + (point.y - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = pointB.x;
      y = pointB.y;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = point.x - x;
  dy = point.y - y;
  return dx * dx + dy * dy;
}

function simplifyRadialDistance(points, sqTolerance) {
  let previous = points[0];
  const simplified = [previous];

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];

    if (getSqDistance(point, previous) > sqTolerance) {
      simplified.push(point);
      previous = point;
    }
  }

  if (previous !== points[points.length - 1]) {
    simplified.push(points[points.length - 1]);
  }

  return simplified;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
  let maxSqDistance = sqTolerance;
  let index = 0;

  for (let current = first + 1; current < last; current += 1) {
    const sqDistance = getSqSegmentDistance(points[current], points[first], points[last]);

    if (sqDistance > maxSqDistance) {
      index = current;
      maxSqDistance = sqDistance;
    }
  }

  if (maxSqDistance > sqTolerance) {
    if (index - first > 1) {
      simplifyDPStep(points, first, index, sqTolerance, simplified);
    }

    simplified.push(points[index]);

    if (last - index > 1) {
      simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
  }
}

function simplifyDouglasPeucker(points, sqTolerance) {
  const last = points.length - 1;
  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);
  return simplified;
}

function simplifyRing(projectedRing) {
  const points = [...projectedRing];
  const first = points[0];
  const last = points[points.length - 1];

  if (first && last && first.x === last.x && first.y === last.y) {
    points.pop();
  }

  if (points.length <= 8) {
    return points;
  }

  const sqTolerance = SIMPLIFY_TOLERANCE * SIMPLIFY_TOLERANCE;
  const radial = simplifyRadialDistance(points, sqTolerance);
  return simplifyDouglasPeucker(radial, sqTolerance);
}

function round(value) {
  return Number(value.toFixed(PRECISION));
}

function ringToPath(ring) {
  const [first, ...rest] = ring;
  return `M ${round(first.x)} ${round(first.y)} ${rest.map((point) => `L ${round(point.x)} ${round(point.y)}`).join(" ")} Z`;
}

function calculateBBox(rings) {
  const points = rings.flat();
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));

  return {
    x: round(minX),
    y: round(minY),
    width: round(maxX - minX),
    height: round(maxY - minY)
  };
}

function calculateCentroid(rings) {
  const outerRing = rings.reduce((largest, ring) => (ring.length > largest.length ? ring : largest), rings[0]);
  let twiceArea = 0;
  let x = 0;
  let y = 0;

  for (let index = 0, previous = outerRing.length - 1; index < outerRing.length; previous = index, index += 1) {
    const a = outerRing[previous];
    const b = outerRing[index];
    const cross = a.x * b.y - b.x * a.y;
    twiceArea += cross;
    x += (a.x + b.x) * cross;
    y += (a.y + b.y) * cross;
  }

  if (twiceArea === 0) {
    const bbox = calculateBBox(rings);
    return { x: round(bbox.x + bbox.width / 2), y: round(bbox.y + bbox.height / 2) };
  }

  return {
    x: round(x / (3 * twiceArea)),
    y: round(y / (3 * twiceArea))
  };
}

function buildPrefecture(feature, meta, project) {
  const [id, name, kana, regionId, capital, capitalKana] = meta;
  const rings = choosePolygons(feature)
    .flatMap((polygon) => polygon)
    .map((ring) => simplifyRing(ring.map(project)))
    .filter((ring) => ring.length >= 3);
  const bbox = calculateBBox(rings);
  const centroid = calculateCentroid(rings);
  const pathData = rings.map(ringToPath).join(" ");

  return {
    id,
    name,
    kana,
    regionId,
    capital,
    capitalKana,
    path: pathData,
    centroid,
    capitalPoint: centroid,
    bbox
  };
}

async function main() {
  await downloadSource();
  const geojson = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));
  const featuresByName = new Map(geojson.features.map((feature) => [feature.properties.P, feature]));
  const bounds = collectBounds(featuresByName);
  const project = createProjector(bounds);
  const prefectures = PREFECTURE_META.map((meta) => {
    const feature = featuresByName.get(meta[1]);

    if (!feature) {
      throw new Error(`Missing feature for ${meta[1]}`);
    }

    return buildPrefecture(feature, meta, project);
  });
  const allBoxes = prefectures.map((prefecture) => prefecture.bbox);
  const minX = Math.min(...allBoxes.map((box) => box.x));
  const minY = Math.min(...allBoxes.map((box) => box.y));
  const maxX = Math.max(...allBoxes.map((box) => box.x + box.width));
  const maxY = Math.max(...allBoxes.map((box) => box.y + box.height));
  const japanBBox = { x: round(minX), y: round(minY), width: round(maxX - minX), height: round(maxY - minY) };

  const output = `import type { Prefecture } from "../types/puzzle";

// Generated by scripts/generate-prefecture-paths.cjs from open-data-jp-prefectures-geojson.
// Source: ${SOURCE_URL}
export const prefectures: Prefecture[] = ${JSON.stringify(prefectures, null, 2)};

export const prefectureById = new Map(prefectures.map((prefecture) => [prefecture.id, prefecture]));

export const JAPAN_BBOX = ${JSON.stringify(japanBBox)};
`;

  fs.writeFileSync(OUTPUT_PATH, output, "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Total SVG path chars: ${prefectures.reduce((sum, prefecture) => sum + prefecture.path.length, 0)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

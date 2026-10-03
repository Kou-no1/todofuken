import { useEffect, useRef, useState } from "react";
import type { PuzzleResult } from "../../types/puzzle";
import { APP_NAME, createResultImage, PUBLIC_APP_URL } from "../../utils/resultImage";

type ResultShareProps = { result: PuzzleResult; totalCount: number };

export function ResultShare({ result, totalCount }: ResultShareProps) {
  const [image, setImage] = useState<{ url: string; file: File; canShare: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const sharingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    setImage(null);
    setMessage("");
    createResultImage(result, totalCount).then((blob) => {
      if (cancelled) return;
      url = URL.createObjectURL(blob);
      const file = new File([blob], `todofuken-${result.mode}-${result.dateKey ?? "result"}.png`, { type: "image/png" });
      let canShare = false;
      try { canShare = typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }); } catch { /* Download remains available. */ }
      setImage({ url, file, canShare });
    }).catch(() => {
      if (!cancelled) setMessage("がぞうを作れませんでした。もう一度ためしてね。");
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [result, totalCount]);

  const shareImage = async () => {
    if (!image || sharingRef.current) return;
    sharingRef.current = true;
    setIsSharing(true);
    setMessage("");
    try {
      // The file is prepared before the click so share() retains user activation.
      await navigator.share({ files: [image.file], title: APP_NAME, text: `日本地図パズル、クリア！ ${PUBLIC_APP_URL}` });
      setMessage("がぞうを共有しました。");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("共有できませんでした。「がぞうをほぞん」を使ってね。");
    } finally {
      sharingRef.current = false;
      setIsSharing(false);
    }
  };

  return (
    <div className="result-share">
      <div className="result-share-actions">
        {image?.canShare ? <button type="button" className="ghost-button" disabled={isSharing} onClick={shareImage}>がぞうを共有</button> : null}
        {image ? <a className="ghost-button" href={image.url} download={image.file.name}>がぞうをほぞん</a>
          : <button type="button" className="ghost-button" disabled>がぞうをじゅんび中</button>}
      </div>
      {message ? <p className="result-share-message" role="status">{message}</p> : null}
    </div>
  );
}

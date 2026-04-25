"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { saveReadingState } from "@/actions/saveReadingState";

const BookReaderScene = dynamic(() => import("./BookReaderScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] min-h-[500px] items-center justify-center rounded-xl bg-gradient-to-b from-[#1d1812] to-[#0a0806] text-sm text-[color:var(--color-ink)]/40">
      Opening book…
    </div>
  ),
});

type Props = {
  bookId: string;
  pdfUrl: string;
  pageCount: number;
  initialPage: number;
  canPersist: boolean;
  spineColor: string;
  title: string;
};

export function BookReader3D(props: Props) {
  const lastSaved = useRef<number>(props.initialPage);
  const timer = useRef<number | null>(null);

  const onPageChange = useCallback(
    (page: number) => {
      if (!props.canPersist) return;
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (page !== lastSaved.current) {
          lastSaved.current = page;
          void saveReadingState({ bookId: props.bookId, lastPage: page });
        }
      }, 1500);
    },
    [props.bookId, props.canPersist],
  );

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  return (
    <BookReaderScene
      pdfUrl={props.pdfUrl}
      pageCount={props.pageCount}
      initialPage={props.initialPage}
      onPageChange={onPageChange}
      spineColor={props.spineColor}
    />
  );
}

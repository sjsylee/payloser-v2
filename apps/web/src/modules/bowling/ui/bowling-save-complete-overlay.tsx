"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ReceiptText, Sparkles } from "lucide-react";

export function BowlingSaveCompleteOverlay({ open }: { open: boolean }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[155] flex items-center justify-center bg-ink/45 px-5 backdrop-blur-sm lg:absolute lg:rounded-[32px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className="relative w-full max-w-[320px] overflow-hidden rounded-[30px] bg-ink p-5 text-white shadow-2xl"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <motion.span
              className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-[#FEE500]/20"
              animate={{ scale: [0.8, 1.08, 1], rotate: [0, 12, 0] }}
              transition={{ duration: 0.72, ease: "easeOut" }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <motion.div
                className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#FEE500] text-ink"
                initial={{ rotate: -8, scale: 0.85 }}
                animate={{ rotate: [0, -5, 4, 0], scale: [0.85, 1.08, 1] }}
                transition={{ duration: 0.62, ease: "easeOut" }}
              >
                <ReceiptText className="h-8 w-8" />
              </motion.div>
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-ink"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.18, type: "spring", stiffness: 520 }}
              >
                <Check className="h-5 w-5 stroke-[3]" />
              </motion.div>
            </div>
            <div className="relative mt-5">
              <motion.p
                className="text-xs font-black text-[#FEE500]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.22 }}
              >
                저장 완료
              </motion.p>
              <motion.h2
                className="mt-1 text-2xl font-black leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16, duration: 0.24 }}
              >
                정산 기록에 쏙 넣었어요
              </motion.h2>
              <motion.p
                className="mt-2 text-sm font-bold leading-5 text-white/62"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.24 }}
              >
                송금 목록과 누적 부담액에 바로 반영됩니다.
              </motion.p>
            </div>
            <div className="relative mt-5 grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }, (_, index) => (
                <motion.span
                  key={index}
                  className="h-2 rounded-full bg-[#FEE500]"
                  initial={{ scaleX: 0, opacity: 0.3 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ delay: 0.16 + index * 0.06, duration: 0.28 }}
                />
              ))}
            </div>
            <motion.div
              className="absolute bottom-5 right-5 text-[#FEE500]"
              initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.32, duration: 0.22 }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

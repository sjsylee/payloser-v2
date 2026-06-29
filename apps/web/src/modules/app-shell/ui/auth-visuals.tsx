import { motion } from "framer-motion";
import { WalletCards } from "lucide-react";
import type { ReactElement } from "react";
import {
  BaseballIcon,
  BowlingIcon,
  PingPongIcon,
} from "@/shared/ui/sport-icons";

export function FloatingMark() {
  return (
    <div className="relative h-11 w-11 overflow-hidden rounded-2xl bg-ink">
      <motion.div
        className="absolute left-2 top-2 h-3.5 w-3.5 rounded-full bg-[#FEE500]"
        animate={{ x: [0, 19, 8, 19, 0], y: [0, 7, 21, 7, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-2 left-2 h-1.5 w-7 rounded-full bg-white/85"
        animate={{ scaleX: [0.5, 1, 0.7, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-2 top-3 h-6 w-1.5 rounded-full bg-strike"
        animate={{ rotate: [-7, 8, -7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function LoginSportToken({
  children,
  className,
  delay = 0,
}: {
  children: ReactElement;
  className: string;
  delay?: number;
}) {
  return (
    <motion.div
      aria-hidden
      className={`grid h-12 w-12 place-items-center shadow-[0_14px_28px_rgba(0,0,0,0.28)] ring-4 ring-[#181716] ${className}`}
      animate={{ y: [0, -6, 0], rotate: [-4, 5, -4] }}
      transition={{
        delay,
        duration: 2.6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

export function LoginHeroVisual() {
  const rows = [
    { name: "김민수", amount: "26,667원", tone: "bg-[#FEE500] text-ink" },
    { name: "강지운", amount: "13,333원", tone: "bg-[#2F7D6D] text-white" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[338px] py-3">
      <div className="mb-3 flex items-center justify-center gap-3">
        <LoginSportToken className="rounded-full bg-[#FFF7EA] text-ink">
          <BaseballIcon className="h-8 w-8" />
        </LoginSportToken>
        <LoginSportToken
          className="rounded-[19px] bg-[#FEE500] text-[#2F7D6D]"
          delay={0.12}
        >
          <BowlingIcon className="h-8 w-8" />
        </LoginSportToken>
        <LoginSportToken
          className="rounded-[19px] bg-[#E84D3D] text-[#E84D3D]"
          delay={0.24}
        >
          <div className="grid h-9 w-9 place-items-center rounded-[14px] bg-[#F8F2E8]">
            <PingPongIcon className="h-8 w-8" />
          </div>
        </LoginSportToken>
      </div>

      <motion.div
        className="relative z-10 overflow-hidden rounded-[32px] bg-[#F8F2E8] p-4 text-ink shadow-[0_26px_60px_rgba(0,0,0,0.34)]"
        animate={{ y: [0, -8, 0], rotate: [-1.2, 1, -1.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-x-0 top-0 h-10 bg-white/58" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#FEE500] shadow-inner">
            <WalletCards className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-ink/48">오늘 정산</p>
            <p className="mt-1 text-2xl font-black tracking-normal">26,667원</p>
          </div>
          <div className="rounded-full bg-ink px-3 py-2 text-xs font-black text-white">
            1스택
          </div>
        </div>

        <div className="relative mt-4 space-y-2.5">
          {rows.map((row, index) => (
            <motion.div
              key={row.name}
              className="flex h-[54px] items-center gap-3 rounded-[22px] bg-white px-3 shadow-[0_8px_20px_rgba(24,23,22,0.08)]"
              animate={{ x: [0, index === 0 ? 4 : -3, 0] }}
              transition={{
                delay: index * 0.18,
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${row.tone}`}
              >
                {row.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black">{row.name}</p>
                <p className="text-[11px] font-bold text-ink/46">볼링비 정산</p>
              </div>
              <p className="rounded-full bg-[#F4EFE6] px-3 py-2 text-sm font-black">
                {row.amount}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="relative mt-3 flex items-center justify-between rounded-[20px] bg-ink px-4 py-3 text-white">
          <span className="text-xs font-black text-white/58">받는 사람</span>
          <span className="text-sm font-black text-[#FEE500]">김민수</span>
        </div>
      </motion.div>
    </div>
  );
}

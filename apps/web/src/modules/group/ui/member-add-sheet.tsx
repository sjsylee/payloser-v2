import { AnimatePresence, motion } from "framer-motion";

export function MemberAddSheet({
  disabled,
  name,
  onChangeName,
  onClose,
  onSubmit,
  open,
}: {
  disabled: boolean;
  name: string;
  onChangeName: (value: string) => void;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  open: boolean;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end bg-ink/35 px-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-sm lg:absolute lg:rounded-[32px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            initial={{ y: 36, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 28, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              void onSubmit();
            }}
            className="w-full rounded-[30px] bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black text-ink/45">멤버</p>
                <h2 className="text-lg font-black">새 친구 추가</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-2xl bg-[#F4F0E8] px-4 text-xs font-black"
              >
                닫기
              </button>
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black text-ink/45">이름</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => onChangeName(event.target.value)}
                className="mt-1 h-12 w-full rounded-2xl border-0 bg-[#F4F0E8] px-3 text-sm font-black outline-none ring-1 ring-transparent transition focus:ring-ink/20"
                placeholder="예: 태현"
              />
            </label>
            <button
              type="submit"
              disabled={disabled || name.trim().length === 0}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-[20px] bg-ink text-sm font-black text-white disabled:opacity-45"
            >
              멤버 추가
            </button>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

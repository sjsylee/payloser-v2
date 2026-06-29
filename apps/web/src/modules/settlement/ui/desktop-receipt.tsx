import { ReceiptText } from "lucide-react";
import { formatWon } from "@/modules/settlement/model/settlement-view";
import type { TransferRow } from "@/modules/settlement/model/settlement-view";

export function DesktopReceipt({
  transferRows,
}: {
  transferRows: TransferRow[];
}) {
  return (
    <div className="rounded-[28px] bg-white p-5 text-ink">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-black text-ink/45">송금 목록</p>
          <h2 className="text-lg font-black">결제자에게 보내기</h2>
        </div>
        <ReceiptText className="h-6 w-6 text-lane" />
      </div>
      <div className="mt-4 space-y-3">
        {transferRows.length === 0 ? (
          <div className="rounded-2xl bg-[#F4F0E8] px-4 py-5 text-center">
            <p className="text-sm font-black">저장된 송금 요청 없음</p>
            <p className="mt-1 text-xs font-bold text-ink/45">
              정산 저장 후 공유 문구를 만들 수 있어요
            </p>
          </div>
        ) : (
          transferRows.map((row) => (
            <div
              key={row.memberId}
              className="flex items-center justify-between rounded-2xl bg-[#F4F0E8] px-4 py-3"
            >
              <span className="text-sm font-black">{row.name}</span>
              <span className="text-sm font-black">
                {formatWon(row.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

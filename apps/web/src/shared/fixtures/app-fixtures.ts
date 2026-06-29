import type {
  RecordItem,
  TransferRow,
} from "@/modules/settlement/model/settlement-view";

export type Member = {
  name: string;
  role: string;
  status: string;
  tone: string;
};

export type BurdenRow = {
  name: string;
  bowling: number;
  rpsLosses: number;
};

export const sampleMembers: Member[] = [
  {
    name: "김민수",
    role: "총무",
    status: "결제 담당",
    tone: "bg-[#FEE500] text-ink",
  },
  {
    name: "강지운",
    role: "멤버",
    status: "볼링 위험",
    tone: "bg-[#2F7D6D] text-white",
  },
  {
    name: "이도윤",
    role: "멤버",
    status: "볼링 조심",
    tone: "bg-[#E84D3D] text-white",
  },
  {
    name: "최하린",
    role: "멤버",
    status: "오늘 합류",
    tone: "bg-ink text-white",
  },
  {
    name: "정지우",
    role: "멤버",
    status: "스핀 연습",
    tone: "bg-[#3B82F6] text-white",
  },
  {
    name: "강태오",
    role: "멤버",
    status: "점수 기복",
    tone: "bg-[#8B5CF6] text-white",
  },
  {
    name: "한유나",
    role: "멤버",
    status: "오늘 합류",
    tone: "bg-[#16A34A] text-white",
  },
  {
    name: "윤건우",
    role: "멤버",
    status: "막판 강함",
    tone: "bg-[#DB2777] text-white",
  },
];

export const sampleRecords: RecordItem[] = [
  {
    id: "record-1",
    title: "볼링 무제한",
    meta: "7게임 · 42스택 · 김민수 결제",
    value: "120,000원",
    kind: "bowling",
  },
];

export const sampleBurdens: BurdenRow[] = [
  { name: "강지운", bowling: 38500, rpsLosses: 2 },
  { name: "김민수", bowling: 22000, rpsLosses: 1 },
  { name: "이도윤", bowling: 14000, rpsLosses: 4 },
  { name: "최하린", bowling: 9000, rpsLosses: 3 },
  { name: "정지우", bowling: 31000, rpsLosses: 0 },
  { name: "강태오", bowling: 18500, rpsLosses: 1 },
  { name: "한유나", bowling: 12000, rpsLosses: 2 },
  { name: "윤건우", bowling: 7000, rpsLosses: 1 },
];

export const sampleTransferRows: TransferRow[] = [
  {
    memberId: "sample-minji",
    name: "강지운",
    toName: "김민수",
    amount: 38500,
    meta: "볼링 4스택",
  },
  {
    memberId: "sample-doyun",
    name: "이도윤",
    toName: "김민수",
    amount: 27000,
    meta: "볼링 2스택",
  },
  {
    memberId: "sample-harin",
    name: "최하린",
    toName: "김민수",
    amount: 9000,
    meta: "볼링 1스택",
  },
  {
    memberId: "sample-jiwoo",
    name: "정지우",
    toName: "김민수",
    amount: 31000,
    meta: "볼링 3스택",
  },
  {
    memberId: "sample-taeo",
    name: "강태오",
    toName: "김민수",
    amount: 18500,
    meta: "볼링 2스택",
  },
  {
    memberId: "sample-yuna",
    name: "한유나",
    toName: "김민수",
    amount: 12000,
    meta: "볼링 1스택",
  },
  {
    memberId: "sample-gunwoo",
    name: "윤건우",
    toName: "김민수",
    amount: 7000,
    meta: "볼링 1스택",
  },
];

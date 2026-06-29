import type { BowlingTeamId } from "./bowling-session";

export function getTeamDisplayName(teamId: BowlingTeamId) {
  const labels: Record<BowlingTeamId, string> = {
    A: "1팀",
    B: "2팀",
    C: "3팀",
  };

  return labels[teamId];
}

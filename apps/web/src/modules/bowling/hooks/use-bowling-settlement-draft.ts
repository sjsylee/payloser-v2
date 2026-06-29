"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ApiGroupMember } from "@/adapters/payloser-api";
import type { BowlingStep } from "@/modules/bowling/model/bowling-flow";
import {
  getLocalDateInputValue,
  toOccurredAtIsoDate,
} from "@/modules/bowling/model/bowling-session";
import {
  readSavedBowlingAmountPresets,
  writeSavedBowlingAmountPresets,
} from "@/modules/bowling/storage/bowling-amount-presets-storage";
import { readSavedBowlingHandicaps } from "@/modules/bowling/storage/bowling-handicap-storage";
import {
  appendBowlingGameDraft,
  buildBowlingGamePreview,
  buildBowlingSettlementSaveInput,
  buildBowlingStackPreview,
  createBowlingGameDraft,
  deleteBowlingGameDraft,
  reconcileBowlingParticipantIds,
  rememberBowlingAmountPreset as buildRememberedBowlingAmountPresets,
  resolveBowlingPayerMemberId,
  selectBowlingParticipants,
  updateBowlingGameDrafts,
} from "@/modules/bowling/model/bowling-draft";
import type {
  BowlingGameDraft,
  BowlingInputMode,
} from "@/modules/bowling/model/bowling-draft";

type UseBowlingSettlementDraftInput = {
  members: ApiGroupMember[];
};

export function useBowlingSettlementDraft({
  members,
}: UseBowlingSettlementDraftInput) {
  const [perPersonAmount, setPerPersonAmount] = useState("20000");
  const [amountPresets, setAmountPresets] = useState([
    "18000",
    "20000",
    "22000",
  ]);
  const [payerMemberId, setPayerMemberId] = useState<string | null>(null);
  const [occurredDate, setOccurredDate] = useState(getLocalDateInputValue());
  const [shoesIncluded, setShoesIncluded] = useState(true);
  const [totalStacks, setTotalStacks] = useState("42");
  const [inputMode, setInputMode] = useState<BowlingInputMode>("team");
  const [step, setStep] = useState<BowlingStep>("setup");
  const [games, setGames] = useState<BowlingGameDraft[]>([
    createBowlingGameDraft({ id: "game-1" }),
  ]);
  const [selectedGameId, setSelectedGameId] = useState("game-1");
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<
    string[]
  >([]);
  const previousMemberIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const validPresets = readSavedBowlingAmountPresets();

    if (validPresets.length > 0) {
      setAmountPresets(validPresets);
    }
  }, []);

  const selectedMembers = useMemo<ApiGroupMember[]>(
    () =>
      selectBowlingParticipants({
        members,
        selectedIds: selectedParticipantIds,
      }),
    [members, selectedParticipantIds],
  );

  useEffect(() => {
    const memberIds = members.map((member) => member.id);
    const previousMemberIds = previousMemberIdsRef.current;

    setSelectedParticipantIds((previousIds) =>
      reconcileBowlingParticipantIds({
        memberIds,
        previousMemberIds,
        previousSelectedIds: previousIds,
      }),
    );
    previousMemberIdsRef.current = memberIds;
  }, [members]);

  useEffect(() => {
    const resolvedPayerMemberId = resolveBowlingPayerMemberId({
      currentPayerMemberId: payerMemberId,
      members: selectedMembers,
    });

    if (resolvedPayerMemberId !== payerMemberId) {
      setPayerMemberId(resolvedPayerMemberId);
    }
  }, [payerMemberId, selectedMembers]);

  useEffect(() => {
    const memberIds = selectedMembers.map((member) => member.id);
    const savedHandicaps = readSavedBowlingHandicaps(memberIds);

    if (Object.keys(savedHandicaps).length === 0) {
      return;
    }

    setGames((currentGames) =>
      currentGames.map((game, index) =>
        index === 0 && Object.keys(game.handicaps).length === 0
          ? {
              ...game,
              handicaps: savedHandicaps,
            }
          : game,
      ),
    );
  }, [selectedMembers]);

  const stackPreview = useMemo(
    () =>
      buildBowlingStackPreview({
        games,
        inputMode,
        members: selectedMembers,
        perPersonAmountInput: perPersonAmount,
        totalStacksInput: totalStacks,
      }),
    [games, inputMode, perPersonAmount, selectedMembers, totalStacks],
  );

  const selectedGame =
    games.find((game) => game.id === selectedGameId) ?? games[0];

  const gamePreviews = useMemo(
    () =>
      selectedMembers.length > 0
        ? games.map((game) => ({
            gameId: game.id,
            preview: buildBowlingGamePreview({
              game,
              members: selectedMembers,
            }),
          }))
        : [],
    [games, selectedMembers],
  );

  const selectedGamePreview =
    gamePreviews.find((game) => game.gameId === selectedGame?.id)?.preview ??
    null;

  const updateGame = (
    gameId: string,
    patch: Partial<Omit<BowlingGameDraft, "id">>,
  ) => {
    setGames((currentGames) =>
      updateBowlingGameDrafts({
        gameId,
        games: currentGames,
        patch,
      }),
    );
  };

  const addGame = () => {
    setGames((currentGames) => {
      const nextDraft = appendBowlingGameDraft({
        games: currentGames,
        handicaps: readSavedBowlingHandicaps(
          selectedMembers.map((member) => member.id),
        ),
        nextGameId: `game-${Date.now()}`,
        selectedGameId,
      });

      setSelectedGameId(nextDraft.selectedGameId);
      return nextDraft.games;
    });
  };

  const deleteGame = (gameId: string) => {
    setGames((currentGames) => {
      const nextDraft = deleteBowlingGameDraft({
        gameId,
        games: currentGames,
        selectedGameId,
      });

      setSelectedGameId(nextDraft.selectedGameId);
      return nextDraft.games;
    });
  };

  const rememberAmountPreset = () => {
    const nextPresets = buildRememberedBowlingAmountPresets({
      amountInput: perPersonAmount,
      presets: amountPresets,
    });

    setAmountPresets(nextPresets);
    writeSavedBowlingAmountPresets(nextPresets);
  };

  const resetDraft = () => {
    const memberIds = members.map((member) => member.id);
    const nextGameId = `game-${Date.now()}`;

    setPerPersonAmount("20000");
    setPayerMemberId(memberIds[0] ?? null);
    setOccurredDate(getLocalDateInputValue());
    setShoesIncluded(true);
    setTotalStacks("42");
    setInputMode("team");
    setStep("setup");
    setGames([
      createBowlingGameDraft({
        handicaps: readSavedBowlingHandicaps(memberIds),
        id: nextGameId,
      }),
    ]);
    setSelectedGameId(nextGameId);
    setSelectedParticipantIds(memberIds);
  };

  const buildSaveInput = () => {
    const occurredAt = toOccurredAtIsoDate(occurredDate);

    return {
      ...(occurredAt ? { occurredAt } : {}),
      ...buildBowlingSettlementSaveInput({
        games,
        inputMode,
        members: selectedMembers,
        payerMemberId,
        totalAmount: stackPreview.amount,
        totalStacksInput: totalStacks,
      }),
    };
  };

  return {
    addGame,
    amountPresets,
    buildSaveInput,
    deleteGame,
    gamePreviews,
    games,
    inputMode,
    members,
    occurredDate,
    payerMemberId,
    perPersonAmount,
    rememberAmountPreset,
    resetDraft,
    selectedGame,
    selectedGameId,
    selectedGamePreview,
    selectedMembers,
    selectedParticipantIds,
    setInputMode,
    setOccurredDate,
    setPayerMemberId,
    setPerPersonAmount,
    setSelectedGameId,
    setSelectedParticipantIds,
    setShoesIncluded,
    setStep,
    setTotalStacks,
    shoesIncluded,
    stackPreview,
    step,
    totalStacks,
    updateGame,
  };
}

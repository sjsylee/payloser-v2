import { SharedCalculatorLoader } from "./shared-calculator-loader";

describe("SharedCalculatorLoader", () => {
  it("loads the bowling calculator through one module seam", async () => {
    const loader = new SharedCalculatorLoader();

    await expect(loader.bowling()).resolves.toEqual(
      expect.objectContaining({
        calculateUnlimitedBowlingSessionSettlement: expect.any(Function),
        buildRepresentativePayerRecovery: expect.any(Function),
      }),
    );
  });

  it("loads the screen baseball calculator through one module seam", async () => {
    const loader = new SharedCalculatorLoader();

    await expect(loader.screenBaseball()).resolves.toEqual(
      expect.objectContaining({
        calculateScreenBaseballSettlement: expect.any(Function),
      }),
    );
  });

  it("loads the RPS calculator through one module seam", async () => {
    const loader = new SharedCalculatorLoader();

    await expect(loader.rps()).resolves.toEqual(
      expect.objectContaining({
        summarizeRpsLosses: expect.any(Function),
      }),
    );
  });
});

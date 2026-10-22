
export type MockSettings = {
  latencyMs: number;
  forceFailure: boolean;
  emptyLists: boolean;
  forceBookingConflict: boolean;
};

export const mockSettings: MockSettings = {
  latencyMs: 500,
  forceFailure: false,
  emptyLists: false,
  forceBookingConflict: false,
};

export function updateMockSettings(
  changes: Partial<MockSettings>,
) {
  Object.assign(mockSettings, changes);
}

export async function simulateNetwork() {
  await new Promise<void>(resolve =>
    setTimeout(resolve, mockSettings.latencyMs),
  );

  if (mockSettings.forceFailure) {
    throw new Error('Network request failed. Please retry.');
  }
}

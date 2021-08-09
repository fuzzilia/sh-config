export interface ProcessRotateRelativeState {
  readonly lastDirection: -1 | 0 | 1;
  readonly firstDirection: -1 | 0 | 1;
  readonly lastRotate: number;
  readonly count: number;
}

export interface ProcessRotateRelativeResult {
  readonly state: ProcessRotateRelativeState;
  readonly countDiff: number;
}

export const initialProcessRotateRelativeState: ProcessRotateRelativeState = {
  lastDirection: 0,
  firstDirection: 0,
  lastRotate: 0,
  count: 0,
};

export const emptyProcessRotateRelativeResult: ProcessRotateRelativeResult = {
  state: initialProcessRotateRelativeState,
  countDiff: 0,
};

function countDiffDirection(value: number): -1 | 0 | 1 {
  if (value <= -1) {
    return -1;
  }
  if (value >= 1) {
    return 1;
  }
  return 0;
}

export function processRotateRelative(
  state: ProcessRotateRelativeState,
  relativeRotate: number,
): ProcessRotateRelativeResult {
  const currentRotate = state.lastRotate + relativeRotate;
  let rotateOffset = 0;
  if ((state.firstDirection === 0 && currentRotate < 0) || state.firstDirection === -1) {
    rotateOffset = 0.9999999999;
  }
  const rotateDiffFromSplitPoint = currentRotate + rotateOffset - state.count;
  let count = Math.floor(currentRotate + rotateOffset);
  if (
    (state.lastDirection === -1 && rotateDiffFromSplitPoint > 0 && rotateDiffFromSplitPoint < 1.25) ||
    (state.lastDirection === 1 && rotateDiffFromSplitPoint < 0 && rotateDiffFromSplitPoint > -1.25)
  ) {
    count = state.count;
  }
  const countDiff = count - state.count;
  const direction = countDiffDirection(countDiff);
  return {
    countDiff: count - state.count,
    state: {
      lastRotate: currentRotate,
      firstDirection: state.firstDirection || direction,
      lastDirection: direction,
      count,
    },
  };
}

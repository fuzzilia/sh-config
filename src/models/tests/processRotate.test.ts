import {initialProcessRotateRelativeState, processRotateRelative} from '../processRotate';

describe('Unit tests for processRotateRelative', () => {
  it('正転が正しくカウントに反映されること', () => {
    let state = initialProcessRotateRelativeState;
    state = processRotateRelative(state, 0.5).state;
    expect(state.count).toBe(0);
    state = processRotateRelative(state, 0.5).state;
    expect(state.count).toBe(1);
    state = processRotateRelative(state, 2).state;
    expect(state.count).toBe(3);
  });

  it('逆転が正しくカウントに反映されること', () => {
    let state = initialProcessRotateRelativeState;
    state = processRotateRelative(state, -0.5).state;
    expect(state.count).toBe(0);
    state = processRotateRelative(state, -0.5).state;
    expect(state.count).toBe(-1);
    state = processRotateRelative(state, -2).state;
    expect(state.count).toBe(-3);
  });

  it('正転から逆転に転じた場合に正しくカウントに反映されること', () => {
    let state = initialProcessRotateRelativeState;
    state = processRotateRelative(state, 1.1).state;
    expect(state.count).toBe(1);
    state = processRotateRelative(state, -0.2).state;
    // 境界付近で激しく振動しないよう、反転してわずかに境界を超えた時点ではカウントが変動しない
    expect(state.count).toBe(1);
    state = processRotateRelative(state, -0.2).state;
    // 反転して0.25を超えた時点でカウントが変動する
    expect(state.count).toBe(0);
    state = processRotateRelative(state, -0.7).state;
    expect(state.count).toBe(0);
    state = processRotateRelative(state, -0.1).state;
    expect(state.count).toBe(-1);
  });

  it('逆転から正転に転じた場合に正しくカウントに反映されること', () => {
    let state = initialProcessRotateRelativeState;
    state = processRotateRelative(state, -1.1).state;
    expect(state.count).toBe(-1);
    state = processRotateRelative(state, 0.2).state;
    // 境界付近で激しく振動しないよう、反転してわずかに境界を超えた時点ではカウントが変動しない
    expect(state.count).toBe(-1);
    state = processRotateRelative(state, 0.2).state;
    // 反転して0.25を超えた時点でカウントが変動する
    expect(state.count).toBe(0);
    state = processRotateRelative(state, 0.7).state;
    expect(state.count).toBe(0);
    state = processRotateRelative(state, 0.1).state;
    expect(state.count).toBe(1);
  });
});

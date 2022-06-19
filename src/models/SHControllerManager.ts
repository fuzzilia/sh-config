import {
  KeyConfig,
  rotateAxes,
  SHEightButtonStickConfig,
  SHFourButtonStickConfig,
  SHMotionConfig,
  SHRotateMotionConfig,
  SHRotateStickConfig,
  SHStickConfig,
} from './SHConConfig';
import {
  emptyProcessRotateRelativeResult,
  initialProcessRotateRelativeState,
  processRotateRelative,
  ProcessRotateRelativeState,
} from './processRotate';
import {SHConfigManager} from './SHConfigManager';

export type FourButtonDirection = 'upKey' | 'rightKey' | 'downKey' | 'leftKey';
export const fourButtonDirections: readonly FourButtonDirection[] = ['upKey', 'rightKey', 'downKey', 'leftKey'];
export type EightButtonDirection = FourButtonDirection | 'upRightKey' | 'downRightKey' | 'downLeftKey' | 'upLeftKey';
export const eightButtonDirections: readonly EightButtonDirection[] = [
  'upKey',
  'upRightKey',
  'rightKey',
  'downRightKey',
  'downKey',
  'downLeftKey',
  'leftKey',
  'upLeftKey',
];

interface SHFourButtonStickState {
  readonly type: '4-button';
  readonly keys: readonly KeyConfig[];
  readonly direction: FourButtonDirection | undefined;
  readonly lastKeyIsAlive?: boolean;
}

interface SHEightButtonStickState {
  readonly type: '8-button';
  readonly keys: readonly KeyConfig[];
  readonly direction: EightButtonDirection | undefined;
  readonly lastKeyIsAlive?: boolean;
}

interface SHRotateStickState {
  readonly type: 'rotate';
  readonly keys: readonly KeyConfig[];
  readonly rotationCount: number;
  readonly rotationCountDiff?: number;
  readonly lastKeyIsAlive?: undefined;
}

export type SHStickState = SHFourButtonStickState | SHEightButtonStickState | SHRotateStickState;

interface RotationState {
  readonly angleOffset: number;
  readonly lastAngle: number;
  readonly lastDirection: -1 | 0 | 1;
  readonly firstDirection: -1 | 0 | 1;
  readonly count: number;
}

class StickManager {
  private lastConfig?: SHStickConfig;
  private lastDirection?: EightButtonDirection;
  private rotationState?: RotationState;

  public constructor(
    public readonly stickIndex: number,
    public readonly readStickValue: (stickIndex: number, direction: 'x' | 'y') => number,
  ) {}

  public tick(config: SHStickConfig | undefined): SHStickState | undefined {
    if (!config) {
      this.lastConfig = undefined;
      this.lastDirection = undefined;
      return undefined;
    }
    const configIsChanged = this.lastConfig !== config;
    this.lastConfig = config;
    const x = this.readStickValue(this.stickIndex, 'x');
    const y = this.readStickValue(this.stickIndex, 'y');
    const magnitude = x * x + y * y;
    const angle = Math.atan2(y, x);
    // y軸の正方向を0、時計回りを正、一周あたり1となるように正規化
    const normalizedAngle = ((2.5 - angle / Math.PI) / 2) % 1;
    switch (config.type) {
      case '4-button': {
        const index = Math.floor((normalizedAngle * 4 + 0.5) % 4);
        const direction = magnitude > 0.2 ? fourButtonDirections[index] : undefined;
        const keys = direction && direction !== this.lastDirection && config[direction] ? [config[direction]!] : [];
        this.lastDirection = direction;
        return {type: '4-button', keys, direction, lastKeyIsAlive: !!direction};
      }
      case '8-button': {
        const index = Math.floor((normalizedAngle * 8 + 0.5) % 8);
        const direction = magnitude > 0.2 ? eightButtonDirections[index] : undefined;
        const keys = direction && direction !== this.lastDirection && config[direction] ? [config[direction]!] : [];
        this.lastDirection = direction;
        return {type: '8-button', keys, direction, lastKeyIsAlive: !!direction};
      }
      case 'rotate': {
        if (magnitude <= 0.2) {
          this.rotationState = undefined;
          return undefined;
        }
        const {splitSize} = config;
        const angleForRotate = normalizedAngle * splitSize;
        if (!this.rotationState || configIsChanged) {
          this.rotationState = {
            angleOffset: angleForRotate % 1,
            lastAngle: Math.floor(angleForRotate),
            lastDirection: 0,
            firstDirection: 0,
            count: 0,
          };
          return undefined;
        }
        const {lastAngle, angleOffset, lastDirection, firstDirection} = this.rotationState;
        // オフセットを考慮した、前回基準角度からの角度差
        const rawAngleDiff = angleForRotate - angleOffset - lastAngle;
        // 角度の値が0度境界を超えた場合の正負調整
        const angleDiff = ((rawAngleDiff + splitSize * 1.5) % splitSize) - splitSize / 2;
        const direction = angleDiff > 0 ? 1 : -1;
        const angleDiffForMinus = Math.min(firstDirection === 0 ? angleDiff + 1 : angleDiff, 0);
        const fixedAngleDiffForMinus =
          direction === -1 && lastDirection === 1 && angleDiffForMinus > -0.25 ? 0 : Math.floor(angleDiffForMinus);
        const angleDiffForPlus = Math.max(angleDiff, 0);
        const fixedAngleDiffForPlus =
          direction === 1 && lastDirection === -1 && angleDiffForPlus < 1.25 ? 0 : Math.floor(angleDiffForPlus);
        const countDiff = fixedAngleDiffForMinus + fixedAngleDiffForPlus;
        if (countDiff === 0) {
          return {type: 'rotate', keys: [], rotationCount: this.rotationState.count};
        }
        this.rotationState = {
          angleOffset,
          lastAngle: Math.floor(angleForRotate - angleOffset),
          lastDirection: direction,
          firstDirection: firstDirection === 0 ? direction : firstDirection,
          count: this.rotationState.count + countDiff,
        };
        const keys: KeyConfig[] = [];
        if (countDiff > 0) {
          const keyConfig = config.key?.positive;
          if (keyConfig) {
            keys.push(...[Array(countDiff)].map(() => keyConfig));
          }
        } else {
          const keyConfig = config.key?.negative;
          if (keyConfig) {
            keys.push(...[Array(-countDiff)].map(() => keyConfig));
          }
        }
        return {
          type: 'rotate',
          keys,
          rotationCount: this.rotationState.count,
          rotationCountDiff: countDiff,
        };
      }
    }
    return undefined;
  }
}

export interface ThreeDimensionValue<T = number> {
  readonly x: T;
  readonly y: T;
  readonly z: T;
}

export interface MotionSensorValue {
  readonly timeSpanMs: number;
  readonly accel: ThreeDimensionValue;
  readonly gyro: ThreeDimensionValue;
}

export interface SHRotateMotionState {
  readonly type: 'rotate';
  readonly keys: readonly KeyConfig[];
  readonly lastKeyIsAlive?: undefined;
  readonly lockedAxis?: 'x' | 'y' | 'z';
  readonly rotationState: ThreeDimensionValue<ProcessRotateRelativeState>;
}

export interface SHGestureMotionState {
  readonly type: 'gesture';
  readonly keys: readonly KeyConfig[];
  readonly lastKeyIsAlive?: boolean;
  readonly firstGesture?: MotionGestureType;
}

export type SHMotionState = SHRotateMotionState | SHGestureMotionState;

interface MotionSensorManagerRotateState {
  readonly lockedAxis?: 'x' | 'y' | 'z';
  readonly rotationState: ThreeDimensionValue<ProcessRotateRelativeState>;
}

export type MotionGestureType = {
  readonly type: 'rotate';
  axis: 'x' | 'y' | 'z';
  positiveOrNegative: 'positive' | 'negative';
};

interface MotionSensorManagerGestureState {
  readonly firstGesture?: MotionGestureType;
  readonly firstGestureHasKey?: boolean;
  readonly rotation: ThreeDimensionValue<number>;
}

function selectOnOfThreeDimension<T>(
  axis: 'x' | 'y' | 'z' | undefined,
  value: ThreeDimensionValue<T>,
  defaultValue: T,
): ThreeDimensionValue<T> {
  return axis ? {x: defaultValue, y: defaultValue, z: defaultValue, [axis]: value[axis]} : value;
}

function getMaxAxisFromState(state: ThreeDimensionValue<ProcessRotateRelativeState>): 'x' | 'y' | 'z' | undefined {
  const absX = Math.abs(state.x.lastRotate);
  const absY = Math.abs(state.y.lastRotate);
  const absZ = Math.abs(state.z.lastRotate);
  const max = Math.max(absX, absY, absZ);
  if (max < 1) {
    return undefined;
  }
  switch (max) {
    case absX:
      return 'x';
    case absY:
      return 'y';
    case absZ:
      return 'z';
    default:
      throw new Error('unexpected error.');
  }
}

function getFirstRotateGesture(rotate: ThreeDimensionValue): MotionGestureType | undefined {
  const absX = Math.abs(rotate.x);
  const absY = Math.abs(rotate.y);
  const absZ = Math.abs(rotate.z);
  const max = Math.max(absX, absY, absZ);
  if (max < 0.05) {
    return undefined;
  }
  switch (max) {
    case absX:
      return {type: 'rotate', axis: 'x', positiveOrNegative: rotate.x < 0 ? 'negative' : 'positive'};
    case absY:
      return {type: 'rotate', axis: 'y', positiveOrNegative: rotate.y < 0 ? 'negative' : 'positive'};
    case absZ:
      return {type: 'rotate', axis: 'z', positiveOrNegative: rotate.z < 0 ? 'negative' : 'positive'};
    default:
      throw new Error('unexpected error.');
  }
}

class MotionSensorManager {
  private lastConfig?: SHMotionConfig;
  private rotateState?: MotionSensorManagerRotateState;
  private gestureState?: MotionSensorManagerGestureState;

  public constructor(private readonly readMotionSensorValues: () => readonly MotionSensorValue[]) {}

  public tick(config: SHMotionConfig | undefined): SHMotionState | undefined {
    if (!config) {
      this.lastConfig = undefined;
      // TODO 重力方向を把握するためには、configがundefinedのときも値の取得は続けるべき
      return undefined;
    }
    const sensorValues = this.readMotionSensorValues();
    switch (config.type) {
      case 'gesture': {
        if (this.lastConfig !== config || !this.gestureState) {
          this.gestureState = {rotation: {x: 0, y: 0, z: 0}};
          this.lastConfig = config;
          return {
            type: 'gesture',
            keys: [],
          };
        }
        if (this.gestureState?.firstGesture) {
          return {
            type: 'gesture',
            keys: [],
            lastKeyIsAlive: this.gestureState.firstGestureHasKey,
            firstGesture: this.gestureState.firstGesture,
          };
        }

        let addingRotation: ThreeDimensionValue = {x: 0, y: 0, z: 0};
        for (const sensorValue of sensorValues) {
          const timeCoefficient = sensorValue.timeSpanMs / 1000;
          addingRotation = {
            x: addingRotation.x + sensorValue.gyro.x * timeCoefficient,
            y: addingRotation.y + sensorValue.gyro.y * timeCoefficient,
            z: addingRotation.z + sensorValue.gyro.z * timeCoefficient,
          };
        }
        const rotation = {
          x: addingRotation.x + this.gestureState.rotation.x,
          y: addingRotation.y + this.gestureState.rotation.y,
          z: addingRotation.z + this.gestureState.rotation.z,
        };
        const firstGesture = getFirstRotateGesture(rotation);
        const key = firstGesture && config.rotate?.[firstGesture.axis]?.[firstGesture.positiveOrNegative];
        const keys = key ? [key] : [];
        this.gestureState = {firstGesture, rotation, firstGestureHasKey: !!key};
        return {type: 'gesture', keys, firstGesture, lastKeyIsAlive: !!key};
      }

      case 'rotate': {
        if (this.lastConfig !== config) {
          this.lastConfig = config;
          this.rotateState = {
            rotationState: {
              x: initialProcessRotateRelativeState,
              y: initialProcessRotateRelativeState,
              z: initialProcessRotateRelativeState,
            },
          };
          return {
            type: 'rotate',
            keys: [],
            lockedAxis: undefined,
            rotationState: this.rotateState.rotationState,
          };
        }
        if (!this.rotateState) {
          throw new Error('rotate state is undefined.');
        }
        const {lockedAxis, rotationState} = this.rotateState;
        let addingRotation: ThreeDimensionValue = {x: 0, y: 0, z: 0};
        const xIsActive = lockedAxis === 'x' || lockedAxis === undefined;
        const yIsActive = lockedAxis === 'y' || lockedAxis === undefined;
        const zIsActive = lockedAxis === 'z' || lockedAxis === undefined;
        for (const sensorValue of sensorValues) {
          const timeCoefficient = sensorValue.timeSpanMs / 1000;
          addingRotation = {
            x: xIsActive ? addingRotation.x + sensorValue.gyro.x * config.splitSize.x * timeCoefficient : 0,
            y: yIsActive ? addingRotation.y + sensorValue.gyro.y * config.splitSize.y * timeCoefficient : 0,
            z: zIsActive ? addingRotation.z + sensorValue.gyro.z * config.splitSize.z * timeCoefficient : 0,
          };
        }
        const rotation = {
          x: xIsActive ? processRotateRelative(rotationState.x, addingRotation.x) : emptyProcessRotateRelativeResult,
          y: yIsActive ? processRotateRelative(rotationState.y, addingRotation.y) : emptyProcessRotateRelativeResult,
          z: zIsActive ? processRotateRelative(rotationState.z, addingRotation.z) : emptyProcessRotateRelativeResult,
        };
        let nextState = {x: rotation.x.state, y: rotation.y.state, z: rotation.z.state};
        let nextLockedDirection: 'x' | 'y' | 'z' | undefined;
        if (!lockedAxis && config.locksAxis && (nextLockedDirection = getMaxAxisFromState(rotationState))) {
          nextState = selectOnOfThreeDimension(nextLockedDirection, nextState, initialProcessRotateRelativeState);
        }
        this.rotateState = {
          lockedAxis: lockedAxis ?? nextLockedDirection,
          rotationState: nextState,
        };
        const keys: KeyConfig[] = [];
        rotateAxes.forEach((axis) => {
          const countDiff = rotation[axis].countDiff;
          if (countDiff > 0) {
            const keyConfig = config[axis]?.positive;
            if (keyConfig) {
              keys.push(...[...Array(countDiff)].map(() => keyConfig));
            }
          } else if (countDiff < 0) {
            const keyConfig = config[axis]?.negative;
            if (keyConfig) {
              keys.push(...[...Array(-countDiff)].map(() => keyConfig));
            }
          }
        });
        return {type: 'rotate', keys, lockedAxis, rotationState: nextState};
      }
    }
  }
}

export interface SHControllerState {
  readonly keys: readonly KeyConfig[];
  readonly sticks: readonly (SHStickState | undefined)[];
  readonly combination: readonly boolean[];
  readonly pushedButtonName: string | undefined;
  readonly motion?: SHMotionState;
  readonly lastKeyIsAlive: boolean;
}

export class SHControllerManager {
  private sticks: readonly StickManager[];
  private motion: MotionSensorManager | undefined;
  private lastButtonKey: KeyConfig | undefined;
  public constructor(
    buttonCount: number,
    stickCount: number,
    private readButtonState: (buttonIndex: number) => boolean,
    readStickValue: (stickIndex: number, direction: 'x' | 'y') => number,
    readMotionSensorValues: (() => readonly MotionSensorValue[]) | undefined,
    private config: SHConfigManager,
  ) {
    this.sticks = [...Array(stickCount)].map((_, index) => new StickManager(index, readStickValue));
    this.motion = readMotionSensorValues && new MotionSensorManager(readMotionSensorValues);
  }

  public tick(): SHControllerState {
    const combination = this.config.combinationButtonIndexes().map((index) => this.readButtonState(index));
    let buttonKey: KeyConfig | undefined;
    let motionConfig: SHMotionConfig | undefined;
    let commandExists: boolean = false;
    let pushedButtonName: string | undefined;
    let lastKeyIsAlive = false;
    for (const index of this.config.commandButtonIndexes()) {
      const isOn = this.readButtonState(index);
      if (isOn) {
        pushedButtonName = this.config.buttonName(index);
      }
      const buttonConfig = this.config.buttonKey(index, combination);
      if (!buttonConfig) {
        continue;
      }
      if (!isOn) {
        continue;
      }
      if (buttonConfig.type === 'motion') {
        if (!this.motion) {
          continue;
        }
        motionConfig = buttonConfig.motion;
        commandExists = true;
        break;
      } else {
        buttonKey = buttonConfig.key;
        if (buttonKey) {
          commandExists = true;
          break;
        }
      }
    }
    const motion = this.motion?.tick(motionConfig);
    let sticks = this.sticks.map((stick, index) =>
      stick.tick(commandExists ? undefined : this.config.stickKey(index, combination)),
    );
    let keys: KeyConfig[] = [];
    if (buttonKey) {
      if (buttonKey !== this.lastButtonKey) {
        keys.push(buttonKey);
      } else {
        lastKeyIsAlive = true;
      }
    }
    if (motion) {
      keys.push(...motion.keys);
      if (motion.lastKeyIsAlive) {
        lastKeyIsAlive = true;
      }
    }
    sticks.forEach((stick) => {
      if (stick) {
        keys.push(...stick.keys);
        if (stick.lastKeyIsAlive) {
          lastKeyIsAlive = true;
        }
      }
    });
    this.lastButtonKey = buttonKey;
    return {keys, sticks, motion, combination, pushedButtonName, lastKeyIsAlive};
  }
}

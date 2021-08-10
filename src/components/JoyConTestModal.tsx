import React, {useEffect, useMemo, useRef, useState} from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import Chip from '@material-ui/core/Chip';
import Grid from '@material-ui/core/Grid';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import {
  EightButtonDirection,
  SHControllerManager,
  SHControllerState,
  SHMotionState,
  SHStickState,
} from '../models/SHControllerManager';
import {KeyConfig, keyConfigStateToSHConfig} from '../models/SHConConfig';
import {KeyConfigState} from '../types';
import {keyCodeToKey} from '../models/KeyConfig';
import {SHConfigManager} from '../models/SHConfigManager';
import {JoyCon, JoyConInput, JoyConInputReportMode, leftJoyConButtons, rightJoyConButtons} from '../models/JoyCon';
import Typography from '@material-ui/core/Typography';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {Keypad} from '../models/keypads';
import {rotateMotionLabelsByAxis} from './ButtonConfigRow';
import {waitAsync} from '../models/utils';

const useStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.text.secondary,
  },
  buttonChip: {
    marginLeft: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  keyChip: {
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  row: {
    marginBottom: theme.spacing(2),
  },
}));

export interface JoyConTestModalProps {
  readonly keypad: Keypad;
  readonly configState: KeyConfigState;
  readonly onClose: () => void;
  readonly isOpen: boolean;
}

export const JoyConTestModal: React.FC<JoyConTestModalProps> = ({keypad, configState, onClose, isOpen}) => {
  const classes = useStyles();
  const [controllerState, setControllerState] = useState<SHControllerState | undefined>();
  const lastStateJsonRef = useRef<string>('');
  const connectedDevice = useRef<HIDDevice>();
  const [keys, setKeys] = useState<KeyConfig[]>([]);
  const buttonLabelByName = useMemo<{readonly [key: string]: string}>(() => {
    const labels: {[key: string]: string} = {};
    keypad.buttons.map((button) => (labels[button.name] = button.label));
    return labels;
  }, [keypad]);
  const commandButtons = keypad.buttons.filter(
    (button) => !configState.selectedCombinationButtonNames.includes(button.name),
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let joyCon: JoyCon | undefined;
    void (async () => {
      try {
        const currentDevice = connectedDevice.current;
        try {
          // 既にデバイス選択済みであれば再利用する。
          if (currentDevice) {
            joyCon = new JoyCon(currentDevice);
            await joyCon.open();
          }
        } catch (error) {
          joyCon = undefined;
          console.warn(error);
          // エラーが出たらこの次の処理でデバイス選択から開始する。
        }
        if (!joyCon) {
          if (!window.navigator?.hid) {
            alert('ブラウザが WebHID に対応していません。');
            return;
          }
          const [device] = await window.navigator.hid.requestDevice({filters: JoyCon.filters});
          if (!device) {
            alert('JoyConに接続できませんでした。');
            return;
          }
          joyCon = new JoyCon(device);
          connectedDevice.current = device;
          await joyCon.open();
        }
        await joyCon.setInputReportMode(JoyConInputReportMode.Full);
        await waitAsync(100);
        await joyCon.enableIMU(true);

        let joyConInput: JoyConInput | undefined = undefined;
        const manager = new SHControllerManager(
          8,
          1,
          (buttonIndex) => {
            if (!joyConInput) {
              return false;
            }
            return joyConInput.rightOrLeft === 'right'
              ? joyConInput.buttons[rightJoyConButtons[buttonIndex]]
              : joyConInput.buttons[leftJoyConButtons[buttonIndex]];
          },
          (stickIndex, direction) => {
            if (!joyConInput) {
              return 0;
            }
            return direction === 'x' ? joyConInput.stick.horizontal : -joyConInput.stick.vertical;
          },
          () => {
            if (!joyConInput) {
              return [];
            }
            const commonValue = {timeSpanMs: 1000 / 60 / 3, accel: {x: 0, y: 0, z: 0}};
            return [
              {...commonValue, gyro: joyConInput.gyro[0]},
              {...commonValue, gyro: joyConInput.gyro[1]},
              {...commonValue, gyro: joyConInput.gyro[2]},
            ];
          },
          new SHConfigManager(keyConfigStateToSHConfig(configState)),
        );
        joyCon.onInput = (input) => {
          // console.log('joycon input', JSON.stringify(input.gyro));
          joyConInput = input;
          const state = manager.tick();
          const stateJson = JSON.stringify(state);
          if (stateJson !== lastStateJsonRef.current) {
            setControllerState(state);
            lastStateJsonRef.current = stateJson;
          }
          if (state.keys.length > 0) {
            setKeys((prev) => prev.concat(state.keys));
          }
        };
      } catch (error) {
        if (error instanceof DOMException) {
          // デバッグのときによく発生するので、特に何もしない
        } else {
          alert(error.message ?? '謎のエラーが発生しました。');
        }
        return;
      }
    })();
    return () => {
      if (joyCon) {
        void joyCon.close();
        setKeys([]);
        joyCon = undefined;
      }
    };
  }, [isOpen, configState]);

  if (!isOpen) {
    return null;
  }
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth={true} maxWidth="md">
      <DialogTitle>JoyConをブラウザで試す。</DialogTitle>
      <DialogContent>
        <Grid item xs={12}>
          <Grid container spacing={2} className={classes.row}>
            <Grid item xs={6}>
              <Typography className={classes.label}>組み合わせボタン状態</Typography>
              {configState.selectedCombinationButtonNames.map((buttonName, index) => {
                const isActive = controllerState?.combination[index] ? 'secondary' : undefined;
                return (
                  <Chip
                    key={buttonName}
                    className={classes.buttonChip}
                    label={buttonLabelByName[buttonName] ?? 'Error!!!'}
                    color={isActive}
                    disabled={!isActive}
                  />
                );
              })}
            </Grid>
            <Grid item xs={6}>
              <Typography className={classes.label}>ボタン押下状態</Typography>
              {commandButtons.map((button) => {
                const isActive = button.name === controllerState?.pushedButtonName ? 'secondary' : undefined;
                return (
                  <Chip
                    key={button.name}
                    className={classes.buttonChip}
                    label={button.label}
                    color={isActive}
                    disabled={!isActive}
                  />
                );
              })}
            </Grid>
          </Grid>
          <Grid container spacing={2} className={classes.row}>
            {keypad.sticks.map((stick, index) => {
              return (
                <Grid item xs={6}>
                  <Typography className={classes.label}>{stick.label}</Typography>
                  <StickStateView key={index} stick={controllerState?.sticks[index]} />
                </Grid>
              );
            })}
            <Grid item xs={6}>
              <Typography className={classes.label}>モーション</Typography>
              <MotionSensorView motion={controllerState?.motion} />
            </Grid>
          </Grid>
        </Grid>
        <Grid item spacing={2}>
          <Typography className={classes.label}>入力キー</Typography>
          {keys.map((key, index) => (
            <Chip
              key={index}
              icon={<KeyModifierIcon keyConfig={key} />}
              label={(key.key && keyCodeToKey.get(key.key)) || ''}
              className={classes.keyChip}
              color={controllerState?.lastKeyIsAlive && index === keys.length - 1 ? 'primary' : undefined}
            />
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const useSubStyles = makeStyles((theme) => ({
  label: {
    color: theme.palette.text.secondary,
    fontSize: 12,
  },
  root: {
    height: 70,
  },
}));

const StickStateView: React.FC<{stick: SHStickState | undefined}> = ({stick}) => {
  const classes = useSubStyles();
  if (!stick) {
    return (
      <Grid container spacing={2} className={classes.root}>
        <Grid item xs={3}>
          <Typography className={classes.label}>モード</Typography>
          <Typography>無効</Typography>
        </Grid>
      </Grid>
    );
  }
  switch (stick.type) {
    case '4-button':
      return (
        <Grid container spacing={2} className={classes.root}>
          <Grid item xs={3}>
            <Typography className={classes.label}>モード</Typography>
            <Typography>4方向キー</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>入力方向</Typography>
            <DirectionIcon direction={stick.direction} />
          </Grid>
        </Grid>
      );
    case '8-button':
      return (
        <Grid container spacing={2} className={classes.root}>
          <Grid item xs={3}>
            <Typography className={classes.label}>モード</Typography>
            <Typography>8方向キー</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>入力方向</Typography>
            <DirectionIcon direction={stick.direction} />
          </Grid>
        </Grid>
      );
    case 'rotate':
      return (
        <Grid container spacing={2} className={classes.root}>
          <Grid item xs={3}>
            <Typography className={classes.label}>モード</Typography>
            <Typography>回転</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>回転数</Typography>
            <Typography>{stick.rotationCount}</Typography>
          </Grid>
        </Grid>
      );
  }
};

function directionToRotateAngle(direction: EightButtonDirection | undefined): string | undefined {
  switch (direction) {
    case 'upKey':
      return '0';
    case 'rightKey':
      return '90';
    case 'downKey':
      return '180';
    case 'leftKey':
      return '-90';
    case 'upRightKey':
      return '45';
    case 'downRightKey':
      return '135';
    case 'downLeftKey':
      return '-135';
    case 'upLeftKey':
      return '-45';
    default:
      return undefined;
  }
}

const DirectionIcon: React.FC<{readonly direction: EightButtonDirection | undefined}> = ({direction}) => {
  const angle = directionToRotateAngle(direction);
  return angle ? (
    <ArrowUpward style={{transform: `rotate(${angle}deg)`}} />
  ) : (
    <ArrowUpward style={{color: 'transparent'}} />
  );
};

const MotionSensorView: React.FC<{motion: SHMotionState | undefined}> = ({motion}) => {
  const classes = useSubStyles();
  switch (motion?.type) {
    case 'gesture':
      return (
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography className={classes.label}>モード</Typography>
            <Typography>モーション</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>方向</Typography>
            <Typography>
              {motion?.firstGesture
                ? rotateMotionLabelsByAxis[motion.firstGesture.axis][
                    `${motion.firstGesture.positiveOrNegative}Direction` as const
                  ]
                : ''}
            </Typography>
          </Grid>
        </Grid>
      );
    case 'rotate':
      return (
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography className={classes.label}>モード</Typography>
            <Typography>回転</Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography className={classes.label}>ロック</Typography>
            <Typography>{motion.lockedAxis ? rotateMotionLabelsByAxis[motion.lockedAxis].axis : ''}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography className={classes.label}>ひねり方向</Typography>
            <Typography>{motion.rotationState.x.count}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography className={classes.label}>前後転</Typography>
            <Typography>{motion.rotationState.y.count}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography className={classes.label}>水平</Typography>
            <Typography>{motion.rotationState.z.count}</Typography>
          </Grid>
        </Grid>
      );
    default:
      return (
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography className={classes.label}>モード</Typography>
            <Typography>無効</Typography>
          </Grid>
        </Grid>
      );
  }
};

const useKeyModifierIconStyles = makeStyles((theme) => ({
  root: {
    width: 24,
    height: 24,
    marginLeft: theme.spacing(2),
  },
  row: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: 11,
    height: 11,
    marginBottom: 1,
    marginRight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'darkgray',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  emptyIcon: {
    width: 12,
    height: 12,
    marginBottom: 1,
    marginRight: 1,
    borderColor: 'darkgray',
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: 0.3,
  },
  iconChar: {
    fontSize: 16,
    transform: 'scale(0.5)',
  },
}));

const keyModifiers = ['shift', 'alt', 'ctrl', 'gui'] as const;

const KeyModifierIcon: React.FC<{keyConfig: KeyConfig | undefined}> = ({keyConfig}) => {
  const classes = useKeyModifierIconStyles();
  if (keyModifiers.some((key) => keyConfig?.[key])) {
    return (
      <div className={classes.root}>
        <div className={classes.row}>
          {keyConfig?.shift ? (
            <div className={classes.icon}>
              <span className={classes.iconChar}>S</span>
            </div>
          ) : (
            <div className={classes.emptyIcon} />
          )}
          {keyConfig?.ctrl ? (
            <div className={classes.icon}>
              <span className={classes.iconChar}>C</span>
            </div>
          ) : (
            <div className={classes.emptyIcon} />
          )}
        </div>
        <div className={classes.row}>
          {keyConfig?.alt ? (
            <div className={classes.icon}>
              <span className={classes.iconChar}>A</span>
            </div>
          ) : (
            <div className={classes.emptyIcon} />
          )}
          {keyConfig?.gui ? (
            <div className={classes.icon}>
              <span className={classes.iconChar}>G</span>
            </div>
          ) : (
            <div className={classes.emptyIcon} />
          )}
        </div>
      </div>
    );
  } else {
    return null;
  }
};

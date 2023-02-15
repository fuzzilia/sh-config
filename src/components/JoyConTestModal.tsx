import React, {useEffect, useMemo, useRef, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import {
  EightButtonDirection,
  SHControllerManager,
  SHControllerState,
  SHMotionState,
  SHStickState,
} from '../models/SHControllerManager';
import {keyConfigStateToSHConfig} from '../models/SHConConfig';
import {KeyConfig, KeyConfigState} from '../types';
import {keyCodeToKey} from '../models/KeyConfig';
import {SHConfigManager} from '../models/SHConfigManager';
import {JoyCon, JoyConInput, JoyConInputReportMode, leftJoyConButtons, rightJoyConButtons} from '../models/JoyCon';
import Typography from '@mui/material/Typography';
import {Keypad} from '../models/keypads';
import {rotateMotionLabelsByAxis} from './ButtonConfigRow';
import {waitAsync} from '../models/utils';
import {styled} from '@mui/material';
import {KeyModifierIcon} from './KeyModifierIcon';

const RowGrid = styled(Grid)`
  margin-bottom: ${({theme}) => theme.spacing(2)};
`;

const Label = styled(Typography)`
  color: ${({theme}) => theme.palette.text.secondary};
`;

const ButtonChip = styled(Chip)`
  margin-left: ${({theme}) => theme.spacing(1)};
  margin-top: ${({theme}) => theme.spacing(1)};
`;

const KeyChip = styled(Chip)`
  margin-right: ${({theme}) => theme.spacing(1)};
  margin-top: ${({theme}) => theme.spacing(1)};
`;

export interface JoyConTestModalProps {
  readonly keypad: Keypad;
  readonly configState: KeyConfigState;
  readonly onClose: () => void;
  readonly isOpen: boolean;
}

export const JoyConTestModal: React.FC<JoyConTestModalProps> = ({keypad, configState, onClose, isOpen}) => {
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
          <RowGrid container spacing={2}>
            <Grid item xs={6}>
              <Label>組み合わせボタン状態</Label>
              {configState.selectedCombinationButtonNames.map((buttonName, index) => {
                const isActive = controllerState?.combination[index] ? 'secondary' : undefined;
                return (
                  <ButtonChip
                    key={buttonName}
                    label={buttonLabelByName[buttonName] ?? 'Error!!!'}
                    color={isActive}
                    disabled={!isActive}
                  />
                );
              })}
            </Grid>
            <Grid item xs={6}>
              <Label>ボタン押下状態</Label>
              {commandButtons.map((button) => {
                const isActive = button.name === controllerState?.pushedButtonName ? 'secondary' : undefined;
                return <KeyChip key={button.name} label={button.label} color={isActive} disabled={!isActive} />;
              })}
            </Grid>
          </RowGrid>
          <RowGrid container spacing={2}>
            {keypad.sticks.map((stick, index) => {
              return (
                <Grid item xs={6}>
                  <Label>{stick.label}</Label>
                  <StickStateView key={index} stick={controllerState?.sticks[index]} />
                </Grid>
              );
            })}
            <Grid item xs={6}>
              <Label>モーション</Label>
              <MotionSensorView motion={controllerState?.motion} />
            </Grid>
          </RowGrid>
        </Grid>
        <Grid item spacing={2}>
          <Label>入力キー</Label>
          {keys.map((key, index) => (
            <KeyChip
              key={index}
              icon={<KeyModifierIcon keyConfig={key} />}
              label={(key.key && keyCodeToKey.get(key.key)) || ''}
              color={controllerState?.lastKeyIsAlive && index === keys.length - 1 ? 'primary' : undefined}
            />
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

const SubLabel = styled(Typography)`
  color: ${({theme}) => theme.palette.text.secondary};
  font-size: 12px;
`;

const StickStateRoot = styled(Grid)`
  height: 70px;
`;

const StickStateView: React.FC<{stick: SHStickState | undefined}> = ({stick}) => {
  if (!stick) {
    return (
      <StickStateRoot container spacing={2}>
        <Grid item xs={3}>
          <SubLabel>モード</SubLabel>
          <Typography>無効</Typography>
        </Grid>
      </StickStateRoot>
    );
  }
  switch (stick.type) {
    case '4-button':
      return (
        <StickStateRoot container spacing={2}>
          <Grid item xs={3}>
            <SubLabel>モード</SubLabel>
            <Typography>4方向キー</Typography>
          </Grid>
          <Grid item xs={3}>
            <SubLabel>入力方向</SubLabel>
            <DirectionIcon direction={stick.direction} />
          </Grid>
        </StickStateRoot>
      );
    case '8-button':
      return (
        <StickStateRoot container spacing={2}>
          <Grid item xs={3}>
            <SubLabel>モード</SubLabel>
            <Typography>8方向キー</Typography>
          </Grid>
          <Grid item xs={3}>
            <SubLabel>入力方向</SubLabel>
            <DirectionIcon direction={stick.direction} />
          </Grid>
        </StickStateRoot>
      );
    case 'rotate':
      return (
        <StickStateRoot container spacing={2}>
          <Grid item xs={3}>
            <SubLabel>モード</SubLabel>
            <Typography>回転</Typography>
          </Grid>
          <Grid item xs={3}>
            <SubLabel>回転数</SubLabel>
            <Typography>{stick.rotationCount}</Typography>
          </Grid>
        </StickStateRoot>
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
  switch (motion?.type) {
    case 'gesture':
      return (
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <SubLabel>モード</SubLabel>
            <Typography>モーション</Typography>
          </Grid>
          <Grid item xs={3}>
            <SubLabel>方向</SubLabel>
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
            <SubLabel>モード</SubLabel>
            <Typography>回転</Typography>
          </Grid>
          <Grid item xs={3}>
            <SubLabel>ロック</SubLabel>
            <Typography>{motion.lockedAxis ? rotateMotionLabelsByAxis[motion.lockedAxis].axis : ''}</Typography>
          </Grid>
          <Grid item xs={2}>
            <SubLabel>ひねり方向</SubLabel>
            <Typography>{motion.rotationState.x.count}</Typography>
          </Grid>
          <Grid item xs={2}>
            <SubLabel>前後転</SubLabel>
            <Typography>{motion.rotationState.y.count}</Typography>
          </Grid>
          <Grid item xs={2}>
            <SubLabel>水平</SubLabel>
            <Typography>{motion.rotationState.z.count}</Typography>
          </Grid>
        </Grid>
      );
    default:
      return (
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Typography>モード</Typography>
            <Typography>無効</Typography>
          </Grid>
        </Grid>
      );
  }
};

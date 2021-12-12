import React, {ChangeEvent} from 'react';
import {ApplicationShortCut} from '../types';
import NativeSelect from '@mui/material/NativeSelect';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import {
  defaultSHMotionButtonConfig,
  getDefaultMotionConfigForType,
  KeyConfig,
  PositiveAndNegativeKeyConfig,
  rotateAxes,
  SHButtonConfig,
  SHGestureMotionConfig,
  SHMotionConfig,
  SHRotateMotionConfig,
} from '../models/SHConConfig';
import {KeypadButton} from '../models/keypads';
import {KeySelectorCells} from './KeyConfigCommon';
import {BreakableLabel} from './BreakableLabel';
import {styled} from '@mui/material';

interface ButtonConfigRowProps {
  readonly config: SHButtonConfig | undefined;
  readonly button: KeypadButton;
  readonly motionEnabled: boolean;
  readonly index: number;
  readonly onChange: (index: number, buttonConfig: SHButtonConfig) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

export const ButtonConfigRow = React.memo<ButtonConfigRowProps>(
  ({config, button, motionEnabled, index, onChange, applicationShortCuts}) => {
    const changeType = (type: string) => {
      if (type === 'motion') {
        onChange(index, defaultSHMotionButtonConfig);
      } else if (type === '') {
        onChange(index, {});
      }
    };
    const changeConfig = (config: SHButtonConfig) => onChange(index, config);
    switch (config?.type) {
      case 'motion': {
        const changeMotionConfig = (motion: SHMotionConfig) => onChange(index, {...config, motion});
        const changeMotionType = (type: SHMotionConfig['type']) =>
          changeMotionConfig(getDefaultMotionConfigForType(type));
        switch (config.motion.type) {
          case 'rotate': {
            const motion = config.motion;
            const changeLocksAxis = (e: ChangeEvent<HTMLInputElement>) =>
              changeMotionConfig({...motion, locksAxis: e.target.checked});
            return (
              <>
                <TableRow>
                  <TableCell align="left" rowSpan={10}>
                    <BreakableLabel label={button.label} />
                  </TableCell>
                  <TableCell align="center">
                    <OperationTypeSelector type="motion" onChange={changeType} />
                  </TableCell>
                  <TableCell align="left" colSpan={3}>
                    モーション種別
                    <MotionTypeSelector type="rotate" onChange={changeMotionType} />
                    <FormControlLabel
                      control={<Checkbox checked={motion.locksAxis} onChange={changeLocksAxis} />}
                      label="回転方向ロック"
                    />
                  </TableCell>
                </TableRow>
                <RotateMotionKeyConfigAdditionalRows
                  applicationShortCuts={applicationShortCuts}
                  motionConfig={motion}
                  onChangeConfig={changeConfig}
                />
              </>
            );
          }
          case 'gesture': {
            const motion = config.motion;
            return (
              <>
                <TableRow>
                  <TableCell align="left" rowSpan={7}>
                    <BreakableLabel label={button.label} />
                  </TableCell>
                  <TableCell align="center">
                    <OperationTypeSelector type="motion" onChange={changeType} />
                  </TableCell>
                  <TableCell align="center">
                    モーション種別
                    <MotionTypeSelector type="gesture" onChange={changeMotionType} />
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
                <GestureMotionKeyConfigAdditionalRows
                  applicationShortCuts={applicationShortCuts}
                  motionConfig={motion}
                  onChangeConfig={changeConfig}
                />
              </>
            );
          }
        }
      }

      default: {
        const changeKey = (keyConfig: KeyConfig | undefined) => changeConfig({key: keyConfig});
        return (
          <TableRow>
            <TableCell align="left">
              <BreakableLabel label={button.label} />
            </TableCell>
            {motionEnabled && (
              <TableCell align="center">
                <OperationTypeSelector type={undefined} onChange={changeType} />
              </TableCell>
            )}
            <KeySelectorCells
              keyConfig={config?.key}
              onChangeKey={changeKey}
              applicationShortCuts={applicationShortCuts}
            />
          </TableRow>
        );
      }
    }
  },
);

const SelectForOperationType = styled(NativeSelect)`
  min-width: 70px;
`;

const OperationTypeSelector: React.FC<{type: 'motion' | undefined; onChange: (type: string) => void}> = ({
  type,
  onChange,
}) => {
  return (
    <SelectForOperationType value={type ?? ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">押下</option>
      <option value="motion">モーション</option>
    </SelectForOperationType>
  );
};

const SelectForMotionType = styled(NativeSelect)`
  min-width: 70px;
`;

const MotionTypeSelector: React.FC<{type: SHMotionConfig['type']; onChange: (motion: SHMotionConfig['type']) => void}> =
  ({type, onChange}) => {
    return (
      <SelectForMotionType value={type ?? ''} onChange={(e) => onChange(e.target.value as SHMotionConfig['type'])}>
        <option value="rotate">回転</option>
        <option value="gesture">ジェスチャ</option>
      </SelectForMotionType>
    );
  };

interface RotateMotionKeyConfigAdditionalRowsProps {
  readonly motionConfig: SHRotateMotionConfig;
  readonly onChangeConfig: (config: SHButtonConfig) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

const RotateMotionKeyConfigAdditionalRows: React.FC<RotateMotionKeyConfigAdditionalRowsProps> = ({
  motionConfig,
  onChangeConfig,
  applicationShortCuts,
}) => {
  const changeSplitSize = (axis: 'x' | 'y' | 'z', size: number) =>
    onChangeConfig({type: 'motion', motion: {...motionConfig, splitSize: {...motionConfig.splitSize, [axis]: size}}});
  const changeKey = (
    axis: 'x' | 'y' | 'z',
    positiveOrNegative: keyof PositiveAndNegativeKeyConfig,
    key: KeyConfig | undefined,
  ) =>
    onChangeConfig({
      type: 'motion',
      motion: {...motionConfig, [axis]: {...motionConfig[axis], [positiveOrNegative]: key}},
    });
  return (
    <>
      {rotateAxes.map((axis) => (
        <RotateMotionKeyConfigAdditionalRowsForAxis
          key={axis}
          axis={axis}
          splitCount={motionConfig.splitSize[axis]}
          config={motionConfig[axis]}
          labels={rotateMotionLabelsByAxis[axis]}
          applicationShortCuts={applicationShortCuts}
          onSplitSizeChanged={changeSplitSize}
          onKeyChanged={changeKey}
        />
      ))}
    </>
  );
};

interface RotateMotionKeyConfigAdditionalRowsForAxisProps {
  readonly axis: 'x' | 'y' | 'z';
  readonly splitCount: number;
  readonly config: PositiveAndNegativeKeyConfig | undefined;
  readonly labels: RotateMotionLabelsForAxis;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
  onSplitSizeChanged(axis: 'x' | 'y' | 'z', size: number): void;
  onKeyChanged(
    axis: 'x' | 'y' | 'z',
    positiveOrNegative: keyof PositiveAndNegativeKeyConfig,
    key: KeyConfig | undefined,
  ): void;
}

const NestedCell = styled(TableCell)`
  padding-left: ${({theme}) => theme.spacing(6)};
`;

const SplitCountInput = styled(NativeSelect)`
  margin-left: ${({theme}) => theme.spacing(2)};
`;

const RotateMotionKeyConfigAdditionalRowsForAxis: React.FC<RotateMotionKeyConfigAdditionalRowsForAxisProps> = ({
  axis,
  splitCount,
  config,
  labels,
  applicationShortCuts,
  onSplitSizeChanged,
  onKeyChanged,
}) => {
  const changeSplitSize = (e: ChangeEvent<HTMLSelectElement>) => onSplitSizeChanged(axis, Number(e.target.value));
  return (
    <>
      <TableRow>
        <TableCell>{labels.axis}</TableCell>
        <TableCell>
          分割数
          <SplitCountInput value={splitCount} onChange={changeSplitSize}>
            {rotateSplitCounts.map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </SplitCountInput>
        </TableCell>
        <TableCell colSpan={3} />
      </TableRow>
      <TableRow>
        <NestedCell>{labels.positiveDirection}</NestedCell>
        <KeySelectorCells
          keyConfig={config?.positive}
          onChangeKey={(key) => onKeyChanged(axis, 'positive', key)}
          applicationShortCuts={applicationShortCuts}
        />
      </TableRow>
      <TableRow>
        <NestedCell>{labels.negativeDirection}</NestedCell>
        <KeySelectorCells
          keyConfig={config?.negative}
          onChangeKey={(key) => onKeyChanged(axis, 'negative', key)}
          applicationShortCuts={applicationShortCuts}
        />
      </TableRow>
    </>
  );
};

interface RotateMotionLabelsForAxis {
  readonly axis: string;
  readonly positiveDirection: string;
  readonly negativeDirection: string;
}

const rotateSplitCounts = [...Array(64)].map((_, i) => i * 4);

export const rotateMotionLabelsByAxis: Record<'x' | 'y' | 'z', RotateMotionLabelsForAxis> = {
  x: {
    axis: 'ひねり方向',
    positiveDirection: '右ひねり',
    negativeDirection: '左ひねり',
  },
  y: {
    axis: '前後転方向',
    positiveDirection: '前転',
    negativeDirection: '後転',
  },
  z: {
    axis: '水平方向',
    positiveDirection: '反時計回り',
    negativeDirection: '時計回り',
  },
};

interface GestureMotionKeyConfigAdditionalRowsProps {
  readonly motionConfig: SHGestureMotionConfig;
  readonly onChangeConfig: (config: SHButtonConfig) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

const GestureMotionKeyConfigAdditionalRows: React.FC<GestureMotionKeyConfigAdditionalRowsProps> = ({
  motionConfig,
  onChangeConfig,
  applicationShortCuts,
}) => {
  const changeKey = (
    axis: 'x' | 'y' | 'z',
    positiveOrNegative: keyof PositiveAndNegativeKeyConfig,
    key: KeyConfig | undefined,
  ) =>
    onChangeConfig({
      type: 'motion',
      motion: {
        ...motionConfig,
        rotate: {...motionConfig.rotate, [axis]: {...motionConfig.rotate?.[axis], [positiveOrNegative]: key}},
      },
    });
  return (
    <>
      {rotateAxes.map((axis) => (
        <React.Fragment key={axis}>
          <TableRow>
            <TableCell>{rotateMotionLabelsByAxis[axis].positiveDirection}</TableCell>
            <KeySelectorCells
              keyConfig={motionConfig.rotate?.[axis]?.positive}
              onChangeKey={(key) => changeKey(axis, 'positive', key)}
              applicationShortCuts={applicationShortCuts}
            />
          </TableRow>
          <TableRow>
            <TableCell>{rotateMotionLabelsByAxis[axis].negativeDirection}</TableCell>
            <KeySelectorCells
              keyConfig={motionConfig.rotate?.[axis]?.negative}
              onChangeKey={(key) => changeKey(axis, 'negative', key)}
              applicationShortCuts={applicationShortCuts}
            />
          </TableRow>
        </React.Fragment>
      ))}
    </>
  );
};

import React, {ChangeEvent} from 'react';
import {KeyConfig, SHStickConfig} from '../models/SHConConfig';
import {KeypadStick} from '../models/keypads';
import {ApplicationShortCut} from '../types';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import {BreakableLabel} from './BreakableLabel';
import NativeSelect from '@mui/material/NativeSelect';
import {KeySelectorCells} from './KeyConfigCommon';
import {
  EightButtonDirection,
  eightButtonDirections,
  FourButtonDirection,
  fourButtonDirections,
} from '../models/SHControllerManager';
import {styled} from '@mui/material';

export interface StickConfigRowProps {
  readonly config: SHStickConfig | undefined;
  readonly stick: KeypadStick;
  readonly index: number;
  readonly onChange: (index: number, config: SHStickConfig | undefined) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

const SplitCountInput = styled(NativeSelect)`
  margin-left: ${({theme}) => theme.spacing(2)};
`;

// const rotateSplitCount = [...Array(0x0f)].map((_, i) => (i + 1) * 4);
const rotateSplitCount = [...Array(6)].map((_, i) => (i + 1) * 4);

export const StickConfigRow: React.FC<StickConfigRowProps> = ({
  config,
  stick,
  index,
  onChange,
  applicationShortCuts,
}) => {
  const changeType = (type: string) => {
    switch (type) {
      case 'rotate':
        onChange(index, {type, splitSize: 8});
        break;
      case '8-button':
      case '4-button':
        onChange(index, {type});
    }
  };
  const commonRowProps = {label: stick.label, onChangeType: changeType} as const;
  switch (config?.type) {
    case undefined:
    case 'rotate': {
      const changeKey = (positiveOrNegative: 'positive' | 'negative', key: KeyConfig | undefined) =>
        onChange(index, {
          ...config,
          type: 'rotate',
          splitSize: config?.splitSize ?? 8,
          key: {...config?.key, [positiveOrNegative]: key},
        });
      const changeSplitSize = (e: ChangeEvent<HTMLSelectElement>) =>
        onChange(index, {
          ...config,
          type: 'rotate',
          splitSize: rotateSplitCount.find((v) => v === Number(e.target.value)) ?? 8,
        });
      return (
        <>
          <CommonRow {...commonRowProps} type="rotate" childRowCount={2}>
            <TableCell colSpan={1}>
              分割数
              <SplitCountInput value={config?.splitSize} onChange={changeSplitSize}>
                {rotateSplitCount.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </SplitCountInput>
            </TableCell>
            <TableCell colSpan={2} />
          </CommonRow>
          <TableRow>
            <TableCell align="left">時計回り</TableCell>
            <KeySelectorCells
              keyConfig={config?.key?.positive}
              onChangeKey={(key) => changeKey('positive', key)}
              applicationShortCuts={applicationShortCuts}
            />
          </TableRow>
          <TableRow>
            <TableCell align="left">反時計回り</TableCell>
            <KeySelectorCells
              keyConfig={config?.key?.negative}
              onChangeKey={(key) => changeKey('negative', key)}
              applicationShortCuts={applicationShortCuts}
            />
          </TableRow>
        </>
      );
    }
    case '4-button': {
      const changeKey = (direction: FourButtonDirection, key: KeyConfig | undefined) =>
        onChange(index, {...config, [direction]: key});
      return (
        <>
          <CommonRow {...commonRowProps} type={config.type} childRowCount={4}>
            <TableCell colSpan={3} />
          </CommonRow>
          {fourButtonDirections.map((direction) => (
            <TableRow key={direction}>
              <TableCell>{stickDirectionLabelMap[direction]}</TableCell>
              <KeySelectorCells
                keyConfig={config[direction]}
                onChangeKey={(key) => changeKey(direction, key)}
                applicationShortCuts={applicationShortCuts}
              />
            </TableRow>
          ))}
        </>
      );
    }
    case '8-button': {
      const changeKey = (direction: EightButtonDirection, key: KeyConfig | undefined) =>
        onChange(index, {...config, [direction]: key});
      return (
        <>
          <CommonRow {...commonRowProps} type={config.type} childRowCount={8}>
            <TableCell colSpan={3} />
          </CommonRow>
          {eightButtonDirections.map((direction) => (
            <TableRow key={direction}>
              <TableCell>{stickDirectionLabelMap[direction]}</TableCell>
              <KeySelectorCells
                keyConfig={config[direction]}
                onChangeKey={(key) => changeKey(direction, key)}
                applicationShortCuts={applicationShortCuts}
              />
            </TableRow>
          ))}
        </>
      );
    }
  }
};

const StickTypeSelect = styled(NativeSelect)`
  min-width: 70px;
`;

const StickTypeSelector: React.FC<{type: SHStickConfig['type']; onChange: (type: string) => void}> = ({
  type,
  onChange,
}) => {
  return (
    <StickTypeSelect value={type ?? ''} onChange={(e) => onChange(e.target.value)}>
      <option value="rotate">回転</option>
      <option value="4-button">4方向ボタン</option>
      <option value="8-button">8方向ボタン</option>
    </StickTypeSelect>
  );
};

const stickDirectionLabelMap = {
  upKey: '上',
  upRightKey: '右上',
  rightKey: '右',
  downRightKey: '右下',
  downKey: '下',
  downLeftKey: '左下',
  leftKey: '左',
  upLeftKey: '左上',
} as const;

interface CommonRowProps {
  readonly label: string;
  readonly childRowCount: number;
  readonly type: SHStickConfig['type'];
  readonly onChangeType: (type: string) => void;
}

const CommonRow: React.FC<CommonRowProps> = ({label, childRowCount, type, onChangeType, children}) => {
  return (
    <>
      <TableRow>
        <TableCell align="left" rowSpan={childRowCount + 1}>
          <BreakableLabel label={label} />
        </TableCell>
        <TableCell align="left">
          <StickTypeSelector type={type} onChange={onChangeType} />
        </TableCell>
        {children}
      </TableRow>
    </>
  );
};

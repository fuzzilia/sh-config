import React from 'react';
import {KeyConfig, SHStickConfig} from '../models/SHConConfig';
import {KeypadStick} from '../models/keypads';
import {ApplicationShortCut} from '../types';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import {BreakableLabel} from './BreakableLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import makeStyles from '@material-ui/core/styles/makeStyles';
import {KeySelectorCells} from './KeyConfigCommon';
import {
  EightButtonDirection,
  eightButtonDirections,
  FourButtonDirection,
  fourButtonDirections,
} from '../models/SHControllerManager';

export interface StickConfigRowProps {
  readonly config: SHStickConfig | undefined;
  readonly stick: KeypadStick;
  readonly index: number;
  readonly onChange: (index: number, config: SHStickConfig | undefined) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

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
      case '8-button':
      case '4-button':
        onChange(index, {type, splitSize: 0});
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
      return (
        <>
          <CommonRow {...commonRowProps} type="rotate" childRowCount={2} />
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
          <CommonRow {...commonRowProps} type={config.type} childRowCount={4} />
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
          <CommonRow {...commonRowProps} type={config.type} childRowCount={8} />
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

const useStylesForStickTypeSelector = makeStyles((theme) => ({
  select: {
    minWidth: 70,
  },
}));

const StickTypeSelector: React.FC<{type: SHStickConfig['type']; onChange: (type: string) => void}> = ({
  type,
  onChange,
}) => {
  const classes = useStylesForStickTypeSelector();
  return (
    <NativeSelect value={type ?? ''} className={classes.select} onChange={(e) => onChange(e.target.value)}>
      <option value="rotate">回転</option>
      <option value="4-button">4方向ボタン</option>
      <option value="8-button">8方向ボタン</option>
    </NativeSelect>
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

const CommonRow: React.FC<CommonRowProps> = ({label, childRowCount, type, onChangeType}) => {
  return (
    <>
      <TableRow>
        <TableCell align="left" rowSpan={childRowCount + 1}>
          <BreakableLabel label={label} />
        </TableCell>
        <TableCell align="left">
          <StickTypeSelector type={type} onChange={onChangeType} />
        </TableCell>
        <TableCell colSpan={3} />
      </TableRow>
    </>
  );
};

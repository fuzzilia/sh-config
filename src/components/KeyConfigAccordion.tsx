import React, {useCallback} from 'react';
import {ApplicationShortCut, KeyConfigByCombination, SetterFunc, SHButtonConfig, SHStickConfig} from '../types';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {ButtonConfigRow} from './ButtonConfigRow';
import {Keypad, KeypadButton} from '../models/keypads';
import {StickConfigRow} from './StickConfigRow';
import {styled} from '@mui/material';
import {SettingAccordionDetails, SettingAccordionTitle} from './Common';

interface KeyConfigAccordionProps {
  readonly keypad: Keypad;
  readonly config: KeyConfigByCombination;
  readonly combinationButtons: readonly KeypadButton[];
  readonly combinationButtonStates: readonly boolean[];
  readonly index: number;
  readonly onChange: (combinationIndex: number, setConfig: SetterFunc<KeyConfigByCombination>) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

const CombinationLabel = styled(Typography)`
  font-size: ${({theme}) => theme.typography.pxToRem(15)};
  color: ${({theme}) => theme.palette.text.secondary};
  align-self: center;
`;

const ButtonChip = styled(Chip)`
  margin-left: ${({theme}) => theme.spacing(1)};
`;

function replaceAt<T>(values: readonly (T | undefined)[], value: T, index: number): (T | undefined)[] {
  const copied = [...values];
  while (copied.length <= index) {
    copied.push(undefined);
  }
  copied[index] = value;
  return copied;
}

export const KeyConfigAccordion = React.memo<KeyConfigAccordionProps>(
  ({keypad, config, combinationButtons, combinationButtonStates, index, onChange, applicationShortCuts}) => {
    const changeButtonConfig = useCallback(
      (buttonIndex: number, buttonConfig: SHButtonConfig) => {
        onChange(index, (prevConfig) => ({
          ...prevConfig,
          buttons: replaceAt(prevConfig.buttons, buttonConfig, buttonIndex),
        }));
      },
      [index, onChange],
    );
    const changeStickConfig = useCallback(
      (stickIndex: number, stickConfig: SHStickConfig | undefined) => {
        onChange(index, (prevConfig) => ({
          ...prevConfig,
          sticks: replaceAt(prevConfig.sticks, stickConfig, stickIndex),
        }));
      },
      [index, onChange],
    );
    const buttons = keypad.buttons.filter((button) => !combinationButtons.includes(button));
    return (
      <Accordion defaultExpanded={index === 0}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <SettingAccordionTitle>キー設定</SettingAccordionTitle>
          <CombinationLabel>組み合わせ : </CombinationLabel>
          {combinationButtons.map((button, index) => (
            <ButtonChip
              key={button.name}
              label={button.label}
              color={combinationButtonStates[index] ? 'secondary' : undefined}
              disabled={!combinationButtonStates[index]}
            />
            // <CombinationButtonStateView key={button.name} label={button.label} isOn={combinationButtonStates[index]} />
          ))}
        </AccordionSummary>
        <SettingAccordionDetails>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="left">設定対象</TableCell>
                <TableCell align="center">操作</TableCell>
                <TableCell align="center">修飾キー</TableCell>
                <TableCell align="center">キー</TableCell>
                {applicationShortCuts && <TableCell align="center">ショートカット</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {buttons.map(
                (keypadButton, buttonIndex) =>
                  !keypadButton.isUnused && (
                    <ButtonConfigRow
                      key={keypadButton.name}
                      index={buttonIndex}
                      button={keypadButton}
                      config={config.buttons[buttonIndex]}
                      onChange={changeButtonConfig}
                      applicationShortCuts={applicationShortCuts}
                      motionEnabled={!!keypad.has6AxisSensor}
                    />
                  ),
              )}
              {keypad.sticks.map((stick, stickIndex) => (
                <StickConfigRow
                  key={stick.name}
                  index={stickIndex}
                  stick={stick}
                  config={config.sticks[stickIndex]}
                  onChange={changeStickConfig}
                  applicationShortCuts={applicationShortCuts}
                />
              ))}
            </TableBody>
          </Table>
        </SettingAccordionDetails>
      </Accordion>
    );
  },
);

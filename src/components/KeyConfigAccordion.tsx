import React, {useCallback} from 'react';
import {ApplicationShortCut, KeyConfigByCombination, SetterFunc} from '../types';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import makeStyles from '@mui/material/styles/makeStyles';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import ExpandMore from '@mui/icons-material/ExpandMore';
import {ButtonConfigRow} from './ButtonConfigRow';
import {SHButtonConfig, SHStickConfig} from '../models/SHConConfig';
import {Keypad, KeypadButton} from '../models/keypads';
import {StickConfigRow} from './StickConfigRow';

interface KeyConfigAccordionProps {
  readonly keypad: Keypad;
  readonly config: KeyConfigByCombination;
  readonly combinationButtons: readonly KeypadButton[];
  readonly combinationButtonStates: readonly boolean[];
  readonly index: number;
  readonly onChange: (combinationIndex: number, setConfig: SetterFunc<KeyConfigByCombination>) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

const useStyles = makeStyles((theme) => ({
  title: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '20%',
    flexShrink: 0,
    alignSelf: 'center',
  },
  combinationLabel: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
    alignSelf: 'center',
  },
  chip: {
    marginLeft: theme.spacing(1),
  },
  detail: {
    overflowX: 'auto',
  },
}));

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
    const classes = useStyles();
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
          <Typography className={classes.title}>キー設定</Typography>
          <Typography className={classes.combinationLabel}>組み合わせ : </Typography>
          {combinationButtons.map((button, index) => (
            <Chip
              key={button.name}
              label={button.label}
              className={classes.chip}
              color={combinationButtonStates[index] ? 'secondary' : undefined}
              disabled={!combinationButtonStates[index]}
            />
            // <CombinationButtonStateView key={button.name} label={button.label} isOn={combinationButtonStates[index]} />
          ))}
        </AccordionSummary>
        <AccordionDetails className={classes.detail}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="left">設定対象</TableCell>
                {keypad.has6AxisSensor && <TableCell align="center">操作</TableCell>}
                <TableCell align="center">修飾キー</TableCell>
                <TableCell align="center">キー</TableCell>
                {applicationShortCuts && <TableCell align="center">ショートカット</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {buttons.map((keypadButton, buttonIndex) => (
                <ButtonConfigRow
                  key={keypadButton.name}
                  index={buttonIndex}
                  button={keypadButton}
                  config={config.buttons[buttonIndex]}
                  onChange={changeButtonConfig}
                  applicationShortCuts={applicationShortCuts}
                  motionEnabled={!!keypad.has6AxisSensor}
                />
              ))}
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
        </AccordionDetails>
      </Accordion>
    );
  },
);

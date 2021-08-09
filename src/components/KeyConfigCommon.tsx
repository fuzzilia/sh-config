import React from 'react';
import NativeSelect from '@material-ui/core/NativeSelect';
import {modifierFromStringValue, modifierKeyOptions, modifierKeyToStringValue} from '../models/ModifierKeys';
import {KeyConfig} from '../models/SHConConfig';
import {ApplicationShortCut} from '../types';
import {isEqualShortCut, keyCodes} from '../models/KeyConfig';
import {Keypad, KeypadButton} from '../models/keypads';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import TableCell from '@material-ui/core/TableCell';

export interface ModifierKeySelectorProps {
  readonly onChange: (key: KeyConfig | undefined) => void;
  readonly keyConfig: KeyConfig | undefined;
  readonly className: string;
}

export const ModifierKeySelector: React.FC<ModifierKeySelectorProps> = ({keyConfig, onChange, className}) => {
  return (
    <NativeSelect
      value={modifierKeyToStringValue(keyConfig)}
      onChange={(e) => onChange({key: keyConfig?.key, ...modifierFromStringValue(e.target.value)})}
      className={className}>
      <option value="" />
      {modifierKeyOptions.map(({label, value}) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </NativeSelect>
  );
};

function shortCutIndex(
  applicationShortCuts: readonly ApplicationShortCut[],
  config: KeyConfig | undefined,
): number | '' {
  if (!config) {
    return '';
  }
  const index = applicationShortCuts.findIndex((shortCut) => isEqualShortCut(shortCut, config));
  return index < 0 ? '' : index;
}

function keyConfigFromShortCut(applicationShortCuts: readonly ApplicationShortCut[], index: any): KeyConfig {
  return {...(index ? applicationShortCuts[Number(index)] : {})};
}

interface ApplicationShortcutSelectorProps {
  readonly onChange: (key: KeyConfig | undefined) => void;
  readonly keyConfig: KeyConfig | undefined;
  readonly className: string;
  readonly applicationShortCuts: readonly ApplicationShortCut[];
}

export const ApplicationShortcutSelector: React.FC<ApplicationShortcutSelectorProps> = ({
  onChange,
  keyConfig,
  className,
  applicationShortCuts,
}) => {
  return (
    <NativeSelect
      value={shortCutIndex(applicationShortCuts, keyConfig)}
      onChange={(e) => onChange(keyConfigFromShortCut(applicationShortCuts, e.target.value))}
      className={className}>
      <option value="" />
      {applicationShortCuts.map(({functionName}, index) => (
        <option key={index} value={index}>
          {functionName}
        </option>
      ))}
    </NativeSelect>
  );
};

interface KeySelectorProps {
  readonly onChange: (key: KeyConfig | undefined) => void;
  readonly keyConfig: KeyConfig | undefined;
  readonly className: string;
}

export const KeySelector: React.FC<KeySelectorProps> = ({keyConfig, onChange, className}) => {
  return (
    <NativeSelect
      value={keyConfig?.key || ''}
      onChange={(e) => onChange(e.target.value ? {...keyConfig, key: Number(e.target.value)} : undefined)}
      className={className}>
      <option value="" />
      {keyCodes.map(([key, keyCode]) => (
        <option key={key} value={keyCode}>
          {key}
        </option>
      ))}
    </NativeSelect>
  );
};

const useStylesForSelectedCombinationButtonView = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: theme.spacing(2),
  },
  combinationLabel: {
    color: theme.palette.text.secondary,
    alignSelf: 'center',
  },
  chip: {
    marginLeft: theme.spacing(1),
  },
  submitButton: {
    marginLeft: theme.spacing(2),
  },
}));

interface SelectedCombinationButtonViewProps {
  readonly combinationButtons: readonly KeypadButton[];
  onEdit(): void;
}

export const SelectedCombinationButtonView: React.FC<SelectedCombinationButtonViewProps> = ({
  combinationButtons,
  onEdit,
}) => {
  const classes = useStylesForSelectedCombinationButtonView();
  return (
    <Box className={classes.root}>
      <Typography className={classes.combinationLabel}>組み合わせボタン :</Typography>
      {combinationButtons.map(({name, label}) => (
        <Chip key={name} label={label} className={classes.chip} />
      ))}
      <Button variant="outlined" color="primary" onClick={onEdit} className={classes.submitButton}>
        編集
      </Button>
    </Box>
  );
};

const useStylesForKeypadNameView = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: theme.spacing(2),
  },
  label: {
    color: theme.palette.text.secondary,
  },
  valueText: {
    marginLeft: theme.spacing(1),
    color: theme.palette.text.primary,
  },
}));

interface KeypadNameViewProps {
  readonly keypad: Keypad;
}

export const KeypadNameView: React.FC<KeypadNameViewProps> = ({keypad}) => {
  const classes = useStylesForKeypadNameView();
  return (
    <Box className={classes.root}>
      <Typography className={classes.label}>デバイス : </Typography>
      <Typography className={classes.valueText}>{keypad.label}</Typography>
    </Box>
  );
};

const useStylesForKeySelectorCells = makeStyles((theme) => ({
  select: {
    minWidth: 70,
  },
}));

interface KeySelectorCellsProps {
  readonly keyConfig: KeyConfig | undefined;
  readonly onChangeKey: (key: KeyConfig | undefined) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

export const KeySelectorCells: React.FC<KeySelectorCellsProps> = ({keyConfig, onChangeKey, applicationShortCuts}) => {
  const classes = useStylesForKeySelectorCells();
  return (
    <>
      <TableCell align="center">
        <ModifierKeySelector keyConfig={keyConfig} onChange={onChangeKey} className={classes.select} />
      </TableCell>
      <TableCell align="center">
        <KeySelector keyConfig={keyConfig} onChange={onChangeKey} className={classes.select} />
      </TableCell>
      {applicationShortCuts && (
        <TableCell align="center">
          <ApplicationShortcutSelector
            keyConfig={keyConfig}
            onChange={onChangeKey}
            className={classes.select}
            applicationShortCuts={applicationShortCuts}
          />
        </TableCell>
      )}
    </>
  );
};

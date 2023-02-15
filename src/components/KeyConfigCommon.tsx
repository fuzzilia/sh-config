import React from 'react';
import NativeSelect from '@mui/material/NativeSelect';
import {modifierFromStringValue, modifierKeyOptions, modifierKeyToStringValue} from '../models/ModifierKeys';
import {ApplicationShortCut, KeyConfig} from '../types';
import {isEqualShortCut, keyCodes} from '../models/KeyConfig';
import {KeypadButton} from '../models/keypads';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TableCell from '@mui/material/TableCell';
import {styled} from '@mui/material';

const CommonSelect = styled(NativeSelect)`
  min-width: 70px;
`;

export interface ModifierKeySelectorProps {
  readonly onChange: (key: KeyConfig | undefined) => void;
  readonly keyConfig: KeyConfig | undefined;
}

export const ModifierKeySelector: React.FC<ModifierKeySelectorProps> = ({keyConfig, onChange}) => {
  return (
    <CommonSelect
      value={modifierKeyToStringValue(keyConfig)}
      onChange={(e) => onChange({key: keyConfig?.key, ...modifierFromStringValue(e.target.value)})}>
      <option value="" />
      {modifierKeyOptions.map(({label, value}) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </CommonSelect>
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
  readonly applicationShortCuts: readonly ApplicationShortCut[];
}

export const ApplicationShortcutSelector: React.FC<ApplicationShortcutSelectorProps> = ({
  onChange,
  keyConfig,
  applicationShortCuts,
}) => {
  return (
    <CommonSelect
      value={shortCutIndex(applicationShortCuts, keyConfig)}
      onChange={(e) => onChange(keyConfigFromShortCut(applicationShortCuts, e.target.value))}>
      <option value="" />
      {applicationShortCuts.map(({functionName}, index) => (
        <option key={index} value={index}>
          {functionName}
        </option>
      ))}
    </CommonSelect>
  );
};

interface KeySelectorProps {
  readonly onChange: (key: KeyConfig | undefined) => void;
  readonly keyConfig: KeyConfig | undefined;
}

export const KeySelector: React.FC<KeySelectorProps> = ({keyConfig, onChange}) => {
  return (
    <CommonSelect
      value={keyConfig?.key || ''}
      onChange={(e) => onChange(e.target.value ? {...keyConfig, key: Number(e.target.value)} : undefined)}>
      <option value="" />
      {keyCodes.map(([key, keyCode]) => (
        <option key={key} value={keyCode}>
          {key}
        </option>
      ))}
    </CommonSelect>
  );
};

const RootBox = styled(Box)`
  display: flex;
  flex-direction: row;
  margin-top: ${({theme}) => theme.spacing(2)};
`;

const CombinationLabel = styled(Typography)`
  color: ${({theme}) => theme.palette.text.secondary};
  align-self: center;
`;

const CombinationButtonChip = styled(Chip)`
  margin-left: ${({theme}) => theme.spacing(1)};
`;

const SubmitButton = styled(Button)`
  margin-left: ${({theme}) => theme.spacing(2)};
`;

interface SelectedCombinationButtonViewProps {
  readonly combinationButtons: readonly KeypadButton[];
  onEdit(): void;
}

export const SelectedCombinationButtonView: React.FC<SelectedCombinationButtonViewProps> = ({
  combinationButtons,
  onEdit,
}) => {
  return (
    <RootBox>
      <CombinationLabel>組み合わせボタン :</CombinationLabel>
      {combinationButtons.map(({name, label}) => (
        <CombinationButtonChip key={name} label={label} />
      ))}
      <SubmitButton variant="outlined" color="primary" onClick={onEdit}>
        編集
      </SubmitButton>
    </RootBox>
  );
};

interface KeySelectorCellsProps {
  readonly keyConfig: KeyConfig | undefined;
  readonly onChangeKey: (key: KeyConfig | undefined) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

export const KeySelectorCells: React.FC<KeySelectorCellsProps> = ({keyConfig, onChangeKey, applicationShortCuts}) => {
  return (
    <>
      <TableCell align="center">
        <ModifierKeySelector keyConfig={keyConfig} onChange={onChangeKey} />
      </TableCell>
      <TableCell align="center">
        <KeySelector keyConfig={keyConfig} onChange={onChangeKey} />
      </TableCell>
      {applicationShortCuts && (
        <TableCell align="center">
          <ApplicationShortcutSelector
            keyConfig={keyConfig}
            onChange={onChangeKey}
            applicationShortCuts={applicationShortCuts}
          />
        </TableCell>
      )}
    </>
  );
};

import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import {KeypadButton} from '../models/keypads';
import {MaxCombinationButtonCount} from '../models/KeyConfig';
import {replaceAt} from '../models/utils';
import {styled} from '@mui/material';

export interface SelectCombinationButtonPanelProps {
  readonly buttons: readonly KeypadButton[];
  readonly defaultSelectedButtonNames: ReadonlySet<string>;
  onChange(selectedButtonNames: string[]): void;
}

const RootBox = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const MainCard = styled(Card)`
  margin: ${({theme}) => theme.spacing(2)};
`;

const CombinationCheckboxGroupBox = styled(Box)`
  margin: ${({theme}) => theme.spacing(2)};
  flex-direction: row;
`;

const SubmitButton = styled(Button)`
  margin: ${({theme}) => theme.spacing(2)};
  align-self: flex-end;
`;

export const SelectCombinationButtonPanel: React.FC<SelectCombinationButtonPanelProps> = ({
  buttons,
  defaultSelectedButtonNames,
  onChange,
}) => {
  const [checkedStates, setCheckedState] = useState<readonly boolean[]>(
    buttons.map(({name}) => defaultSelectedButtonNames.has(name)),
  );
  const checkedCount = checkedStates.filter(Boolean).length;
  return (
    <RootBox>
      <MainCard>
        <CardHeader title="組み合わせボタン選択" />
        <FormControl>
          <FormGroup>
            <CombinationCheckboxGroupBox>
              {buttons.map(({name, label}, index) => (
                <FormControlLabel
                  key={name}
                  control={
                    <Checkbox
                      checked={checkedStates[index]}
                      onChange={(_, checked) => setCheckedState((prev) => replaceAt(prev, checked, index))}
                    />
                  }
                  label={label}
                  disabled={checkedCount >= MaxCombinationButtonCount && !checkedStates[index]}
                />
              ))}
            </CombinationCheckboxGroupBox>
          </FormGroup>
          <SubmitButton
            variant="contained"
            color="primary"
            onClick={() => onChange(buttons.map(({name}) => name).filter((_, i) => checkedStates[i]))}>
            確定
          </SubmitButton>
        </FormControl>
      </MainCard>
    </RootBox>
  );
};

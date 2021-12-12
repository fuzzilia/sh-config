import React, {useState} from 'react';
import makeStyles from '@mui/material/styles/makeStyles';
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

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    margin: theme.spacing(2),
  },
  checkboxGroup: {
    margin: theme.spacing(2),
    flexDirection: 'row',
  },
  form: {},
  submitButton: {
    margin: theme.spacing(2),
    alignSelf: 'flex-end',
  },
}));

export interface SelectCombinationButtonPanelProps {
  readonly buttons: readonly KeypadButton[];
  readonly defaultSelectedButtonNames: ReadonlySet<string>;
  onChange(selectedButtonNames: string[]): void;
}

export const SelectCombinationButtonPanel: React.FC<SelectCombinationButtonPanelProps> = ({
  buttons,
  defaultSelectedButtonNames,
  onChange,
}) => {
  const classes = useStyles();
  const [checkedStates, setCheckedState] = useState<readonly boolean[]>(
    buttons.map(({name}) => defaultSelectedButtonNames.has(name)),
  );
  const checkedCount = checkedStates.filter(Boolean).length;
  return (
    <Box className={classes.root}>
      <Card className={classes.card}>
        <CardHeader title="組み合わせボタン選択" />
        <FormControl className={classes.form}>
          <FormGroup>
            <Box className={classes.checkboxGroup}>
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
            </Box>
          </FormGroup>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onChange(buttons.map(({name}) => name).filter((_, i) => checkedStates[i]))}
            className={classes.submitButton}>
            確定
          </Button>
        </FormControl>
      </Card>
    </Box>
  );
};

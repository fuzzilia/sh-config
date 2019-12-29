import React, { useCallback, useMemo, useState } from 'react';
import './App.css';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Container,
  CssBaseline,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  makeStyles,
  Typography
} from '@material-ui/core';
import {
  applicationNames,
  applicationShortCutDefinitions, applicationShortcutsForOs,
  buildDefaultKeyConfigsForCombinationButtons,
  defaultCombinationButtons,
  defaultKeyConfigs,
  MaxCombinationButtonCount
} from './models/KeyConfig';
import { ApplicationShortCut, KeyConfig, KeyConfigsByCombinationButtonState, OsType } from './types';
import { writeKeyConfig } from './models/writeKeyConfig';
import { KeyConfigExpansionPanel } from './components/KeyConfigExpansionPanel';
import InputLabel from '@material-ui/core/InputLabel';
import NativeSelect from '@material-ui/core/NativeSelect';

function replaceAt<T>(values: readonly T[], newValue: T, at: number): T[] {
  const newValues = [...values];
  newValues[at] = newValue;
  return newValues;
}

const useStyles = makeStyles(theme => ({
  root: {
  },
  title: {
    flexGrow: 1,
    height: 40,
  },
  typeConfigCard: {
    margin: theme.spacing(2),
  },
  osSelect: {
    margin: theme.spacing(2),
    width: 80
  },
  shortcutTypeControl: {
    margin: theme.spacing(2),
    width: 180
  },
  headerForm: {
    margin: theme.spacing(2),
  },
  keyConfigCard: {
    margin: theme.spacing(2),
  },
  keyConfigArea: {
    margin: theme.spacing(2),
  },
  checkboxGroup: {
    flexDirection: 'row'
  },
  submitButton: {
    margin: theme.spacing(2),
    alignSelf: 'flex-end',
  },
}));

const App: React.FC = () => {
  const classes = useStyles();
  const [keyConfigs, setKeyConfigs] = useState<readonly Readonly<KeyConfigsByCombinationButtonState>[]>(defaultKeyConfigs);
  const [combinationButtons, setCombinationButtons] = useState<boolean[]>(defaultCombinationButtons);
  const [osType, setOsType] = useState<OsType | undefined>(undefined);
  const [application, setApplication] = useState<string | undefined>(undefined);
  const onChange = useCallback((combinationIndex: number, configIndex: number, keyConfig: KeyConfig) => {
    setKeyConfigs((prevKeyConfigs) => {
      const nextConfigs = replaceAt(prevKeyConfigs[combinationIndex].configs, keyConfig, configIndex);
      return replaceAt(prevKeyConfigs, { ...prevKeyConfigs[combinationIndex], configs: nextConfigs }, combinationIndex);
    });
  }, []);
  const applicationShortCuts = useMemo<readonly ApplicationShortCut[] | undefined>(() => {
    if (!osType || !application) { return undefined; }
    const index = applicationShortCutDefinitions.findIndex((applicationShortcut) => {
      return applicationShortcut.applicationName === application;
    });
    if (index < 0) { return undefined; }
    return applicationShortcutsForOs(applicationShortCutDefinitions[index], osType);
  }, [application, osType]);
  const onChangeCombinationButton = (index: number, checked: boolean) => {
    const newCombinationButtons = replaceAt(combinationButtons, checked, index);
    setCombinationButtons(newCombinationButtons);
    setKeyConfigs(buildDefaultKeyConfigsForCombinationButtons(newCombinationButtons));
  };
  const checkedCount = combinationButtons.filter((value) => value).length;

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="static">
        <Typography variant="h6" className={classes.title}>
          fuzzilia 左手デバイス 設定ツール
        </Typography>
      </AppBar>
      <Container maxWidth="md">
        <Box display="flex" flexDirection="column">
          <Card className={classes.typeConfigCard}>
            <CardHeader title="全体設定" />
            <Box display="flex" flexDirection="column">
              <Box display="flex" flexDirection="row">
                <FormControl className={classes.shortcutTypeControl}>
                  <InputLabel htmlFor="shortcut-type">アプリケーション</InputLabel>
                  <NativeSelect
                    value={application}
                    onChange={(e) => setApplication(e.target.value || undefined)}
                    inputProps={{
                      name: 'application',
                      id: 'application',
                    }}
                  >
                    <option value="" />
                    {applicationNames.map((applicationName) =>
                      <option key={applicationName} value={applicationName}>{applicationName}</option>)}
                  </NativeSelect>
                </FormControl>
                <FormControl className={classes.osSelect}>
                  <InputLabel htmlFor="shortcut-type">OS</InputLabel>
                  <NativeSelect
                    value={osType}
                    onChange={(e) => setOsType(e.target.value ? Number(e.target.value) : undefined)}
                    inputProps={{
                      name: 'os-type',
                      id: 'os-type',
                    }}
                  >
                    <option value="" />
                    <option value={OsType.IOS}>iOS</option>
                    <option value={OsType.MAC}>Mac</option>
                    <option value={OsType.WINDOWS}>Windows</option>
                  </NativeSelect>
                </FormControl>
              </Box>
              <FormControl className={classes.headerForm}>
                <FormGroup>
                  <FormLabel component="legend">組み合わせボタン</FormLabel>
                  <Box className={classes.checkboxGroup}>
                    {combinationButtons.map((isSelected, index) => (
                      <FormControlLabel
                        key={index}
                        control={<Checkbox checked={isSelected} onChange={(e, checked) => onChangeCombinationButton(index, checked)} />}
                        label={index + 1}
                        disabled={checkedCount >= MaxCombinationButtonCount && !isSelected}
                      />
                    ))}
                  </Box>
                </FormGroup>
              </FormControl>
            </Box>
          </Card>
          <Box className={classes.keyConfigArea}>
            {keyConfigs.map((keyConfig, index) => (
              <KeyConfigExpansionPanel
                key={index}
                {...keyConfig}
                index={index}
                onChange={onChange}
                applicationShortCuts={applicationShortCuts}
              />
            ))}
          </Box>
          <Button
            variant="contained"
            color="primary"
            onClick={() => writeKeyConfig(keyConfigs)}
            className={classes.submitButton}
          >
            書き込み
          </Button>
        </Box>
      </Container>
    </div>
  );
};

export default App;

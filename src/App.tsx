import React, {useCallback, useMemo, useState} from 'react';
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import FormControl from '@material-ui/core/FormControl';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import {
  applicationNames,
  applicationShortCutDefinitions,
  applicationShortcutsForOs,
  changeSelectedCombinationButton,
  combinationButtonCountToCombinationCount,
  makeCombinations,
} from './models/KeyConfig';
import {ApplicationShortCut, KeyConfigByCombination, KeyConfigState, OsType, SetterFunc} from './types';
import {KeyConfigAccordion} from './components/KeyConfigAccordion';
import InputLabel from '@material-ui/core/InputLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import {Keypad, keypads} from './models/keypads';
import {SelectKeypadPanel} from './components/SelectKeypadPanel';
import {SelectCombinationButtonPanel} from './components/SelectCombinationButtonPanel';
import {SelectedCombinationButtonView} from './components/KeyConfigCommon';
import {TextField} from '@material-ui/core';
import Button from '@material-ui/core/Button';
import {saveConfig} from './models/ConfigStorage';
import {JoyConTestModal} from './components/JoyConTestModal';
import {keyConfigStateToSHConfig, setConfigForCombinationForKeyConfigState} from './models/SHConConfig';
import {encodeSHConfig} from './models/SHConfigEncoder';
import {decodeSHConfig} from './models/SHConfigDecoder';

const useStyles = makeStyles((theme) => ({
  root: {},
  appBarContent: {
    display: 'flex',
    alignItems: 'center',
  },
  rootBox: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    flexGrow: 1,
    height: 40,
  },
  typeConfigCard: {
    margin: theme.spacing(2),
  },
  typeConfigCardContent: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
  },
  osSelect: {
    // margin: theme.spacing(2),
    width: 80,
  },
  formLabel: {
    color: theme.palette.text.secondary,
  },
  formInput: {
    marginLeft: theme.spacing(2),
  },
  formValue: {
    marginLeft: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  formOptionButton: {
    marginLeft: theme.spacing(2),
  },
  formRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutTypeControl: {
    width: 180,
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
    flexDirection: 'row',
  },
  submitButton: {
    margin: theme.spacing(2),
    alignSelf: 'flex-end',
  },
}));

export const App: React.FC = () => {
  const classes = useStyles();
  const [configState, setConfigState] = useState<KeyConfigState | undefined>(undefined);
  const [lastSavedConfig, setLastSavedConfig] = useState<KeyConfigState | undefined>(undefined);
  const [combinationIsFixed, setCombinationIsFixed] = useState<boolean>(false);
  const [osType, setOsType] = useState<OsType | undefined>(undefined);
  const [application, setApplication] = useState<string | undefined>(undefined);
  const [testModalIsOpen, setTestModalIsOpen] = useState<boolean>(false);
  const selectedKeypad: Keypad | undefined =
    configState && keypads.find((keypad) => keypad.name === configState.selectedKeypad);
  const combinationButtonCount = configState ? configState.selectedCombinationButtonNames.length : 0;
  const combinationCount = combinationButtonCountToCombinationCount(combinationButtonCount);
  const combinations = useMemo(() => makeCombinations(combinationButtonCount), [combinationButtonCount]);
  const combinationButtonNames = useMemo(
    () => new Set(configState?.selectedCombinationButtonNames),
    [configState?.selectedCombinationButtonNames],
  );
  const combinationButtons = useMemo(
    () => (selectedKeypad ? selectedKeypad.buttons.filter((button) => combinationButtonNames.has(button.name)) : []),
    [selectedKeypad, combinationButtonNames],
  );

  const changeConfigsByCombination = useCallback(
    (combinationIndex: number, setConfig: SetterFunc<KeyConfigByCombination>) =>
      setConfigState(
        (prevConfig) =>
          prevConfig &&
          setConfigForCombinationForKeyConfigState(
            prevConfig,
            combinationIndex,
            setConfig(prevConfig.configsByCombination[combinationIndex]),
          ),
      ),
    [],
  );
  const setKeyConfigState = useCallback((keyConfigState: KeyConfigState, combinationIsFixed: boolean) => {
    setConfigState(keyConfigState);
    setCombinationIsFixed(combinationIsFixed);
    if (combinationIsFixed) {
      setLastSavedConfig(keyConfigState);
    }
  }, []);
  const onChangeCombination = useCallback((selectedButtonNames: string[]) => {
    setConfigState((prev) => prev && changeSelectedCombinationButton(prev, selectedButtonNames));
    setCombinationIsFixed(true);
  }, []);
  const applicationShortCuts = useMemo<readonly ApplicationShortCut[] | undefined>(() => {
    if (!osType || !application) {
      return undefined;
    }
    const index = applicationShortCutDefinitions.findIndex((applicationShortcut) => {
      return applicationShortcut.applicationName === application;
    });
    if (index < 0) {
      return undefined;
    }
    return applicationShortcutsForOs(applicationShortCutDefinitions[index], osType);
  }, [application, osType]);

  const save = () => {
    if (configState?.selectedKeypad) {
      saveConfig(configState.id, configState.label, configState.createdAt, keyConfigStateToSHConfig(configState));
      setLastSavedConfig(configState);
    }
  };
  const clean = () => {
    if (configState === lastSavedConfig || confirm('保存していない設定は消えますが、よろしいですか？')) {
      setConfigState(undefined);
      setLastSavedConfig(undefined);
      setCombinationIsFixed(false);
    }
  };
  const openTestModal = useCallback(() => setTestModalIsOpen(true), []);
  const closeTestModal = useCallback(() => setTestModalIsOpen(false), []);

  let dataSize = 0;
  if (configState?.selectedKeypad) {
    const originConfig = keyConfigStateToSHConfig(configState);
    const encoded = encodeSHConfig(keypads, originConfig);
    dataSize = encoded.byteLength;
    console.log(encoded);
    // const decoded = decodeSHConfig(keypads, encoded.buffer);
    // console.log({originConfig, encoded, decoded});
  }

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="static">
        <Box className={classes.appBarContent}>
          <Typography variant="h6" className={classes.title}>
            fuzzilia 左手デバイス 設定ツール
          </Typography>
          <FormControl className={classes.shortcutTypeControl}>
            {/*<InputLabel>アプリケーション</InputLabel>*/}
            <NativeSelect
              value={application}
              placeholder="アプリケーション"
              onChange={(e) => setApplication(e.target.value || undefined)}
              inputProps={{name: 'application', id: 'application'}}>
              <option value="">アプリケーションを選択...</option>
              {applicationNames.map((applicationName) => (
                <option key={applicationName} value={applicationName}>
                  {applicationName}
                </option>
              ))}
            </NativeSelect>
          </FormControl>
          <FormControl className={classes.osSelect}>
            {/*<InputLabel variant="outlined">OS</InputLabel>*/}
            <NativeSelect
              value={osType}
              onChange={(e) => setOsType(e.target.value ? Number(e.target.value) : undefined)}
              inputProps={{
                name: 'os-type',
                id: 'os-type',
              }}>
              <option value="" />
              <option value={OsType.IOS}>iOS</option>
              <option value={OsType.MAC}>Mac</option>
              <option value={OsType.WINDOWS}>Windows</option>
            </NativeSelect>
          </FormControl>
        </Box>
      </AppBar>
      <Container maxWidth="md">
        {configState && selectedKeypad ? (
          combinationIsFixed ? (
            <Box className={classes.rootBox}>
              <Card className={classes.typeConfigCard}>
                <CardHeader
                  title="基本設定"
                  action={
                    <Button variant="outlined" color="secondary" onClick={clean}>
                      初期画面に戻る
                    </Button>
                  }
                />
                <Box className={classes.typeConfigCardContent}>
                  <Box className={classes.formRow}>
                    <Typography className={classes.formLabel}>設定名 : </Typography>
                    <TextField
                      className={classes.formInput}
                      value={configState.label}
                      onChange={(e) => setConfigState({...configState, label: e.target.value})}
                    />
                    <Button variant="outlined" color="primary" onClick={save} className={classes.formOptionButton}>
                      ブラウザに保存
                    </Button>
                  </Box>
                  <Box className={classes.formRow}>
                    <Typography className={classes.formLabel}>データサイズ : </Typography>
                    <Typography className={classes.formValue}>{dataSize}</Typography>
                  </Box>
                  <Box className={classes.formRow}>
                    <Typography className={classes.formLabel}>デバイス : </Typography>
                    <Typography className={classes.formValue}>{selectedKeypad.label}</Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={openTestModal}
                      className={classes.formOptionButton}>
                      ブラウザで試す
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={async () => {
                        if (!navigator.bluetooth) {
                          alert('WebBLE未対応のブラウザです。');
                          return;
                        }
                        const KeyConfigServiceUuid = '20FDDC1C-6B54-4523-A8DD-728B79F7525F'.toLowerCase();
                        const KeyConfigCharacteristicUuid = 'AE96F2AE-7485-4B8C-8E79-B353546A47EE'.toLowerCase();

                        const device = await navigator.bluetooth.requestDevice({
                          acceptAllDevices: true,
                          optionalServices: [KeyConfigServiceUuid],
                        });
                        if (!device.gatt) {
                          alert('デバイスが見つかりませんでした。');
                          return;
                        }

                        try {
                          console.log('start connect');
                          const gatt = await device.gatt!.connect();
                          console.log('gatt');
                          const services = await gatt.getPrimaryService(KeyConfigServiceUuid);
                          console.log('services');
                          const characteristic = await services.getCharacteristic(KeyConfigCharacteristicUuid);
                          console.log('characteristic');
                          const originConfig = keyConfigStateToSHConfig(configState);
                          const encoded = encodeSHConfig(keypads, originConfig);
                          await characteristic.writeValue(encoded);
                          alert('書き込み完了しました。');
                          gatt.disconnect();
                        } catch (error) {
                          alert('なんかエラー出た…');
                          console.error(error.toString());
                        }
                      }}
                      className={classes.formOptionButton}>
                      書き込み
                    </Button>
                  </Box>
                  <SelectedCombinationButtonView
                    combinationButtons={combinationButtons}
                    onEdit={() => setCombinationIsFixed(false)}
                  />
                </Box>
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
                        }}>
                        <option value="" />
                        {applicationNames.map((applicationName) => (
                          <option key={applicationName} value={applicationName}>
                            {applicationName}
                          </option>
                        ))}
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
                        }}>
                        <option value="" />
                        <option value={OsType.IOS}>iOS</option>
                        <option value={OsType.MAC}>Mac</option>
                        <option value={OsType.WINDOWS}>Windows</option>
                      </NativeSelect>
                    </FormControl>
                  </Box>
                </Box>
              </Card>
              <Box className={classes.keyConfigArea}>
                {[...Array(combinationCount)].map((_, index) => (
                  <KeyConfigAccordion
                    key={index}
                    keypad={selectedKeypad}
                    index={index}
                    onChange={changeConfigsByCombination}
                    applicationShortCuts={applicationShortCuts}
                    combinationButtonStates={combinations[index]}
                    combinationButtons={combinationButtons}
                    config={configState.configsByCombination[index]}
                  />
                ))}
              </Box>
              <JoyConTestModal
                keypad={selectedKeypad}
                onClose={closeTestModal}
                isOpen={testModalIsOpen}
                configState={configState}
              />
            </Box>
          ) : (
            <SelectCombinationButtonPanel
              buttons={selectedKeypad.buttons}
              defaultSelectedButtonNames={combinationButtonNames}
              onChange={onChangeCombination}
            />
          )
        ) : (
          <SelectKeypadPanel onChange={setKeyConfigState} />
        )}
      </Container>
    </div>
  );
};

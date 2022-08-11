import React, {useCallback, useMemo, useRef, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import Typography from '@mui/material/Typography';
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
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import {Keypad, keypads} from './models/keypads';
import {SelectKeypadPanel} from './components/SelectKeypadPanel';
import {SelectCombinationButtonPanel} from './components/SelectCombinationButtonPanel';
import {SelectedCombinationButtonView} from './components/KeyConfigCommon';
import {styled} from '@mui/material';
import Button from '@mui/material/Button';
import {saveConfig} from './models/ConfigStorage';
import {keyConfigStateToSHConfig, setConfigForCombinationForKeyConfigState} from './models/SHConConfig';
import {encodeSHConfig} from './models/SHConfigEncoder';
import {FormLabel, FormOptionButton, FormRowBox, FormTextField, FormValueText} from './components/FormCommon';
import {DeviceFormRow} from './components/DeviceFormRow';

const MainContentBox = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const TypeConfigCard = styled(Card)`
  margin: ${({theme}) => theme.spacing(2)};
`;

const TypeConfigCardContent = styled(Box)`
  margin-left: ${({theme}) => theme.spacing(2)};
  margin-right: ${({theme}) => theme.spacing(2)};
  display: flex;
  flex-direction: column;
`;

const KeyConfigArea = styled(Box)`
  margin: ${({theme}) => theme.spacing(2)};
`;

const Title = styled(Typography)`
  flex-grow: 1;
  height: 40px;
`;

const AppBarContent = styled(Box)`
  display: flex;
  align-items: center;
`;

const ShortCutTypeFormControl = styled(FormControl)`
  width: 180px;
`;

const OsFormControl = styled(FormControl)`
  width: 80px;
`;

export const App: React.FC = () => {
  const [configState, setConfigState] = useState<KeyConfigState | undefined>(undefined);
  const [lastSavedConfig, setLastSavedConfig] = useState<KeyConfigState | undefined>(undefined);
  const [combinationIsFixed, setCombinationIsFixed] = useState<boolean>(false);
  const [osType, setOsType] = useState<OsType | undefined>(undefined);
  const [application, setApplication] = useState<string | undefined>(undefined);
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
      alert('保存に成功しました。');
    }
  };
  const clean = () => {
    if (configState === lastSavedConfig || confirm('保存していない設定は消えますが、よろしいですか？')) {
      setConfigState(undefined);
      setLastSavedConfig(undefined);
      setCombinationIsFixed(false);
    }
  };

  let dataSize = 0;
  if (configState?.selectedKeypad) {
    const originConfig = keyConfigStateToSHConfig(configState);
    const encoded = encodeSHConfig(keypads, originConfig);
    dataSize = encoded.byteLength;
    // console.log(encoded);
    // const decoded = decodeSHConfig(keypads, encoded.buffer);
    // console.log({originConfig, encoded, decoded});
  }

  return (
    <div>
      <CssBaseline />
      <AppBar position="static">
        <AppBarContent>
          <Title variant="h6">SH-Controller 設定ツール</Title>
          {/*<ShortCutTypeFormControl>*/}
          {/*  <NativeSelect*/}
          {/*    value={application}*/}
          {/*    placeholder="アプリケーション"*/}
          {/*    onChange={(e) => setApplication(e.target.value || undefined)}*/}
          {/*    inputProps={{name: 'application', id: 'application'}}>*/}
          {/*    <option value="">アプリケーションを選択...</option>*/}
          {/*    {applicationNames.map((applicationName) => (*/}
          {/*      <option key={applicationName} value={applicationName}>*/}
          {/*        {applicationName}*/}
          {/*      </option>*/}
          {/*    ))}*/}
          {/*  </NativeSelect>*/}
          {/*</ShortCutTypeFormControl>*/}
          {/*<OsFormControl>*/}
          {/*  <NativeSelect*/}
          {/*    value={osType}*/}
          {/*    onChange={(e) => setOsType(e.target.value ? Number(e.target.value) : undefined)}*/}
          {/*    inputProps={{name: 'os-type', id: 'os-type'}}>*/}
          {/*    <option value="" />*/}
          {/*    <option value={OsType.IOS}>iOS</option>*/}
          {/*    <option value={OsType.MAC}>Mac</option>*/}
          {/*    <option value={OsType.WINDOWS}>Windows</option>*/}
          {/*  </NativeSelect>*/}
          {/*</OsFormControl>*/}
        </AppBarContent>
      </AppBar>
      <Container maxWidth="md">
        {configState && selectedKeypad ? (
          combinationIsFixed ? (
            <MainContentBox>
              <TypeConfigCard>
                <CardHeader
                  title="基本設定"
                  action={
                    <Button variant="outlined" color="secondary" onClick={clean}>
                      初期画面に戻る
                    </Button>
                  }
                />
                <TypeConfigCardContent>
                  <FormRowBox>
                    <FormLabel>設定名 : </FormLabel>
                    <FormTextField
                      value={configState.label}
                      onChange={(e) => setConfigState({...configState, label: e.target.value})}
                    />
                    <FormOptionButton variant="outlined" color="primary" onClick={save}>
                      ブラウザに保存
                    </FormOptionButton>
                  </FormRowBox>
                  <FormRowBox>
                    <FormLabel>データサイズ : </FormLabel>
                    <FormValueText>{dataSize}</FormValueText>
                  </FormRowBox>
                  <DeviceFormRow keypad={selectedKeypad} configState={configState} />
                  <SelectedCombinationButtonView
                    combinationButtons={combinationButtons}
                    onEdit={() => setCombinationIsFixed(false)}
                  />
                </TypeConfigCardContent>
                {/*<Box display="flex" flexDirection="column">*/}
                {/*  <Box display="flex" flexDirection="row">*/}
                {/*    <ShortCutTypeFormControl>*/}
                {/*      <InputLabel htmlFor="shortcut-type">アプリケーション</InputLabel>*/}
                {/*      <NativeSelect*/}
                {/*        value={application}*/}
                {/*        onChange={(e) => setApplication(e.target.value || undefined)}*/}
                {/*        inputProps={{*/}
                {/*          name: 'application',*/}
                {/*          id: 'application',*/}
                {/*        }}>*/}
                {/*        <option value="" />*/}
                {/*        {applicationNames.map((applicationName) => (*/}
                {/*          <option key={applicationName} value={applicationName}>*/}
                {/*            {applicationName}*/}
                {/*          </option>*/}
                {/*        ))}*/}
                {/*      </NativeSelect>*/}
                {/*    </ShortCutTypeFormControl>*/}
                {/*    <OsFormControl>*/}
                {/*      <InputLabel htmlFor="shortcut-type">OS</InputLabel>*/}
                {/*      <NativeSelect*/}
                {/*        value={osType}*/}
                {/*        onChange={(e) => setOsType(e.target.value ? Number(e.target.value) : undefined)}*/}
                {/*        inputProps={{*/}
                {/*          name: 'os-type',*/}
                {/*          id: 'os-type',*/}
                {/*        }}>*/}
                {/*        <option value="" />*/}
                {/*        <option value={OsType.IOS}>iOS</option>*/}
                {/*        <option value={OsType.MAC}>Mac</option>*/}
                {/*        <option value={OsType.WINDOWS}>Windows</option>*/}
                {/*      </NativeSelect>*/}
                {/*    </OsFormControl>*/}
                {/*  </Box>*/}
                {/*</Box>*/}
              </TypeConfigCard>
              <KeyConfigArea>
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
              </KeyConfigArea>
            </MainContentBox>
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

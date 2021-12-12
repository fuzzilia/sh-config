import React, {useCallback, useMemo, useRef, useState} from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import makeStyles from '@mui/material/styles/makeStyles';
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
import {styled, TextField} from '@mui/material';
import Button from '@mui/material/Button';
import {saveConfig} from './models/ConfigStorage';
import {JoyConTestModal} from './components/JoyConTestModal';
import {keyConfigStateToSHConfig, setConfigForCombinationForKeyConfigState} from './models/SHConConfig';
import {encodeSHConfig} from './models/SHConfigEncoder';
import {decodeSHConfig} from './models/SHConfigDecoder';
import {KeyConfigService} from './models/KeyConfigService';
import {PairingModal} from './components/PairingModal';

// const useStyles = makeStyles((theme) => ({
//   root: {},
//   appBarContent: {
//     display: 'flex',
//     alignItems: 'center',
//   },
//   rootBox: {
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   typeConfigCard: {
//     margin: theme.spacing(2),
//   },
//   typeConfigCardContent: {
//     marginLeft: theme.spacing(2),
//     marginRight: theme.spacing(2),
//     display: 'flex',
//     flexDirection: 'column',
//   },
//   osSelect: {
//     // margin: theme.spacing(2),
//     width: 80,
//   },
//   formLabel: {
//     color: theme.palette.text.secondary,
//   },
//   formInput: {
//     marginLeft: theme.spacing(2),
//   },
//   formValue: {
//     marginLeft: theme.spacing(1),
//     color: theme.palette.text.primary,
//   },
//   formOptionButton: {
//     marginLeft: theme.spacing(2),
//   },
//   formRow: {
//     display: 'flex',
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   headerForm: {
//     margin: theme.spacing(2),
//   },
//   keyConfigCard: {
//     margin: theme.spacing(2),
//   },
//   checkboxGroup: {
//     flexDirection: 'row',
//   },
//   submitButton: {
//     margin: theme.spacing(2),
//     alignSelf: 'flex-end',
//   },
// }));

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
  const keyConfigServiceRef = useRef<KeyConfigService>();
  const [configState, setConfigState] = useState<KeyConfigState | undefined>(undefined);
  const [lastSavedConfig, setLastSavedConfig] = useState<KeyConfigState | undefined>(undefined);
  const [combinationIsFixed, setCombinationIsFixed] = useState<boolean>(false);
  const [osType, setOsType] = useState<OsType | undefined>(undefined);
  const [application, setApplication] = useState<string | undefined>(undefined);
  const [testModalIsOpen, setTestModalIsOpen] = useState<boolean>(false);
  const [pairingModelIsOpen, setPairingModalIsOpen] = useState<boolean>(false);
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
  const closePairingModal = useCallback(() => setPairingModalIsOpen(false), []);

  const connect = useCallback(async () => {
    if (!keyConfigServiceRef.current) {
      try {
        if (!navigator.bluetooth) {
          alert('WebBLE未対応のブラウザです。');
          return;
        }
        const service = await KeyConfigService.connect(navigator.bluetooth);
        if (!service) {
          return;
        }
        keyConfigServiceRef.current = service;
      } catch (error) {
        console.error(error);
        alert(error?.message ?? '不明なエラーが発生しました。');
      }
    }
  }, []);
  const writeConfig = useCallback(async () => {
    if (!keyConfigServiceRef.current) {
      alert('未接続です。');
      return;
    }
    if (!configState) {
      alert('設定がありません。');
      return;
    }
    try {
      await keyConfigServiceRef.current.writeConfig(keyConfigStateToSHConfig(configState));
    } catch (error) {
      console.error(error);
      alert(error?.message ?? '不明なエラーが発生しました。');
    }
  }, [configState]);
  const scan = useCallback(() => setPairingModalIsOpen(true), []);

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
    <div>
      <CssBaseline />

      <AppBar position="static">
        <AppBarContent>
          <Title variant="h6">fuzzilia 左手デバイス 設定ツール</Title>
          <ShortCutTypeFormControl>
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
          </ShortCutTypeFormControl>
          <OsFormControl>
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
          </OsFormControl>
        </AppBarContent>
      </AppBar>
      <Container maxWidth="md">
        <KeyConfigArea>
          {/*{[...Array(combinationCount)].map((_, index) => (*/}
          {/*  <KeyConfigAccordion*/}
          {/*    key={index}*/}
          {/*    keypad={selectedKeypad}*/}
          {/*    index={index}*/}
          {/*    onChange={changeConfigsByCombination}*/}
          {/*    applicationShortCuts={applicationShortCuts}*/}
          {/*    combinationButtonStates={combinations[index]}*/}
          {/*    combinationButtons={combinationButtons}*/}
          {/*    config={configState.configsByCombination[index]}*/}
          {/*  />*/}
          {/*))}*/}
        </KeyConfigArea>
      </Container>
    </div>
  );

  // return (
  //   <div className={classes.root}>
  //     <CssBaseline />
  //     <AppBar position="static">
  //       <Box className={classes.appBarContent}>
  //         <Typography variant="h6" className={classes.title}>
  //           fuzzilia 左手デバイス 設定ツール
  //         </Typography>
  //         <FormControl className={classes.shortcutTypeControl}>
  //           {/*<InputLabel>アプリケーション</InputLabel>*/}
  //           <NativeSelect
  //             value={application}
  //             placeholder="アプリケーション"
  //             onChange={(e) => setApplication(e.target.value || undefined)}
  //             inputProps={{name: 'application', id: 'application'}}>
  //             <option value="">アプリケーションを選択...</option>
  //             {applicationNames.map((applicationName) => (
  //               <option key={applicationName} value={applicationName}>
  //                 {applicationName}
  //               </option>
  //             ))}
  //           </NativeSelect>
  //         </FormControl>
  //         <FormControl className={classes.osSelect}>
  //           {/*<InputLabel variant="outlined">OS</InputLabel>*/}
  //           <NativeSelect
  //             value={osType}
  //             onChange={(e) => setOsType(e.target.value ? Number(e.target.value) : undefined)}
  //             inputProps={{
  //               name: 'os-type',
  //               id: 'os-type',
  //             }}>
  //             <option value="" />
  //             <option value={OsType.IOS}>iOS</option>
  //             <option value={OsType.MAC}>Mac</option>
  //             <option value={OsType.WINDOWS}>Windows</option>
  //           </NativeSelect>
  //         </FormControl>
  //       </Box>
  //     </AppBar>
  //     <Container maxWidth="md">
  //       {configState && selectedKeypad ? (
  //         combinationIsFixed ? (
  //           <Box className={classes.rootBox}>
  //             <Card className={classes.typeConfigCard}>
  //               <CardHeader
  //                 title="基本設定"
  //                 action={
  //                   <Button variant="outlined" color="secondary" onClick={clean}>
  //                     初期画面に戻る
  //                   </Button>
  //                 }
  //               />
  //               <Box className={classes.typeConfigCardContent}>
  //                 <Box className={classes.formRow}>
  //                   <Typography className={classes.formLabel}>設定名 : </Typography>
  //                   <TextField
  //                     className={classes.formInput}
  //                     value={configState.label}
  //                     onChange={(e) => setConfigState({...configState, label: e.target.value})}
  //                   />
  //                   <Button variant="outlined" color="primary" onClick={save} className={classes.formOptionButton}>
  //                     ブラウザに保存
  //                   </Button>
  //                 </Box>
  //                 <Box className={classes.formRow}>
  //                   <Typography className={classes.formLabel}>データサイズ : </Typography>
  //                   <Typography className={classes.formValue}>{dataSize}</Typography>
  //                 </Box>
  //                 <Box className={classes.formRow}>
  //                   <Typography className={classes.formLabel}>デバイス : </Typography>
  //                   <Typography className={classes.formValue}>{selectedKeypad.label}</Typography>
  //                   <Button
  //                     variant="outlined"
  //                     color="primary"
  //                     onClick={openTestModal}
  //                     className={classes.formOptionButton}>
  //                     ブラウザで試す
  //                   </Button>
  //                   <Button variant="outlined" color="primary" onClick={connect} className={classes.formOptionButton}>
  //                     接続
  //                   </Button>
  //                   <Button
  //                     variant="outlined"
  //                     color="primary"
  //                     onClick={writeConfig}
  //                     className={classes.formOptionButton}>
  //                     書き込み
  //                   </Button>
  //                   <Button variant="outlined" color="primary" onClick={scan} className={classes.formOptionButton}>
  //                     ペアリング
  //                   </Button>
  //                 </Box>
  //                 <SelectedCombinationButtonView
  //                   combinationButtons={combinationButtons}
  //                   onEdit={() => setCombinationIsFixed(false)}
  //                 />
  //               </Box>
  //               <Box display="flex" flexDirection="column">
  //                 <Box display="flex" flexDirection="row">
  //                   <FormControl className={classes.shortcutTypeControl}>
  //                     <InputLabel htmlFor="shortcut-type">アプリケーション</InputLabel>
  //                     <NativeSelect
  //                       value={application}
  //                       onChange={(e) => setApplication(e.target.value || undefined)}
  //                       inputProps={{
  //                         name: 'application',
  //                         id: 'application',
  //                       }}>
  //                       <option value="" />
  //                       {applicationNames.map((applicationName) => (
  //                         <option key={applicationName} value={applicationName}>
  //                           {applicationName}
  //                         </option>
  //                       ))}
  //                     </NativeSelect>
  //                   </FormControl>
  //                   <FormControl className={classes.osSelect}>
  //                     <InputLabel htmlFor="shortcut-type">OS</InputLabel>
  //                     <NativeSelect
  //                       value={osType}
  //                       onChange={(e) => setOsType(e.target.value ? Number(e.target.value) : undefined)}
  //                       inputProps={{
  //                         name: 'os-type',
  //                         id: 'os-type',
  //                       }}>
  //                       <option value="" />
  //                       <option value={OsType.IOS}>iOS</option>
  //                       <option value={OsType.MAC}>Mac</option>
  //                       <option value={OsType.WINDOWS}>Windows</option>
  //                     </NativeSelect>
  //                   </FormControl>
  //                 </Box>
  //               </Box>
  //             </Card>
  //             <Box className={classes.keyConfigArea}>
  //               {[...Array(combinationCount)].map((_, index) => (
  //                 <KeyConfigAccordion
  //                   key={index}
  //                   keypad={selectedKeypad}
  //                   index={index}
  //                   onChange={changeConfigsByCombination}
  //                   applicationShortCuts={applicationShortCuts}
  //                   combinationButtonStates={combinations[index]}
  //                   combinationButtons={combinationButtons}
  //                   config={configState.configsByCombination[index]}
  //                 />
  //               ))}
  //             </Box>
  //             <JoyConTestModal
  //               keypad={selectedKeypad}
  //               onClose={closeTestModal}
  //               isOpen={testModalIsOpen}
  //               configState={configState}
  //             />
  //             <PairingModal
  //               keyConfigServiceRef={keyConfigServiceRef}
  //               onClose={closePairingModal}
  //               isOpen={pairingModelIsOpen}
  //             />
  //           </Box>
  //         ) : (
  //           <SelectCombinationButtonPanel
  //             buttons={selectedKeypad.buttons}
  //             defaultSelectedButtonNames={combinationButtonNames}
  //             onChange={onChangeCombination}
  //           />
  //         )
  //       ) : (
  //         <SelectKeypadPanel onChange={setKeyConfigState} />
  //       )}
  //     </Container>
  //   </div>
  // );
};

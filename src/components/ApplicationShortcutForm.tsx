import React, {useCallback, useState} from 'react';
import {styled} from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import {ApplicationShortcut, ApplicationShortcutGroup, ApplicationShortcutItem} from '../types';
import {FormLabel, FormRowBox, FormTextField} from './FormCommon';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import {SettingAccordionDetails, SettingAccordionTitle} from './Common';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import {KeySelector} from './KeyConfigCommon';
import {replaceAt} from '../models/utils';

const RootBox = styled(Box)`
  display: flex;
  flex-direction: column;
`;

const MainCard = styled(Card)`
  margin: ${({theme}) => theme.spacing(2)};
  padding: ${({theme}) => theme.spacing(2)};
`;

interface Props {
  readonly initialShortcut: ApplicationShortcut;
}

export const ApplicationShortcutForm: React.FC<Props> = (props) => {
  const [shortcut, setShortcut] = useState(props.initialShortcut);

  return (
    <RootBox>
      <MainCard>
        <FormRowBox>
          <FormLabel>設定名 : </FormLabel>
          <FormTextField
            value={shortcut.applicationName}
            onChange={(e) => setShortcut({...shortcut, applicationName: e.target.value})}
          />
        </FormRowBox>
      </MainCard>
      {shortcut.groups.map((group, index) => (
        <ShortcutFormAccordion index={index} group={group} />
      ))}
    </RootBox>
  );
};

interface ShortcutFormAccordionProps {
  readonly index: number;
  readonly group: ApplicationShortcutGroup;
  readonly onChange: (index: number, group: ApplicationShortcutGroup) => void;
}

const ShortcutFormAccordion: React.FC<ShortcutFormAccordionProps> = ({index, group, onChange}) => {
  const changeItem = useCallback(
    (itemIndex: number, item: ApplicationShortcutItem | undefined) => {
      if (item) {
        onChange(index, {...group, shortcuts: replaceAt(group.shortcuts, item, itemIndex)});
      }
    },
    [index, group, onChange],
  );
  return (
    <Accordion>
      <AccordionSummary>
        <SettingAccordionTitle>{group.name}</SettingAccordionTitle>
      </AccordionSummary>
      <SettingAccordionDetails>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell>修飾キー</TableCell>
              <TableCell>キー</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {group.shortcuts.map((item, itemIndex) => (
              <ShortcutFormRow index={itemIndex} item={item} onChange={changeItem} />
            ))}
          </TableBody>
        </Table>
      </SettingAccordionDetails>
    </Accordion>
  );
};

interface ShortcutFormRowProps {
  readonly index: number;
  readonly item: ApplicationShortcutItem;
  readonly onChange: (index: number, item: ApplicationShortcutItem | undefined) => void;
}
const ShortcutFormRow: React.FC<ShortcutFormRowProps> = ({index, item, onChange}) => {
  const change = useCallback((item: ApplicationShortcutItem | undefined) => onChange(index, item), [index, onChange]);
  return (
    <TableRow>
      <TableCell></TableCell>
      <TableCell></TableCell>
      <TableCell>
        <KeySelector onChange={change} keyConfig={item} />
      </TableCell>
    </TableRow>
  );
};

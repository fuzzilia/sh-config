import React from 'react';
import { ApplicationShortCut, KeyConfig } from '../types';
import { Checkbox, makeStyles, NativeSelect, TableCell, TableRow } from '@material-ui/core';
import { isEqualShortCut, keyCodes } from '../models/KeyConfig';

const useStyles = makeStyles(theme => ({
  keyInput: {
    minWidth: 70,
  },
}));

interface KeyConfigRowProps {
  readonly config: KeyConfig;
  readonly index: number;
  readonly onChange: (index: number, key: KeyConfig) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

function keyConfigFromShortCut(applicationShortCuts: readonly ApplicationShortCut[], buttonNumber: number, index: any): KeyConfig {
  return { buttonNumber, ...(index ? applicationShortCuts[Number(index)] : {}) };
}

function shortCutIndex(
  applicationShortCuts: readonly ApplicationShortCut[],
  config: KeyConfig
): number | '' {
  const index = applicationShortCuts.findIndex((shortCut) => isEqualShortCut(shortCut, config));
  return index < 0 ? '' : index;
}

export const KeyConfigRow = React.memo<KeyConfigRowProps>(({ config, index, onChange, applicationShortCuts }) => {
  const classes = useStyles();
  return (
    <TableRow>
      <TableCell align="center">
        {config.buttonNumber}
      </TableCell>
      <TableCell align="center">
        <Checkbox checked={!!config.shift} onChange={(e) => onChange(index, { ...config, shift: e.target.checked })} />
      </TableCell>
      <TableCell align="center">
        <Checkbox checked={!!config.control} onChange={(e) => onChange(index, { ...config, control: e.target.checked })} />
      </TableCell>
      <TableCell align="center">
        <Checkbox checked={!!config.alt} onChange={(e) => onChange(index, { ...config, alt: e.target.checked })} />
      </TableCell>
      <TableCell align="center">
        <Checkbox checked={!!config.gui} onChange={(e) => onChange(index, { ...config, gui: e.target.checked })} />
      </TableCell>
      <TableCell align="center">
        <NativeSelect
          value={config.key || ''}
          onChange={(e) => onChange(index, { ...config, key: e.target.value ? Number(e.target.value) : 0})}
          className={classes.keyInput}
        >
          <option value="" />
          {keyCodes.map(([key, keyCode]) => (
            <option key={key} value={keyCode}>{key}</option>
          ))}
        </NativeSelect>
      </TableCell>
      {applicationShortCuts &&
        <TableCell align="center">
          <NativeSelect
            value={shortCutIndex(applicationShortCuts, config)}
            onChange={(e) => onChange(index, keyConfigFromShortCut(applicationShortCuts, config.buttonNumber, e.target.value))}
            className={classes.keyInput}
          >
            <option value="" />
            {applicationShortCuts.map(({ functionName }, index) => (
              <option key={index} value={index}>{functionName}</option>
            ))}
          </NativeSelect>
        </TableCell>
      }
    </TableRow>
  );
});

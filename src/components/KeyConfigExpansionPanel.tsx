import React, {useCallback} from 'react';
import {ApplicationShortCut, CombinationButtonState, KeyConfig} from '../types';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Typography from '@material-ui/core/Typography';
import ExpandMore from '@material-ui/icons/ExpandMore';
import {KeyConfigRow} from './KeyConfigRow';

interface KeyConfigExpansionPanelProps {
  readonly configs: readonly KeyConfig[];
  readonly combinationButtonStates: readonly CombinationButtonState[];
  readonly index: number;
  readonly onChange: (combinationIndex: number, configIndex: number, keyConfig: KeyConfig) => void;
  readonly applicationShortCuts: readonly ApplicationShortCut[] | undefined;
}

const useStyles = makeStyles((theme) => ({
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: '33.33%',
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
}));

export const KeyConfigExpansionPanel = React.memo<KeyConfigExpansionPanelProps>(
  ({configs, combinationButtonStates, index, onChange, applicationShortCuts}) => {
    const classes = useStyles();
    const onChangeRow = useCallback(
      (keyConfigIndex: number, keyConfig: KeyConfig) => {
        onChange(index, keyConfigIndex, keyConfig);
      },
      [index, onChange],
    );
    return (
      <ExpansionPanel defaultExpanded={index === 0}>
        <ExpansionPanelSummary expandIcon={<ExpandMore />}>
          <Typography className={classes.heading}>キー設定</Typography>
          <Typography className={classes.secondaryHeading}>組み合わせボタン : </Typography>
          {combinationButtonStates.map((combinationButtonState, index) => (
            <CombinationButtonStateView key={combinationButtonState.buttonNumber} state={combinationButtonState} />
          ))}
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Button</TableCell>
                <TableCell align="center">Shift</TableCell>
                <TableCell align="center">Ctrl</TableCell>
                <TableCell align="center">Alt</TableCell>
                <TableCell align="center">CMD/WIN</TableCell>
                <TableCell align="center">キー</TableCell>
                {applicationShortCuts && <TableCell align="center">ショートカット</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((keyConfig, keyConfigIndex) => {
                return (
                  <KeyConfigRow
                    key={keyConfigIndex}
                    index={keyConfigIndex}
                    config={keyConfig}
                    onChange={onChangeRow}
                    applicationShortCuts={applicationShortCuts}
                  />
                );
              })}
            </TableBody>
          </Table>
        </ExpansionPanelDetails>
      </ExpansionPanel>
    );
  },
);

const useCombinationButtonStateViewStyles = makeStyles((theme) => ({
  isOnText: {
    fontSize: theme.typography.pxToRem(15),
    marginLeft: theme.spacing(1),
    color: theme.palette.secondary.main,
  },
  isOffText: {
    fontSize: theme.typography.pxToRem(15),
    marginLeft: theme.spacing(1),
    color: theme.palette.text.disabled,
  },
}));

const CombinationButtonStateView: React.FC<{state: CombinationButtonState}> = ({state}) => {
  const classes = useCombinationButtonStateViewStyles();
  if (state.isOn) {
    return <Typography className={classes.isOnText}>ON({state.buttonNumber})</Typography>;
  } else {
    return <Typography className={classes.isOffText}>OFF({state.buttonNumber})</Typography>;
  }
};

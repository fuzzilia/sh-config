import React from 'react';
import {styled} from '@mui/material';
import {KeyConfig} from "../types";

const RootDiv = styled('div')`
  width: 24px;
  height: 24px;
  margin-left: ${({theme}) => theme.spacing(2)};
`;

const RowDiv = styled('div')`
  display: flex;
  align-items: center;
`;

const IconDiv = styled('div')`
  width: 11px;
  height: 11px;
  margin-bottom: 1px;
  margin-right: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: darkgray 1px solid;
`;

const EmptyIcon = styled('div')`
  width: 12px;
  height: 12px;
  margin-bottom: 1px;
  margin-right: 1px;
  border: darkgray 1px solid;
  opacity: 0.3;
`;

const IconChar = styled('span')`
  font-size: 16px;
  transform: scale(0.5);
`;

const keyModifiers = ['shift', 'alt', 'ctrl', 'gui'] as const;

export const KeyModifierIcon: React.FC<{keyConfig: KeyConfig | undefined}> = ({keyConfig}) => {
  if (keyModifiers.some((key) => keyConfig?.[key])) {
    return (
      <RootDiv>
        <RowDiv>
          {keyConfig?.shift ? (
            <IconDiv>
              <IconChar>S</IconChar>
            </IconDiv>
          ) : (
            <EmptyIcon />
          )}
          {keyConfig?.ctrl ? (
            <IconDiv>
              <IconChar>C</IconChar>
            </IconDiv>
          ) : (
            <EmptyIcon />
          )}
        </RowDiv>
        <RowDiv>
          {keyConfig?.alt ? (
            <IconDiv>
              <IconChar>A</IconChar>
            </IconDiv>
          ) : (
            <EmptyIcon />
          )}
          {keyConfig?.gui ? (
            <IconDiv>
              <IconChar>G</IconChar>
            </IconDiv>
          ) : (
            <EmptyIcon />
          )}
        </RowDiv>
      </RootDiv>
    );
  } else {
    return null;
  }
};

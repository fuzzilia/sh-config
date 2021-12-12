import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import {styled, Typography} from '@mui/material';
import Button from '@mui/material/Button';

interface JoyConAlertProps {
  readonly onClose: () => void;
  readonly onSubmit: () => void;
  readonly isOpen: boolean;
}

const SubmitButton = styled(Button)``;

const CancelButton = styled(Button)`
  margin: ${({theme}) => theme.spacing(2)};
`;

export const JoyConAlert: React.FC<JoyConAlertProps> = ({isOpen, onClose, onSubmit}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth={true} maxWidth="md">
      <DialogTitle>注意</DialogTitle>
      <DialogContent>
        <Typography>
          本アプリケーションは任天堂とは一切関係がありません。本アプリケーションについて、任天堂にお問い合わせを行うことはお控えください。
        </Typography>
        <Typography>
          また、本アプリケーションを利用することでコントローラーが故障した場合にメーカーによる保証が受けられなくなる可能性があります。
          その点をご理解いただき、自己責任にてご利用をお願いします。
        </Typography>
        <SubmitButton variant="contained" color="primary" onClick={onSubmit}>
          同意して続行する
        </SubmitButton>
        <CancelButton variant="outlined" color="info" onClick={onClose}>
          キャンセル
        </CancelButton>
      </DialogContent>
    </Dialog>
  );
};

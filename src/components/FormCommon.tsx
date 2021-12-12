import {styled} from '@mui/material';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

export const FormRowBox = styled(Box)`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const FormLabel = styled(Typography)`
  color: ${({theme}) => theme.palette.text.secondary};
`;

export const FormValueText = styled(Typography)`
  margin-left: ${({theme}) => theme.spacing(1)};
  color: ${({theme}) => theme.palette.text.primary};
`;

export const FormOptionButton = styled(Button)`
  margin-left: ${({theme}) => theme.spacing(2)};
`;

export const FormTextField = styled(TextField)`
  margin-left: ${({theme}) => theme.spacing(2)};
`;

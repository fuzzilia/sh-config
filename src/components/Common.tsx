import {styled} from '@mui/material';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';

export const SettingAccordionDetails = styled(AccordionDetails)`
  overflow-x: auto;
`;
export const SettingAccordionTitle = styled(Typography)`
  font-size: ${({theme}) => theme.typography.pxToRem(15)};
  flex-basis: 20%;
  flex-shrink: 0;
  align-self: center;
`;

import React from 'react';
import loginBackground from '../assets/login_background.jpg';
import { 
  Container,
  Paper,
  Typography,
  styled,
  useTheme
} from '@mui/material';

const StyledContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: 'rgba(239, 237, 185, 0.89)', // Fallback
  backgroundImage: `url(${loginBackground})`,  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.palette.primary.main,
  opacity: 0.90,
  border: `2px solid ${theme.palette.primary.main}`,
  color: theme.palette.background.main,
  backdropFilter: 'blur(70px)',
  borderRadius: '30px',
  padding: theme.spacing(0.5), // Reduced padding to create tight fit
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  width: 'auto',
  minWidth: 300,
  maxWidth: 450,

}));

const FormBox = styled('form')(({ theme }) => ({
  backgroundColor: theme.palette.background.main,
  opacity: 1.0,
  padding: theme.spacing(4),
  borderRadius: '25px',
  boxShadow: theme.shadows[4],
  backdropFilter: 'blur(20px)',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const Frame = ({ title, onSubmit, children, sx = {} }) => {
  const theme = useTheme();

  return (
    <StyledContainer maxWidth={false}>
      <StyledPaper elevation={0}>
        <FormBox onSubmit={onSubmit} sx={sx}>
          <Typography 
            variant="h4"
            sx={{ 
              textAlign: 'center',
              color: theme.palette.primary.main,
              mt:2,mb:2
            }}
          >
            {title}
          </Typography>
          {children}
        </FormBox>
      </StyledPaper>
    </StyledContainer>
  );
};

export default Frame;
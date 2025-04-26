import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { useTranslation } from 'react-i18next';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import LoginPopup from '../components/LoginPopup';

const TransparentTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: '#fff',
    borderRadius: 20,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
    '&.Mui-focused fieldset': { borderColor: '#fff' },
    '& input': { color: '#fff' },
  },
  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
}));

export default function SearchBar({ isLoggedIn }) {
  const { t } = useTranslation('global');
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Add state to remember selected option when login is required
  const [pendingOption, setPendingOption] = useState(null);
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);

  // fetch suggestions
  const fetchSuggestions = async (q) => {
    if (!q.trim()) return setOptions([]);
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/search?q=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { results } = await res.json();
      setOptions(results || []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // debounce
  const debounced = useRef(
    debounce((q) => {
      fetchSuggestions(q);
      setOpen(true);
    }, 300)
  ).current;

  useEffect(() => {
    if (inputValue.trim()) {
      debounced(inputValue.trim());
    } else {
      setOptions([]);
      setLoading(false);
    }
    return () => debounced.cancel();
  }, [inputValue, debounced]);

  // handle selection
  const handleSelect = (_, option) => {
    if (!option) return;
    if (option.type === 'user' && !isLoggedIn) {
      // Close the autocomplete dropdown
      setOpen(false);
      
      // Show login requirement
      setLoginPopupOpen(true);
      return;
    }

    if(option.type === undefined){
      return;
    }
    
    // Otherwise navigate
    const path = option.type === 'food'
      ? `/food/${option.id}`
      : `/profile/${option.id}`;
    navigate(path);
    setInputValue('');
    setOptions([]);
  };

  // Handle popup close
  const handleLoginPopupClose = () => {
    setLoginPopupOpen(false);
    // Clear the pending option
    setPendingOption(null);
  };

  // Handle login navigation
  const handleLogin = () => {
    setLoginPopupOpen(false);
    setPendingOption(null);
    navigate('/login');
  };

  return (
    <>
      <Box sx={{ width: '60%', maxWidth: 800, mt: 4, mx: 'auto' }}>
        <Autocomplete
          freeSolo
          open={open && !loginPopupOpen} // Close dropdown when login popup is open
          onOpen={() => !loginPopupOpen && setOpen(true)}
          onClose={() => setOpen(false)}
          forcePopupIcon={false}
          filterOptions={(x) => x}
          options={options}
          getOptionLabel={(opt) => opt.name || ''}
          loading={loading}
          loadingText={t('searching')}
          noOptionsText={
            inputValue.trim() ? t('noResults') : t('typeToSearch')
          }
          inputValue={inputValue}
          onInputChange={(_, v) => setInputValue(v)}
          onChange={handleSelect}
          PaperComponent={({ children, ...props }) => (
            <Box
              {...props}
              sx={{
                background: 'rgba(0,107,117,0.5)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 2,
                mt: 1,
                color: '#fff',
              }}
            >
              {children}
            </Box>
          )}
          renderInput={(params) => (
          <TransparentTextField
            {...params}
              // 1) watch for Enter:
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();       // stop form‐submit
                  if (options.length > 0) {
                    handleSelect(e, options[0]);
                  }
                }
              }}
              placeholder={t('searchPlaceholder')}
              variant="outlined"
              size="small"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading && (
                      <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
                    )}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box
              component="li"
              {...props}
              key={`${option.type}-${option.id}`}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                color: '#fff',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
                px: 2, py: 1,
              }}
            >
              <Typography noWrap>{option.name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {option.type === 'food' ? '🍽️' : '👤'}
              </Typography>
            </Box>
          )}
          sx={{
            '& .MuiAutocomplete-listbox': { p: 0 },
          }}
        />
      </Box>

      {/* Login popup with improved handling */}
      <LoginPopup
        open={loginPopupOpen}
        onClose={handleLoginPopupClose}
        onLogin={handleLogin}
        messageKey='toView'
      />
    </>
  );
}
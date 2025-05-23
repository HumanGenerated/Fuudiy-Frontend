import React, { useState, useEffect } from 'react';
import { TextField, Box, List, ListItem, Typography } from '@mui/material';

const TextQuestion = ({ question, value, onChange, language }) => {
  const [ingredients, setIngredients] = useState([]); // Store all ingredients
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); // Suggestions based on user input
  const [showSuggestions, setShowSuggestions] = useState(false); // Control dropdown visibility

  // Fetch ingredients from JSON file
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await fetch('/ingredients.json'); // Replace with your JSON file path
        const data = await response.json();
        setIngredients(data);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      }
    };

    fetchIngredients();
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue); // Keep full text in parent
  
    const parts = inputValue.split(',');
    const lastWord = parts[parts.length - 1].trim(); // Only use last part
  
    if (lastWord) {
      const suggestions = ingredients.filter((ingredient) =>
        ingredient[language]?.toLowerCase().includes(lastWord.toLowerCase())
      );
      setFilteredSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  };
  

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const parts = value.split(',');
    parts[parts.length - 1] = ` ${suggestion}`; // Replace last word with suggestion
    const updatedValue = parts.join(',').replace(/^,/, '').trim(); // Clean up leading comma
  
    onChange(updatedValue);
    setShowSuggestions(false);
  };
  

  return (
    <Box sx={{ position: 'relative', margin: '20px 0' }}>
      {/* Question Header */}
      <Typography variant="h5" gutterBottom>
        {question[language]} {/* Display the question in the current language */}
      </Typography>

      {/* Text Field */}
      <TextField
        fullWidth
        variant="outlined"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
        placeholder={language === 'en' ? "Start typing to see suggestions..." : "Yazmaya başlayın, önerileri görün..."} // Example for English and Turkish
        sx={{
          backgroundColor: 'white',
        }}
      />

      {/* Dropdown Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <List
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '150px',
            overflowY: 'auto',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            zIndex: 10,
          }}
        >
          {filteredSuggestions.map((suggestion, index) => (
            <ListItem
              key={index}
              button
              onClick={() => handleSuggestionClick(suggestion[language])} // Use the suggestion in the selected language
              sx={{
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
              }}
            >
              {suggestion[language]} {/* Display the suggestion in the selected language */}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default TextQuestion;

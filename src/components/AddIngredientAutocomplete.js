// src/components/AddIngredientAutocomplete.jsx
import React, { useEffect, useState } from "react";
import { TextField, Autocomplete, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

const AddIngredientAutocomplete = ({ onAdd }) => {
  const [ingredients, setIngredients] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [selected, setSelected] = useState(null);
  const { t, i18n } = useTranslation("global");

  useEffect(() => {
    fetch("/ingredients.json")
      .then((res) => res.json())
      .then((data) => setIngredients(data))
      .catch((err) => console.error("Error loading ingredients:", err));
  }, []);

  useEffect(() => {
    if (selected) {
      onAdd(selected.en); // Always send the English version
      setSelected(null);
      setInputValue("");
    }
  }, [selected, onAdd]);

  return (
    <Box display="flex" alignItems="center" gap={1} mt={1} sx={{ width: "100%", maxWidth: 400 }}>
      <Autocomplete
        sx={{ width: 350 }}
        fullWidth
        options={ingredients}
        getOptionLabel={(option) =>
          typeof option === "string"
            ? option
            : i18n.language === "tr"
            ? option.tr
            : option.en
        }
        filterOptions={(options, state) => {
          const lang = i18n.language === "tr" ? "tr" : "en";
          const input = state.inputValue.toLowerCase();
        
          const startsWith = options.filter(opt =>
            opt[lang]?.toLowerCase().startsWith(input)
          );
        
          const includes = options.filter(opt =>
            opt[lang]?.toLowerCase().includes(input) &&
            !opt[lang]?.toLowerCase().startsWith(input)
          );
        
          return [...startsWith, ...includes].slice(0, 5);
        }}

        value={selected}
        inputValue={inputValue}
        onInputChange={(e, newInput) => setInputValue(newInput)}
        onChange={(e, newValue) => setSelected(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label={t('addIngredient')}
            size="small"
            sx={{ flex: 1 }}
          />
        )}
      />
    </Box>
  );
};

export default AddIngredientAutocomplete;

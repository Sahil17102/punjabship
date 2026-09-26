import React from "react";
import { Autocomplete, TextField, ListItemText, Box } from "@mui/material";

interface OptionType {
  key: string;
  label: string;
  description?: string;
}

interface AutocompleteDropdownProps {
  label: string;
  required?: boolean;
  inputValue: string;
  value: string;
  onInputChange: (val: string) => void;
  onChange: (key: string) => void;
  options: OptionType[];
  helperText?: string;
}

const AutocompleteDropdown: React.FC<AutocompleteDropdownProps> = ({
  label,
  required,
  inputValue,
  value,
  onInputChange,
  onChange,
  options,
  helperText,
}) => {
  const selectedOption = options.find((opt) => opt.key === value) || null;

  return (
    <Autocomplete
      fullWidth
      options={options}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, val) => option.key === val.key}
      value={selectedOption}
      inputValue={inputValue}
      onInputChange={(_, newInputValue, reason) => {
        if (reason !== "reset") {
          onInputChange(newInputValue);
        }
      }}
      onChange={(_, newValue) => {
        if (newValue) {
          onChange(newValue.key);
        }
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <ListItemText
            primary={option.label}
            secondary={option.description || ""}
          />
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          helperText={helperText}
        />
      )}
    />
  );
};

export default AutocompleteDropdown;

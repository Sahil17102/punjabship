import { useState, useRef, type ReactNode } from "react";
import {
  alpha,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Grow,
  Popper,
  ClickAwayListener,
  Box,
} from "@mui/material";
import CustomInput from "./CustomInput";

const BRAND_GREEN = '#4b8e40'

export interface DropdownItem {
  key: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

interface DropdownMenuProps {
  label: string;
  items: DropdownItem[];
  onSelect: (key: string) => void;
  value?: string;
  placeholder?: string;
  helperText?: string;
}

export default function CustomSelectSearchable({
  label,
  items,
  onSelect,
  value,
  placeholder,
  helperText,
}: DropdownMenuProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const selectedItem = items.find((item) => item?.key === value);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggle = () => setOpen((prev) => !prev);

  const handleClose = (event?: MouseEvent | TouchEvent) => {
    if (
      anchorRef.current &&
      event?.target instanceof Node &&
      anchorRef.current.contains(event.target)
    ) {
      return;
    }
    setOpen(false);
  };

  const handleSelect = (key: string) => {
    onSelect(key);
    setSearchText("");
    setOpen(false);
  };

  return (
    <Box>
      <div ref={anchorRef}>
        <CustomInput
          label={label}
          fullWidth
          value={searchText || selectedItem?.label || ""}
          placeholder={placeholder}
          onClick={handleToggle}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!open) setOpen(true);
          }}
        />
      </div>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: "top left" }}>
            <Box>
              {open && (
                <ClickAwayListener onClickAway={handleClose}>
                  <Paper
                    elevation={0}
                    sx={{
                      bgcolor: '#FFFFFF',
                      border: `1px solid ${alpha(BRAND_GREEN, 0.15)}`,
                      borderRadius: 3,
                      boxShadow: `0 8px 32px ${alpha(BRAND_GREEN, 0.15)}`,
                      width: anchorRef.current?.getBoundingClientRect().width ?? 300,
                      maxHeight: 320,
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': {
                        width: 6,
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: alpha(BRAND_GREEN, 0.2),
                        borderRadius: 3,
                        '&:hover': {
                          background: alpha(BRAND_GREEN, 0.35),
                        },
                      },
                    }}
                  >
                    <List dense disablePadding>
                      {filteredItems.map((item) => (
                        <ListItemButton
                          key={item.key}
                          selected={value === item.key}
                          onClick={() => handleSelect(item.key)}
                          sx={{
                            px: 2,
                            py: 1.25,
                            borderRadius: 1.5,
                            mx: 0.5,
                            mt: value === item.key ? 0.5 : 0,
                            mb: 0.5,
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                              bgcolor: alpha(BRAND_GREEN, 0.1),
                              color: BRAND_GREEN,
                              border: `1px solid ${alpha(BRAND_GREEN, 0.2)}`,
                              '&:hover': {
                                bgcolor: alpha(BRAND_GREEN, 0.15),
                                borderColor: alpha(BRAND_GREEN, 0.3),
                              },
                              '& .MuiListItemIcon-root': {
                                color: BRAND_GREEN,
                              },
                            },
                            '&:hover': {
                              bgcolor: alpha(BRAND_GREEN, 0.06),
                              transform: 'translateX(2px)',
                            },
                          }}
                        >
                          {item.icon && (
                            <ListItemIcon
                              sx={{
                                color: value === item.key ? BRAND_GREEN : '#6b6b6b',
                                minWidth: 36,
                              }}
                            >
                              {item.icon}
                            </ListItemIcon>
                          )}
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: value === item.key ? 600 : 500,
                                  color: value === item.key ? BRAND_GREEN : '#1a1a1a',
                                }}
                              >
                                {item.label}
                              </Typography>
                            }
                            secondary={
                              item.description && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#6b6b6b',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  {item.description}
                                </Typography>
                              )
                            }
                          />
                        </ListItemButton>
                      ))}
                      {filteredItems.length === 0 && (
                        <Box
                          p={3}
                          sx={{
                            textAlign: 'center',
                            bgcolor: alpha(BRAND_GREEN, 0.04),
                            borderRadius: 2,
                            mx: 0.5,
                            my: 0.5,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: '#6b6b6b', fontSize: '0.85rem' }}>
                            No matches found.
                          </Typography>
                        </Box>
                      )}
                    </List>
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          </Grow>
        )}
      </Popper>

      {helperText && (
        <Box mt={0.5}>
          <Typography
            variant="caption"
            sx={{
              color: '#6b6b6b',
              fontSize: '0.8rem',
              fontStyle: 'italic',
            }}
          >
            {helperText}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

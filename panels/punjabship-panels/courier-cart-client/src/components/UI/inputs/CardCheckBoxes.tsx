import { alpha } from '@mui/material/styles'
import {
  CardActionArea,
  Checkbox,
  Typography,
  Box,
  Stack,
  Tooltip,
} from '@mui/material'
import { useState } from 'react'

const BRAND_GREEN = '#4b8e40'

interface CardCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  imageSrc?: string;
  imageAlt?: string;
  description?: string;
  value: string | undefined;
}

export default function CardCheckbox({
  label,
  checked,
  onChange,
  imageSrc,
  imageAlt = "",
  description,
}: CardCheckboxProps) {
  const toggle = () => onChange(!checked);
  const [isFocused, setFocused] = useState(false);

  return (
    <CardActionArea
      onClick={toggle}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        px: { xs: 2, sm: 2.5 },
        py: { xs: 1.5, sm: 2 },
        width: '100%',
        minHeight: { xs: 160, sm: 180, md: 200 },
        borderRadius: 3,
        border: `2px solid`,
        borderColor: checked ? BRAND_GREEN : alpha(BRAND_GREEN, 0.2),
        background: checked
          ? alpha(BRAND_GREEN, 0.08)
          : '#ffffff',
        boxShadow: checked
          ? `0 8px 24px ${alpha(BRAND_GREEN, 0.2)}`
          : '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.25s ease-in-out',
        transform: isFocused ? 'scale(1.01)' : 'scale(1)',
        '&:hover': {
          transform: 'scale(1.02)',
          borderColor: checked ? BRAND_GREEN : alpha(BRAND_GREEN, 0.4),
          boxShadow: checked
            ? `0 12px 32px ${alpha(BRAND_GREEN, 0.25)}`
            : `0 4px 16px ${alpha(BRAND_GREEN, 0.15)}`,
        },
        '&:focus-visible': {
          outline: `2px solid ${BRAND_GREEN}`,
          outlineOffset: 2,
        },
      }}
      aria-pressed={checked}
      role="checkbox"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <Checkbox
        checked={checked}
        size="small"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        sx={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 50,
          color: checked ? BRAND_GREEN : '#9e9e9e',
          '&.Mui-checked': {
            color: BRAND_GREEN,
          },
        }}
      />

      {imageSrc && (
        <Box
          component="img"
          src={imageSrc}
          alt={imageAlt || label}
          sx={{
            width: "100%",
            aspectRatio: "16/9",
            objectFit: "cover",
            borderRadius: 2,
            mb: 1.5,
            opacity: checked ? 0.95 : 0.85,
            transition: "0.3s ease",
          }}
        />
      )}

      <Stack
        spacing={0.25}
        sx={{
          width: "100%",
          textAlign: "left",
        }}
      >
        <Typography
          variant="subtitle2"
          fontWeight={600}
          noWrap
          color={checked ? BRAND_GREEN : '#1a1a1a'}
          sx={{ transition: 'color 0.2s ease' }}
        >
          {label}
        </Typography>

        {description && (
          <Tooltip title={description} arrow>
            <Typography
              variant="caption"
              color="#6b6b6b"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                fontSize: '0.75rem',
                lineHeight: 1.4,
                mt: 0.5,
              }}
            >
              {description}
            </Typography>
          </Tooltip>
        )}
      </Stack>
    </CardActionArea>
  );
}

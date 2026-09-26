// components/KYCPreview/AadhaarCard.tsx
import { Card, CardContent, Typography, useTheme } from "@mui/material";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text: any;
}

export default function AadhaarCard({ text }: Props) {
  const theme = useTheme();
  const bg = theme.palette.background.paper;

  return (
    <Card
      sx={{
        mt: 2,
        backgroundColor: bg,
        color: "#eee",
        border: "1px solid #333",
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          🪪 Aadhaar Extract
        </Typography>
        <Typography>
          <strong>Name:</strong> {text?.aadhaarName}
        </Typography>
        <Typography>
          <strong>DOB:</strong> {text?.aadhaarDob}
        </Typography>
        <Typography>
          <strong>No:</strong> {text?.aadhaarNumber}
        </Typography>
      </CardContent>
    </Card>
  );
}

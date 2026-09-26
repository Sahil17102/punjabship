// components/KYCPreview/BankChequeCard.tsx
import { Card, CardContent, Typography } from "@mui/material";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  text: any;
}

export default function BankChequeCard({ text }: Props) {
  return (
    <Card
      sx={{
        mt: 2,
        backgroundColor: "#1f1f1f",
        color: "#eee",
        border: "1px solid #333",
      }}
    >
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          🏦 Bank Extract
        </Typography>
        <Typography>
          <strong>IFSC:</strong> {text?.ifsc}
        </Typography>
        <Typography>
          <strong>Account:</strong> {text?.accNo}
        </Typography>
      </CardContent>
    </Card>
  );
}

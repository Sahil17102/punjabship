import { Grid, Stack, Typography } from "@mui/material";
import CardCheckbox from "../UI/inputs/CardCheckBoxes";

type businessCategories = "d2c" | "b2b" | "b2c";
type businessTypeOption = businessCategories | "b2c_b2b";
interface BusinessType {
  label: string;
  imageSrc?: string;
  description?: string;
  value: businessTypeOption;
  values?: businessCategories[];
}

interface BusinessTypeSelectorProps {
  selected: string[];
  error: string;
  onChange: (selected: string[]) => void;
}

const businessTypes: BusinessType[] = [
  {
    label: "I sell to other businesses",
    value: "b2b",
    imageSrc: "/images/wholesale.png",
    description:
      "You sell products in bulk to shops, retailers, or other companies.",
  },
  {
    label: "I sell on online marketplaces",
    value: "b2c",
    imageSrc: "/images/marketplace.png",
    description:
      "You sell your products on sites like Amazon, Flipkart, or Meesho.",
  },
  {
    label: "I sell on my website or social media",
    value: "d2c",
    imageSrc: "/images/website-illustration.png",
    description:
      "You sell directly to customers through your own website/ social media or shopify/woocommerce.",
  },
  {
    label: "I sell to customers and businesses",
    value: "b2c_b2b",
    description: "You serve both end customers and other businesses.",
    values: ["b2c", "b2b"],
  },
];

export default function BusinessTypeSelector({
  selected,
  onChange,
  error,
}: BusinessTypeSelectorProps) {
  // Toggle selection of an item in multi-select
  const toggleSelection = (value: businessTypeOption, values?: businessCategories[]) => {
    const selectedValues = values ?? [value as businessCategories];
    const isSelected = selectedValues.every((item) => selected?.includes(item));
    if (isSelected) {
      onChange(selected?.filter((item) => !selectedValues.includes(item as businessCategories)));
    } else {
      onChange(Array.from(new Set([...(selected ?? []), ...selectedValues])));
    }
  };

  return (
    <Stack spacing={1.5}>
      {error && (
        <Typography color="error" variant="body2" mt={1} ml={1}>
          {error}
        </Typography>
      )}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} justifyContent="center">
        {businessTypes.map(({ label, imageSrc, description, value, values }) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={value}>
            {" "}
            <CardCheckbox
              description={description}
              key={label}
              value={value}
              label={label}
              imageSrc={imageSrc}
              checked={(values ?? [value as businessCategories]).every((item) => selected?.includes(item))}
              onChange={() => toggleSelection(value, values)}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

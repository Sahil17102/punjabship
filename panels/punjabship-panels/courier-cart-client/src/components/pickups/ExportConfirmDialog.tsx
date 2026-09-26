import { DialogContentText, DialogActions, Button } from "@mui/material";
import CustomDialog from "../UI/modal/CustomModal";

interface ExportConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  filterCount: number;
}

const ExportConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  filterCount,
}: ExportConfirmDialogProps) => {
  return (
    <CustomDialog
      title={"Export Pickup Addresses"}
      open={open}
      onClose={onClose}
      footer={
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            color="primary"
            autoFocus
          >
            Confirm & Export
          </Button>
        </DialogActions>
      }
    >
      <DialogContentText fontSize={14}>
        You're about to export your pickup address list.
        {filterCount > 0 ? (
          <>
            <br />
            <strong>{filterCount}</strong> filter
            {filterCount !== 1 ? "s" : ""} are currently applied. The exported
            data will reflect these filters.
          </>
        ) : (
          <>
            <br />
            No filters are applied. This will export the full address list.
          </>
        )}
      </DialogContentText>
    </CustomDialog>
  );
};

export default ExportConfirmDialog;

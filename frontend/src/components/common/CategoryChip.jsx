
import { Chip } from "@mui/material";

const categoryConfig = {
  announcement: {
    label: "Announcement",
    color: "#1976D2",
    background: "#EAF2FF",
  },
  homework_reminder: {
    label: "Homework Reminder",
    color: "#ED8B00",
    background: "#FFF4E5",
  },
  exam_update: {
    label: "Exam Update",
    color: "#D32F2F",
    background: "#FDECEC",
  },
  general_update: {
    label: "General Update",
    color: "#2E7D32",
    background: "#E8F5E9",
  },
};

function CategoryChip({ category }) {
  const config = categoryConfig[category] || {
    label: "General Update",
    color: "#64748B",
    background: "#F1F5F9",
  };

  return (
    <Chip
      label={config.label}
      size="small"
      variant="outlined"
      sx={{
        color: config.color,
        borderColor: config.color,
        backgroundColor: config.background,
        fontWeight: 600,
        borderRadius: "20px",
        "& .MuiChip-label": {
          px: 1.5,
        },
      }}
    />
  );
}

export default CategoryChip;

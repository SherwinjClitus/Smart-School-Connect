import { Chip, useTheme } from "@mui/material";

const lightCategoryConfig = {
  announcement: {
    label: "Announcement",
    color: "#1976D2",
    background: "#EAF2FF",
    border: "#C9DCFF",
  },
  homework_reminder: {
    label: "Homework Reminder",
    color: "#ED8B00",
    background: "#FFF4E5",
    border: "#FFE0A8",
  },
  exam_update: {
    label: "Exam Update",
    color: "#D32F2F",
    background: "#FDECEC",
    border: "#F5C2C2",
  },
  general_update: {
    label: "General Update",
    color: "#2E7D32",
    background: "#E8F5E9",
    border: "#C5E5C8",
  },
};

const darkCategoryConfig = {
  announcement: {
    label: "Announcement",
    color: "#93C5FD",
    background: "#1E3553",
    border: "#304D70",
  },
  homework_reminder: {
    label: "Homework Reminder",
    color: "#FBBF65",
    background: "#46351F",
    border: "#69502D",
  },
  exam_update: {
    label: "Exam Update",
    color: "#FCA5A5",
    background: "#4A2020",
    border: "#7A3232",
  },
  general_update: {
    label: "General Update",
    color: "#86EFAC",
    background: "#1E3B2A",
    border: "#315B40",
  },
};

const fallbackLight = {
  label: "General Update",
  color: "#64748B",
  background: "#F1F5F9",
  border: "#CBD5E1",
};

const fallbackDark = {
  label: "General Update",
  color: "#CBD5E1",
  background: "#263447",
  border: "#3B4B63",
};

function CategoryChip({ category }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const categoryConfig = isDark ? darkCategoryConfig : lightCategoryConfig;
  const fallback = isDark ? fallbackDark : fallbackLight;

  const config = categoryConfig[category] || fallback;

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        color: config.color,
        border: `1px solid ${config.border}`,
        backgroundColor: config.background,
        fontWeight: 600,
        borderRadius: 20,
        "& .MuiChip-label": {
          px: 1.5,
        },
      }}
    />
  );
}

export default CategoryChip;

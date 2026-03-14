import {
  AlignLeftIcon,
  CheckSquareIcon,
  CircleDotIcon,
  HashIcon,
  MailIcon,
  StarIcon,
  TextCursorInputIcon,
  ThumbsUpIcon,
} from "lucide-react";

const FIELDS = [
  {
    type: "short_text",
    label: "Short text",
    icon: TextCursorInputIcon,
    color: "#3B82F6",
  }, // blue-500
  {
    type: "long_text",
    label: "Long text / paragraph",
    icon: AlignLeftIcon,
    color: "#8B5CF6",
  }, // violet-500
  {
    type: "multiple_choice",
    label: "Multiple choice",
    icon: CircleDotIcon,
    color: "#EC4899",
  }, // pink-500
  {
    type: "checkboxes",
    label: "Checkboxes",
    icon: CheckSquareIcon,
    color: "#10B981",
  }, // emerald-500
  { type: "rating", label: "Star rating", icon: StarIcon, color: "#F59E0B" }, // amber-500
  { type: "yes_no", label: "Yes / No", icon: ThumbsUpIcon, color: "#EF4444" }, // red-500
  { type: "email", label: "Email field", icon: MailIcon, color: "#06B6D4" }, // cyan-500
  { type: "number", label: "Number field", icon: HashIcon, color: "#F97316" }, // orange-500
];

export default FIELDS;

import {
  CalendarIcon,
  ChevronDownIcon,
  GaugeIcon,
  ImageIcon,
  MessageSquareIcon,
  PenLineIcon,
  PhoneIcon,
  ScaleIcon,
  UploadIcon,
} from "lucide-react";

const PRO_FIELDS = [
  {
    type: "dropdown",
    label: "Dropdown",
    icon: ChevronDownIcon,
    color: "#6366F1",
  }, // indigo-500
  {
    type: "file_upload",
    label: "File upload",
    icon: UploadIcon,
    color: "#14B8A6",
  }, // teal-500
  {
    type: "date",
    label: "Date",
    icon: CalendarIcon,
    color: "#F43F5E",
  }, // rose-500
  {
    type: "phone_number",
    label: "Phone number",
    icon: PhoneIcon,
    color: "#84CC16",
  }, // lime-500
  {
    type: "net_promoter_score",
    label: "Net Promoter Score",
    icon: GaugeIcon,
    color: "#A855F7",
  }, // purple-500
  {
    type: "opinion_scale",
    label: "Opinion Scale",
    icon: ScaleIcon,
    color: "#FB923C",
  }, // orange-400
  {
    type: "statement",
    label: "Statement",
    icon: MessageSquareIcon,
    color: "#0EA5E9",
  }, // sky-500
  {
    type: "picture_choice",
    label: "Picture Choice",
    icon: ImageIcon,
    color: "#D946EF",
  }, // fuchsia-500
  {
    type: "signature",
    label: "Signature",
    icon: PenLineIcon,
    color: "#22C55E",
  }, // green-500
];

export default PRO_FIELDS;

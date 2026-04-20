import FIELDS from "./fields";
import PRO_FIELDS from "./proFields";

const all = [...FIELDS, ...PRO_FIELDS];

const find = (type) => all.find((f) => f.type === type);

export const FIELD_CATEGORIES = [
  {
    name: "Text",
    fields: [find("short_text"), find("long_text"), find("statement")],
  },
  {
    name: "Contact",
    fields: [find("email"), find("phone_number")],
  },
  {
    name: "Choice",
    fields: [
      find("multiple_choice"),
      find("checkboxes"),
      find("yes_no"),
      find("dropdown"),
      find("picture_choice"),
    ],
  },
  {
    name: "Scale & Rating",
    fields: [find("rating"), find("net_promoter_score"), find("opinion_scale")],
  },
  {
    name: "Other",
    fields: [find("number"), find("date"), find("file_upload"), find("signature")],
  },
];

export const ALL_FIELDS = all;

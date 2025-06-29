import { type FC, type PropsWithChildren } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Stack from "@mui/material/Stack";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons";
import Widget from "./Widget";

type FormItem = { [key: string]: string | Object | FormItem };

type FormItemType = {
  [key: string]: "string" | "number" | "boolean" | "array" | FormItemType;
};

interface FormProps extends PropsWithChildren {
  sectionTitle: string;
  items: FormItem;
  itemsTypeMap: FormItemType;
}

function isFormItemType(
  obj: "string" | "number" | "boolean" | "array" | FormItemType
): obj is FormItemType {
  return obj instanceof Object && !(obj instanceof Array);
}

const Form: FC<FormProps> = ({ sectionTitle, items, itemsTypeMap }) => {
  return (
    <Accordion defaultExpanded>
      <AccordionSummary
        expandIcon={<FontAwesomeIcon icon={faChevronUp} />}
        sx={{
          backgroundColor: "#E0E0E0",
        }}
        slotProps={{
          expandIconWrapper: { style: { order: -1, marginRight: "6px" } },
        }}
      >
        {sectionTitle}
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {Object.entries(itemsTypeMap).map(([key, value]) =>
            isFormItemType(value) ? (
              <Form
                key={key}
                sectionTitle={key}
                items={items[key] as FormItem}
                itemsTypeMap={itemsTypeMap[key] as FormItemType}
              />
            ) : (
              <Widget key={key} title={key} type={value} value={items[key]} />
            )
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
};

export default Form;

import { type FC, type PropsWithChildren, type ReactElement } from "react";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";

interface WidgetProps extends PropsWithChildren {
  title: string;
  type: "string" | "number" | "boolean" | "array";
  value: any;
}

const Widget: FC<WidgetProps> = ({ title, type, value }): ReactElement => {
  switch (type) {
    case "string":
      return <TextField type="text" defaultValue={value} label={title} />;
    case "number":
      return <TextField type="number" defaultValue={value} label={title} />;
    case "boolean":
      return (
        <FormControlLabel control={<Switch defaultChecked={value === "true"} />} label={title} />
      );
    case "array":
      return <>array not implemented</>; // TODO: add implementation
  }
};

export default Widget;

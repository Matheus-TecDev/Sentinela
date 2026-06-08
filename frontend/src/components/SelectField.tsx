import Select, { type GroupBase, type Props } from "react-select";

export interface SelectOption<T extends string | number = string> {
  value: T;
  label: string;
}

export function SelectField<T extends string | number>(
  props: Props<SelectOption<T>, false, GroupBase<SelectOption<T>>>
) {
  return (
    <Select
      classNamePrefix="sentinel-select"
      noOptionsMessage={() => "Nenhum resultado"}
      loadingMessage={() => "Carregando"}
      placeholder="Selecione"
      {...props}
    />
  );
}

import type { ComponentType } from "react";
import type { BlockType, Element as SketchyElement } from "../../../../shared";
import ButtonOptions from "../options/ButtonOptions";
import CardOptions from "../options/CardOptions";
import CheckboxOptions from "../options/CheckboxOptions";
import InputOptions from "../options/InputOptions";
import ListItemOptions from "../options/ListItemOptions";
import RadioOptions from "../options/RadioOptions";
import SectionOptions from "../options/SectionOptions";
import SelectOptions from "../options/SelectOptions";
import SwitchOptions from "../options/SwitchOptions";
import TableOptions from "../options/TableOptions";
import TabsOptions from "../options/TabsOptions";
import TextOptions from "../options/TextOptions";

export type BlockOptionsProps = { element: SketchyElement };

export const BLOCK_OPTIONS: Partial<
  Record<BlockType, ComponentType<BlockOptionsProps>>
> = {
  text: TextOptions,
  button: ButtonOptions,
  input: InputOptions,
  section: SectionOptions,
  listItem: ListItemOptions,
  card: CardOptions,
  table: TableOptions,
  tabs: TabsOptions,
  select: SelectOptions,
  checkbox: CheckboxOptions,
  radio: RadioOptions,
  switch: SwitchOptions,
};

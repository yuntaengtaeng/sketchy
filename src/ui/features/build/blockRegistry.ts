import type { ComponentType } from "react";
import type { BlockType, Element as SketchyElement } from "../../../shared";
import ButtonOptions from "./ButtonOptions";
import CardOptions from "./CardOptions";
import CheckboxOptions from "./CheckboxOptions";
import InputOptions from "./InputOptions";
import ListItemOptions from "./ListItemOptions";
import RadioOptions from "./RadioOptions";
import SectionOptions from "./SectionOptions";
import SelectOptions from "./SelectOptions";
import SwitchOptions from "./SwitchOptions";
import TableOptions from "./TableOptions";
import TabsOptions from "./TabsOptions";
import TextOptions from "./TextOptions";

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

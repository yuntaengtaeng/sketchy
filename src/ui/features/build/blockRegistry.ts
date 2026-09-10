import type { ComponentType } from "react";
import type { BlockType, Element as SketchyElement } from "../../../shared";
import ButtonOptions from "./ButtonOptions";
import SectionOptions from "./SectionOptions";

export type BlockOptionsProps = { element: SketchyElement };

export const BLOCK_OPTIONS: Partial<
  Record<BlockType, ComponentType<BlockOptionsProps>>
> = {
  button: ButtonOptions,
  section: SectionOptions,
};

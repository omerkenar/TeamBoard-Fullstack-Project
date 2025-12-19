declare module "vue-dndrop" {
  import type { DefineComponent } from "vue";

  export const Container: DefineComponent<Record<string, unknown>, {}, any>;
  export const Draggable: DefineComponent<Record<string, unknown>, {}, any>;
}


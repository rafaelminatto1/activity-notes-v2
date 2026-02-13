import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";

function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  };
}

export { customRender as render };
export * from "@testing-library/react";
export { userEvent };

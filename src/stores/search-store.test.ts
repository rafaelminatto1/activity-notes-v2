import { useSearchStore } from "./search-store";

beforeEach(() => {
  useSearchStore.setState({ isOpen: false });
});

describe("Search Store", () => {
  it("toggles isOpen", () => {
    useSearchStore.getState().toggle();
    expect(useSearchStore.getState().isOpen).toBe(true);
    useSearchStore.getState().toggle();
    expect(useSearchStore.getState().isOpen).toBe(false);
  });

  it("opens", () => {
    useSearchStore.getState().open();
    expect(useSearchStore.getState().isOpen).toBe(true);
  });

  it("closes", () => {
    useSearchStore.setState({ isOpen: true });
    useSearchStore.getState().close();
    expect(useSearchStore.getState().isOpen).toBe(false);
  });
});

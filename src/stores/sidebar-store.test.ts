import {
  useSidebarStore,
  MIN_WIDTH,
  MAX_WIDTH,
  DEFAULT_WIDTH,
} from "./sidebar-store";

beforeEach(() => {
  useSidebarStore.setState({
    isOpen: true,
    isResizing: false,
    width: DEFAULT_WIDTH,
    isMobileOpen: false,
  });
});

describe("Sidebar Store — constants", () => {
  it("exports expected constants", () => {
    expect(MIN_WIDTH).toBe(240);
    expect(MAX_WIDTH).toBe(480);
    expect(DEFAULT_WIDTH).toBe(300);
  });
});

describe("Sidebar Store — toggle/open/close", () => {
  it("toggles", () => {
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isOpen).toBe(false);
    useSidebarStore.getState().toggle();
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it("opens", () => {
    useSidebarStore.setState({ isOpen: false });
    useSidebarStore.getState().open();
    expect(useSidebarStore.getState().isOpen).toBe(true);
  });

  it("closes", () => {
    useSidebarStore.getState().close();
    expect(useSidebarStore.getState().isOpen).toBe(false);
  });
});

describe("Sidebar Store — setWidth clamped 240-480", () => {
  it("sets width within range", () => {
    useSidebarStore.getState().setWidth(350);
    expect(useSidebarStore.getState().width).toBe(350);
  });

  it("clamps to MIN_WIDTH", () => {
    useSidebarStore.getState().setWidth(100);
    expect(useSidebarStore.getState().width).toBe(MIN_WIDTH);
  });

  it("clamps to MAX_WIDTH", () => {
    useSidebarStore.getState().setWidth(600);
    expect(useSidebarStore.getState().width).toBe(MAX_WIDTH);
  });
});

describe("Sidebar Store — mobile", () => {
  it("toggles mobile", () => {
    useSidebarStore.getState().toggleMobile();
    expect(useSidebarStore.getState().isMobileOpen).toBe(true);
    useSidebarStore.getState().toggleMobile();
    expect(useSidebarStore.getState().isMobileOpen).toBe(false);
  });

  it("closes mobile", () => {
    useSidebarStore.setState({ isMobileOpen: true });
    useSidebarStore.getState().closeMobile();
    expect(useSidebarStore.getState().isMobileOpen).toBe(false);
  });
});

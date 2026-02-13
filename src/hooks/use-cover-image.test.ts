import { useCoverImage } from "./use-cover-image";

beforeEach(() => {
  useCoverImage.setState({ isOpen: false });
});

describe("useCoverImage", () => {
  it("starts closed", () => {
    expect(useCoverImage.getState().isOpen).toBe(false);
  });

  it("onOpen opens", () => {
    useCoverImage.getState().onOpen();
    expect(useCoverImage.getState().isOpen).toBe(true);
  });

  it("onClose closes", () => {
    useCoverImage.setState({ isOpen: true });
    useCoverImage.getState().onClose();
    expect(useCoverImage.getState().isOpen).toBe(false);
  });
});

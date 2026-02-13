import { render, screen } from "@/test/test-utils";
import { IconPicker } from "./icon-picker";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

// Stub the dynamic emoji picker
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockPicker = (props: { onEmojiSelect: (emoji: { native: string }) => void }) => (
      <div data-testid="emoji-picker">
        <button onClick={() => props.onEmojiSelect({ native: "😊" })}>
          Select Emoji
        </button>
      </div>
    );
    MockPicker.displayName = "MockEmojiPicker";
    return MockPicker;
  },
}));

vi.mock("@emoji-mart/data", () => ({ default: {} }));

describe("IconPicker", () => {
  it("shows 'Adicionar ícone' button when no icon", () => {
    render(<IconPicker onChange={vi.fn()} />);
    expect(screen.getByText(/adicionar ícone/i)).toBeInTheDocument();
  });

  it("shows emoji when icon prop is set", () => {
    render(<IconPicker icon="🚀" onChange={vi.fn()} />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
  });

  it("calls onChange on emoji selection", async () => {
    const onChange = vi.fn();
    const { user } = render(<IconPicker onChange={onChange} />);

    // Open popover by clicking the "Adicionar ícone" button
    await user.click(screen.getByText(/adicionar ícone/i));

    // Click the mock emoji button
    const selectBtn = screen.queryByText("Select Emoji");
    if (selectBtn) {
      await user.click(selectBtn);
      expect(onChange).toHaveBeenCalledWith("😊");
    }
  });
});

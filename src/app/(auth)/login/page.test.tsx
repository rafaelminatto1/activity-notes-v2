import { render, screen, waitFor } from "@/test/test-utils";
import LoginPage from "./page";

const { mockPush, mockSignInWithEmail, mockSignInWithGoogle, mockResetPassword, mockToast } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignInWithEmail: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
  mockResetPassword: vi.fn(),
  mockToast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/firebase/auth", () => ({
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  signInWithGoogle: () => mockSignInWithGoogle(),
  resetPassword: (...args: unknown[]) => mockResetPassword(...args),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LoginPage", () => {
  it("renders email and password inputs", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
  });

  it("renders Entrar submit button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("renders Continuar com Google button", () => {
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /continuar com google/i })).toBeInTheDocument();
  });

  it("renders Criar conta link with href /register", () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: /criar conta/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("shows error toast on empty email", async () => {
    const { user } = render(<LoginPage />);
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(mockToast.error).toHaveBeenCalledWith("Insira seu e-mail.");
  });

  it("shows error toast on empty password", async () => {
    const { user } = render(<LoginPage />);
    await user.type(screen.getByLabelText("E-mail"), "test@email.com");
    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(mockToast.error).toHaveBeenCalledWith("Insira sua senha.");
  });

  it("calls signInWithEmail and navigates on success", async () => {
    mockSignInWithEmail.mockResolvedValue({});
    const { user } = render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "test@email.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith("test@email.com", "password123");
      expect(mockPush).toHaveBeenCalledWith("/documents");
    });
  });

  it("calls signInWithGoogle and navigates on success", async () => {
    mockSignInWithGoogle.mockResolvedValue({});
    const { user } = render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /continuar com google/i }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/documents");
    });
  });

  it("Esqueceu a senha? opens dialog, Enviar calls resetPassword", async () => {
    mockResetPassword.mockResolvedValue(undefined);
    const { user } = render(<LoginPage />);

    // Click "Esqueceu a senha?"
    await user.click(screen.getByText("Esqueceu a senha?"));

    // Dialog should be open with "Recuperar senha" title
    await waitFor(() => {
      expect(screen.getByText("Recuperar senha")).toBeInTheDocument();
    });

    // Type email in the dialog input and submit
    const dialogEmailInput = screen.getAllByPlaceholderText("seu@email.com").pop()!;
    await user.type(dialogEmailInput, "reset@email.com");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith("reset@email.com");
    });
  });
});

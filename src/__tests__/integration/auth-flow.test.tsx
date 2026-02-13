import { render, screen, waitFor } from "@/test/test-utils";

const { mockPush, mockSignUpWithEmail, mockSignInWithEmail, mockSignInWithGoogle, mockToast } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockSignUpWithEmail: vi.fn(),
  mockSignInWithEmail: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
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
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/firebase/auth", () => ({
  signUpWithEmail: (...args: unknown[]) => mockSignUpWithEmail(...args),
  signInWithEmail: (...args: unknown[]) => mockSignInWithEmail(...args),
  signInWithGoogle: () => mockSignInWithGoogle(),
  resetPassword: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: mockToast }));

// Lazy imports to allow mocks to be set up first
let RegisterPage: React.ComponentType;
let LoginPage: React.ComponentType;

beforeAll(async () => {
  RegisterPage = (await import("@/app/(auth)/register/page")).default;
  LoginPage = (await import("@/app/(auth)/login/page")).default;
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Auth Flow — Register", () => {
  it("full register: fill Nome/E-mail/Senha/Confirmar senha → Criar conta → signUpWithEmail → /documents", async () => {
    mockSignUpWithEmail.mockResolvedValue({});
    const { user } = render(<RegisterPage />);

    await user.type(screen.getByLabelText("Nome"), "João Silva");
    await user.type(screen.getByLabelText("E-mail"), "joao@email.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Confirmar senha"), "password123");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));

    await waitFor(() => {
      expect(mockSignUpWithEmail).toHaveBeenCalledWith("joao@email.com", "password123", "João Silva");
      expect(mockPush).toHaveBeenCalledWith("/documents");
    });
  });

  it("validation cascade: empty name → empty email → short password → mismatch", async () => {
    const { user } = render(<RegisterPage />);

    // 1. Empty name
    await user.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(mockToast.error).toHaveBeenCalledWith("Insira seu nome.");

    // 2. Fill name, empty email
    vi.clearAllMocks();
    await user.type(screen.getByLabelText("Nome"), "João");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(mockToast.error).toHaveBeenCalledWith("Insira seu e-mail.");

    // 3. Fill email, short password
    vi.clearAllMocks();
    await user.type(screen.getByLabelText("E-mail"), "joao@email.com");
    await user.type(screen.getByLabelText("Senha"), "short");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(mockToast.error).toHaveBeenCalledWith("A senha deve ter pelo menos 8 caracteres.");

    // 4. Fill valid password, mismatched confirm
    vi.clearAllMocks();
    await user.clear(screen.getByLabelText("Senha"));
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.type(screen.getByLabelText("Confirmar senha"), "different");
    await user.click(screen.getByRole("button", { name: /criar conta/i }));
    expect(mockToast.error).toHaveBeenCalledWith("As senhas não coincidem.");
  });
});

describe("Auth Flow — Login", () => {
  it("full login: fill E-mail/Senha → Entrar → signInWithEmail → /documents", async () => {
    mockSignInWithEmail.mockResolvedValue({});
    const { user } = render(<LoginPage />);

    await user.type(screen.getByLabelText("E-mail"), "test@email.com");
    await user.type(screen.getByLabelText("Senha"), "mypassword");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(mockSignInWithEmail).toHaveBeenCalledWith("test@email.com", "mypassword");
      expect(mockPush).toHaveBeenCalledWith("/documents");
    });
  });
});

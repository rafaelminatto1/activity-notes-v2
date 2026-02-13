export const mockPush = vi.fn();
export const mockReplace = vi.fn();
export const mockBack = vi.fn();
export const mockRefresh = vi.fn();

export const useRouter = vi.fn().mockReturnValue({
  push: mockPush,
  replace: mockReplace,
  back: mockBack,
  refresh: mockRefresh,
  prefetch: vi.fn(),
});

export const usePathname = vi.fn().mockReturnValue("/");
export const useSearchParams = vi.fn().mockReturnValue(new URLSearchParams());
export const redirect = vi.fn();

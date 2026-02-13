import { cn } from "./utils";

describe("cn()", () => {
  it("merges classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe(
      "base visible"
    );
  });

  it("resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles empty arguments", () => {
    expect(cn()).toBe("");
  });

  it("handles null and undefined", () => {
    expect(cn("a", null, undefined, "b")).toBe("a b");
  });

  it("resolves complex Tailwind conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

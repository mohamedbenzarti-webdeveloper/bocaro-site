// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "../Pagination";
import { rendreAvecLangue } from "../../tests/utils";

describe("Pagination", () => {
  it("n'affiche rien s'il n'y a qu'une page", () => {
    const { container } = rendreAvecLangue(<Pagination page={1} nbPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("affiche un bouton par page et marque la page courante", () => {
    rendreAvecLangue(<Pagination page={2} nbPages={4} onChange={() => {}} />);
    expect(screen.getByRole("navigation", { name: "Pages des produits" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Page \d$/ })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 3" })).not.toHaveAttribute("aria-current");
  });

  it("désactive Précédent sur la première page et Suivant sur la dernière", () => {
    const { rerender } = rendreAvecLangue(<Pagination page={1} nbPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Précédent/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Suivant/ })).toBeEnabled();
    rerender(<Pagination page={3} nbPages={3} onChange={() => {}} />);
    expect(screen.getByRole("button", { name: /Précédent/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Suivant/ })).toBeDisabled();
  });

  it("signale la page demandée", async () => {
    const onChange = vi.fn();
    rendreAvecLangue(<Pagination page={2} nbPages={4} onChange={onChange} />);
    const u = userEvent.setup();
    await u.click(screen.getByRole("button", { name: /Précédent/ }));
    await u.click(screen.getByRole("button", { name: /Suivant/ }));
    await u.click(screen.getByRole("button", { name: "Page 4" }));
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([1, 3, 4]);
  });

  it("est traduite en arabe", () => {
    rendreAvecLangue(<Pagination page={1} nbPages={2} onChange={() => {}} />, { locale: "ar" });
    expect(screen.queryByText(/Précédent/)).not.toBeInTheDocument();
  });
});

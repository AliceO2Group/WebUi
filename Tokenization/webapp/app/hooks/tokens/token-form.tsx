import { useContext } from "react";
import { TokenFormContext } from "~/contexts/tokens/token-form";

export function useTokenForm() {
  const ctx = useContext(TokenFormContext);
  if (!ctx) throw new Error('useTokenForm must be used inside TokenFormProvider');
  return ctx;
}
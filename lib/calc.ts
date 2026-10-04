import type { DocumentItem } from "./types";

export const TAX_RATE = 0.1; // MVPでは消費税10%固定

export function calcSubtotal(items: Pick<DocumentItem, "unit_price" | "quantity">[]) {
  return items.reduce((sum, item) => {
    const price = Number(item.unit_price) || 0;
    const qty = Number(item.quantity) || 0;
    return sum + price * qty;
  }, 0);
}

export function calcTax(subtotal: number) {
  return Math.round(subtotal * TAX_RATE);
}

export function calcTotal(subtotal: number, tax: number) {
  return subtotal + tax;
}

export function calcTotals(items: Pick<DocumentItem, "unit_price" | "quantity">[]) {
  const subtotal = calcSubtotal(items);
  const tax = calcTax(subtotal);
  const total = calcTotal(subtotal, tax);
  return { subtotal, tax, total };
}

export function formatCurrency(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

/** 同じtypeの既存件数からドキュメント番号を採番する（例: Q-0001 / INV-0001 / P-0001） */
export function nextDocNumber(type: "quote" | "invoice" | "proposal", existingCount: number) {
  const prefix = type === "quote" ? "Q" : type === "invoice" ? "INV" : "P";
  const seq = String(existingCount + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}

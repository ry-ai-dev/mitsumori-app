"use client";

import type { DocumentItem } from "@/lib/types";
import { formatCurrency } from "@/lib/calc";

type Props = {
  items: DocumentItem[];
  onChange: (items: DocumentItem[]) => void;
};

export default function DocumentItemsForm({ items, onChange }: Props) {
  function updateItem(index: number, patch: Partial<DocumentItem>) {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  }

  function addItem() {
    onChange([
      ...items,
      { description: "", unit_price: 0, quantity: 1, sort_order: items.length },
    ]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return; // 最低1行は残す
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1 mb-1">
        <div className="col-span-6">品目</div>
        <div className="col-span-2 text-right">単価</div>
        <div className="col-span-2 text-right">数量</div>
        <div className="col-span-1 text-right">小計</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const lineTotal = (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
          return (
            <div key={index} className="grid grid-cols-12 gap-2 items-center">
              <input
                className="input col-span-6"
                placeholder="品目名"
                required
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
              />
              <input
                type="number"
                min={0}
                step="1"
                className="input col-span-2 text-right"
                value={item.unit_price}
                onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
              />
              <input
                type="number"
                min={0}
                step="1"
                className="input col-span-2 text-right"
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
              />
              <div className="col-span-1 text-right text-sm text-gray-600">
                {formatCurrency(lineTotal)}
              </div>
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-30 text-sm"
                  aria-label="この行を削除"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={addItem} className="btn-secondary mt-3 text-sm">
        + 項目を追加
      </button>
    </div>
  );
}

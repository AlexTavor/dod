/** Move `fromId` to the slot of `toId`, returning a new id list (drag-to-reorder). */
export function reorder(ids: string[], fromId: string, toId: string): string[] {
  const out = [...ids];
  const from = out.indexOf(fromId);
  const to = out.indexOf(toId);
  if (from < 0 || to < 0 || fromId === toId) return out;
  const [moved] = out.splice(from, 1);
  out.splice(to, 0, moved);
  return out;
}

/** Payload canonique signé pour intégrité CDC (ordre des clés stable). */
export type LotSignPayload = {
  client_lot_id: string;
  culture: string;
  variete?: string;
  quantite: number;
  lieu: string;
  latitude: number;
  longitude: number;
  parcelle?: string;
  date_recolte: string;
  notes?: string;
  actor_id: string;
};

export function canonicalLotPayload(p: LotSignPayload): string {
  const ordered: Record<string, string | number> = {
    actor_id: p.actor_id,
    client_lot_id: p.client_lot_id,
    culture: p.culture,
    date_recolte: p.date_recolte,
    latitude: p.latitude,
    longitude: p.longitude,
    lieu: p.lieu,
    quantite: p.quantite,
  };
  if (p.variete) ordered.variete = p.variete;
  if (p.parcelle) ordered.parcelle = p.parcelle;
  if (p.notes) ordered.notes = p.notes;
  return JSON.stringify(ordered);
}

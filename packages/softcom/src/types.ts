/** Standard v1 response envelope. */
export interface SoftcomEnvelope<T> {
  code: number;
  message: string;
  human: string;
  data: T;
  hasData: boolean;
  meta?: {
    page?: { current: number; prev: number | null; next: number | null; count: number; record_count: number };
  };
  date_sync?: number;
}

export interface SoftcomTokenData {
  token: string;
  expires_in: number;
  type: string;
}

/** GET /api/funcionario item (Vendedor). */
export interface SoftcomVendedor {
  id: number;
  nome: string;
  email?: string | null;
  desativado?: boolean;
  LojaOrigem?: string | null;
  Comissao?: number;
  Vendas360SellerId?: string | null;
}

/**
 * GET /api/reports/rankingvendedor item.
 * Real Selfhost shape is `{ Order, SellerName, Data: { DataType, Value } }` —
 * there is NO vendedor id, only the seller's name. Older/alt field names kept
 * for tolerance.
 */
export interface SoftcomRankingVendedor {
  Order?: number;
  SellerName?: string;
  Data?: { DataType?: string; Value?: number } | null;
  // tolerant fallbacks (other instances / endpoints)
  vendedor_id?: number;
  VendedorId?: number;
  id?: number;
  nome?: string;
  Nome?: string;
  total?: number;
  Total?: number;
  valor?: number;
  Valor?: number;
  posicao?: number;
  Posicao?: number;
}

/** GET /api/reports/kpi item. */
export interface SoftcomKpi {
  Key: string;
  CurrentData: { DataType: string; Value: number };
  LastMonthData?: { DataType: string; Value: number };
}

/** GET /api/reports/evolution item. */
export interface SoftcomEvolution {
  Year: number;
  Month: number;
  MonthName: string;
  Data: { DataType: string; Value: number };
  DataBudget?: { DataType: string; Value: number };
  DataSales?: { DataType: string; Value: number };
}

/** v2 pre-venda item (subset used for aggregation). */
export interface SoftcomPreVendaV2 {
  id: number;
  vendedor?: { id: number; nome: string } | null;
  funcionario?: { id: number; nome: string } | null;
  valor?: string | number;
  api_data_hora_venda?: string;
  cancelada?: boolean;
  created_at?: string;
}

/** Parsed components of a pasted /device/add URL. */
export interface ParsedDeviceUrl {
  urlBase: string;
  instance: string;
  clientId: string;
  empresaName: string | null;
  empresaCnpj: string | null;
  deviceName: string;
}

/** data block returned by POST /device/add. */
export interface SoftcomDeviceData {
  client_id: string;
  client_secret: string;
  device_id: string;
  device_name?: string;
  empresa_id: number;
  empresa_name?: string;
  empresa_cnpj?: string;
  resources?: {
    url_base?: string;
    path_api?: string;
    path_authentication?: string;
    path_device?: string;
    retaguarda?: string;
  };
}
